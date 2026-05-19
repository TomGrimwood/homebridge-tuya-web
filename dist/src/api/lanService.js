"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanTuyaWebApi = void 0;
const tuyapi_1 = __importDefault(require("tuyapi"));
const response_1 = require("./response");
const DeviceOfflineError_1 = require("../errors/DeviceOfflineError");
const DEFAULT_PROTOCOL_VERSION = "3.3";
const CONNECT_TIMEOUT_MS = 5000;
/** How long to coalesce rapid SETs (slider drag → many fine-grained updates). */
const SET_COALESCE_MS = 60;
/** Min interval between SET commands actually sent to the device. */
const MIN_SET_INTERVAL_MS = 80;
/** Backoff schedule for reconnects (ms). After the last entry we keep using it. */
const RECONNECT_BACKOFF_MS = [500, 1000, 2000, 5000, 10000, 30000];
/** How long the cached state remains valid for HomeKit GET while disconnected. */
const STALE_STATE_GRACE_MS = 60000;
/**
 * Default DPS number → instruction-code mappings, by device type. The
 * mapping for any specific device can be overridden in config via
 * `dps_map`. These defaults cover the most common Tuya light, switch,
 * outlet, fan, and cover firmwares.
 */
const DEFAULT_DPS_MAPS = {
    light: {
        20: "switch_led",
        21: "work_mode",
        22: "bright_value_v2",
        23: "temp_value_v2",
        24: "colour_data_v2",
        25: "scene_data_v2",
        26: "countdown_1",
    },
    dimmer: {
        1: "switch_led",
        2: "bright_value",
        3: "brightness_min",
        4: "brightness_max",
    },
    switch: {
        1: "switch_1",
        2: "switch_2",
        3: "switch_3",
        4: "switch_4",
        5: "switch_5",
        6: "switch_6",
        9: "countdown_1",
    },
    outlet: {
        1: "switch_1",
        9: "countdown_1",
    },
    fan: {
        1: "switch",
        3: "fan_speed_percent",
        101: "speed",
    },
    cover: {
        1: "control",
        2: "percent_control",
        3: "percent_state",
        4: "control_back",
        5: "work_state",
        7: "countdown",
    },
    window: {
        1: "control",
        2: "percent_control",
        3: "percent_state",
    },
    garage: {
        1: "switch_1",
    },
    climate: {
        1: "switch",
        2: "temp_set",
        3: "temp_current",
        4: "mode",
    },
    temperature_sensor: {
        1: "temp_current",
    },
    scene: {},
};
class LanTuyaWebApi {
    constructor(devices, log) {
        this.devices = devices;
        this.log = log;
        this.connections = new Map();
        for (const dev of devices) {
            const connection = this.createConnection(dev);
            this.connections.set(dev.id, connection);
            // Kick off initial connect immediately so the device is ready by the
            // time HomeKit asks for state.
            void this.ensureConnected(dev.id).catch(() => {
                /* error already logged */
            });
        }
    }
    createConnection(dev) {
        var _a;
        const tuya = new tuyapi_1.default({
            id: dev.id,
            key: dev.local_key,
            ip: dev.ip,
            version: (_a = dev.version) !== null && _a !== void 0 ? _a : DEFAULT_PROTOCOL_VERSION,
            issueGetOnConnect: true,
            nullPayloadOnJSONError: true,
        });
        const connection = {
            config: dev,
            tuya,
            lastStateAt: 0,
            reconnectAttempts: 0,
            pendingSet: {},
            setInFlight: Promise.resolve(),
            lastSetAt: 0,
        };
        tuya.on("connected", () => {
            var _a, _b;
            connection.reconnectAttempts = 0;
            (_a = this.log) === null || _a === void 0 ? void 0 : _a.info("[%s] LAN connected (%s)", (_b = dev.name) !== null && _b !== void 0 ? _b : dev.id, dev.ip);
        });
        tuya.on("disconnected", () => {
            var _a, _b;
            if (connection.closing) {
                return;
            }
            (_a = this.log) === null || _a === void 0 ? void 0 : _a.warn("[%s] LAN disconnected; auto-reconnecting in background", (_b = dev.name) !== null && _b !== void 0 ? _b : dev.id);
            connection.connecting = undefined;
            this.scheduleReconnect(connection);
        });
        tuya.on("error", (err) => {
            var _a, _b;
            const msg = err instanceof Error ? err.message : String(err);
            (_a = this.log) === null || _a === void 0 ? void 0 : _a.debug("[%s] LAN error: %s", (_b = dev.name) !== null && _b !== void 0 ? _b : dev.id, msg);
        });
        tuya.on("data", (data) => {
            var _a, _b;
            if (data === null || data === void 0 ? void 0 : data.dps) {
                connection.lastState = this.translateDpsToDeviceState(data.dps, dev, connection.lastState);
                connection.lastStateAt = Date.now();
                (_a = this.log) === null || _a === void 0 ? void 0 : _a.debug("[%s] LAN state push: %s", (_b = dev.name) !== null && _b !== void 0 ? _b : dev.id, JSON.stringify(data.dps));
            }
        });
        return connection;
    }
    scheduleReconnect(connection) {
        if (connection.reconnectTimer !== undefined || connection.closing) {
            return;
        }
        const idx = Math.min(connection.reconnectAttempts, RECONNECT_BACKOFF_MS.length - 1);
        const delay = RECONNECT_BACKOFF_MS[idx];
        connection.reconnectAttempts += 1;
        connection.reconnectTimer = setTimeout(() => {
            connection.reconnectTimer = undefined;
            void this.ensureConnected(connection.config.id).catch(() => {
                /* will reschedule via disconnected event */
            });
        }, delay);
    }
    /**
     * No-op for LAN mode. Kept for interface parity with the cloud TuyaWebApi.
     */
    getOrRefreshToken() {
        var _a;
        if (this.devices.length === 0) {
            return Promise.reject(new Error("localOnly mode is enabled but no `devices` were configured. " +
                "Each device needs id, local_key, and ip."));
        }
        (_a = this.log) === null || _a === void 0 ? void 0 : _a.info("LAN-only mode: managing %d device(s) without any cloud access", this.devices.length);
        return Promise.resolve();
    }
    async discoverDevices() {
        var _a, _b, _c, _d;
        const out = [];
        for (const dev of this.devices) {
            const devType = (_a = dev.device_type) !== null && _a !== void 0 ? _a : "light";
            let state = { online: false };
            try {
                const conn = await this.ensureConnected(dev.id);
                if (conn.lastState) {
                    state = conn.lastState;
                }
                else {
                    // Force a read so we have an initial state for HomeKit
                    const got = await conn.tuya.get({ schema: true });
                    if (got && typeof got === "object" && "dps" in got) {
                        state = this.translateDpsToDeviceState(got.dps, dev);
                        conn.lastState = state;
                    }
                }
                state.online = true;
            }
            catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                (_b = this.log) === null || _b === void 0 ? void 0 : _b.warn("[%s] could not connect on startup (%s); device will appear offline", (_c = dev.name) !== null && _c !== void 0 ? _c : dev.id, msg);
            }
            out.push({
                id: dev.id,
                name: (_d = dev.name) !== null && _d !== void 0 ? _d : dev.id,
                dev_type: devType,
                ha_type: response_1.DEV_TYPE_TO_HA_TYPE[devType],
                data: state,
            });
        }
        return out;
    }
    async getAllDeviceStates() {
        return this.discoverDevices();
    }
    async getDeviceState(deviceId) {
        var _a, _b, _c;
        const conn = this.connections.get(deviceId);
        if (!conn) {
            throw new Error(`Unknown device ${deviceId}`);
        }
        // Fast path: if we already have a recent cached state, return it
        // without waiting for a fresh round-trip. HomeKit fires GET on
        // every characteristic in parallel; previously each one would race
        // to reconnect and overflow the device with simultaneous requests.
        if (conn.lastState !== undefined &&
            Date.now() - conn.lastStateAt < STALE_STATE_GRACE_MS) {
            conn.lastState.online = true;
            return conn.lastState;
        }
        try {
            await this.ensureConnected(deviceId);
        }
        catch (e) {
            // Connection failed AND cache is stale → reply with last-known
            // state if we have any, so HomeKit doesn't spam "No Response".
            if (conn.lastState) {
                const stale = { ...conn.lastState, online: true };
                (_a = this.log) === null || _a === void 0 ? void 0 : _a.debug("[%s] LAN unreachable; returning stale cached state", deviceId);
                return stale;
            }
            const msg = e instanceof Error ? e.message : String(e);
            (_b = this.log) === null || _b === void 0 ? void 0 : _b.debug("[%s] LAN unreachable: %s", deviceId, msg);
            throw new DeviceOfflineError_1.DeviceOfflineError();
        }
        if (conn.lastState) {
            conn.lastState.online = true;
            return conn.lastState;
        }
        try {
            const got = await conn.tuya.get({ schema: true });
            if (got && typeof got === "object" && "dps" in got) {
                const state = this.translateDpsToDeviceState(got.dps, conn.config);
                state.online = true;
                conn.lastState = state;
                conn.lastStateAt = Date.now();
                return state;
            }
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            (_c = this.log) === null || _c === void 0 ? void 0 : _c.warn("[%s] LAN get failed: %s", deviceId, msg);
        }
        throw new DeviceOfflineError_1.DeviceOfflineError();
    }
    async setDeviceState(deviceId, method, payload) {
        var _a, _b;
        const conn = this.connections.get(deviceId);
        if (!conn) {
            throw new Error(`Unknown device ${deviceId}`);
        }
        const commands = this.translateMethodToCommands(conn.config, method, payload);
        const dpsMap = this.codeToDpsMap(conn.config);
        for (const { code, value } of commands) {
            const dp = dpsMap.get(code);
            if (dp === undefined) {
                (_a = this.log) === null || _a === void 0 ? void 0 : _a.warn("[%s] No DPS mapping for code '%s'; skipping", (_b = conn.config.name) !== null && _b !== void 0 ? _b : deviceId, code);
                continue;
            }
            // Merge into pending — later writes to the same DP overwrite
            // earlier ones, which is exactly what we want for slider drags.
            conn.pendingSet[String(dp)] = value;
        }
        if (Object.keys(conn.pendingSet).length === 0) {
            return;
        }
        // Optimistically update the cached state so the next GET reflects
        // the user's intent even before the device has applied the change.
        conn.lastState = this.translateDpsToDeviceState(conn.pendingSet, conn.config, conn.lastState);
        conn.lastStateAt = Date.now();
        return this.scheduleFlush(conn);
    }
    /**
     * Coalesce rapid SETs into a single TuyAPI .set() call. Returns a
     * promise that resolves once *some* flush containing this set has
     * been acknowledged by the device.
     */
    scheduleFlush(conn) {
        if (!conn.flushPromise) {
            conn.flushPromise = new Promise((resolve, reject) => {
                conn.flushResolve = resolve;
                conn.flushReject = reject;
            });
        }
        if (conn.pendingFlushTimer) {
            // already scheduled — just wait for it
            return conn.flushPromise;
        }
        conn.pendingFlushTimer = setTimeout(() => {
            conn.pendingFlushTimer = undefined;
            void this.flushPending(conn);
        }, SET_COALESCE_MS);
        return conn.flushPromise;
    }
    async flushPending(conn) {
        const resolve = conn.flushResolve;
        const reject = conn.flushReject;
        const data = conn.pendingSet;
        conn.pendingSet = {};
        conn.flushPromise = undefined;
        conn.flushResolve = undefined;
        conn.flushReject = undefined;
        if (Object.keys(data).length === 0) {
            resolve === null || resolve === void 0 ? void 0 : resolve();
            return;
        }
        // Serialize through setInFlight so we don't pipeline multiple
        // writes to the same TuyAPI socket (which is unhappy doing so).
        conn.setInFlight = conn.setInFlight
            .catch(() => undefined)
            .then(async () => {
            var _a, _b;
            // Enforce a minimum interval between writes — without this,
            // a back-to-back colour-temp + brightness flush can confuse
            // some Tuya firmware and the bulb just drops the second one.
            const elapsed = Date.now() - conn.lastSetAt;
            if (elapsed < MIN_SET_INTERVAL_MS) {
                await sleep(MIN_SET_INTERVAL_MS - elapsed);
            }
            await this.ensureConnected(conn.config.id);
            (_a = this.log) === null || _a === void 0 ? void 0 : _a.debug("[%s] LAN set %s", (_b = conn.config.name) !== null && _b !== void 0 ? _b : conn.config.id, JSON.stringify(data));
            await conn.tuya.set({
                multiple: true,
                data: data,
            });
            conn.lastSetAt = Date.now();
        });
        try {
            await conn.setInFlight;
            resolve === null || resolve === void 0 ? void 0 : resolve();
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            if (/offline|timeout|ECONNREFUSED|ETIMEDOUT|EHOSTUNREACH/i.test(msg)) {
                reject === null || reject === void 0 ? void 0 : reject(new DeviceOfflineError_1.DeviceOfflineError());
            }
            else {
                reject === null || reject === void 0 ? void 0 : reject(e);
            }
        }
    }
    /**
     * Best-effort: returns whether the LAN side has at least one connection up.
     * Mainly useful for diagnostics.
     */
    anyConnected() {
        for (const conn of this.connections.values()) {
            if (conn.tuya.isConnected()) {
                return true;
            }
        }
        return false;
    }
    // -------------------------------------------------------------------------
    // Internal connection management
    async ensureConnected(deviceId) {
        const conn = this.connections.get(deviceId);
        if (!conn) {
            throw new Error(`Unknown device ${deviceId}`);
        }
        if (conn.tuya.isConnected()) {
            return conn;
        }
        if (!conn.connecting) {
            conn.connecting = (async () => {
                const ip = conn.config.ip;
                if (!ip) {
                    await conn.tuya.find({ timeout: CONNECT_TIMEOUT_MS / 1000 });
                }
                await conn.tuya.connect();
            })().catch((e) => {
                conn.connecting = undefined;
                // Schedule next reconnect after a backoff, then re-throw.
                this.scheduleReconnect(conn);
                throw e;
            });
        }
        await conn.connecting;
        return conn;
    }
    // -------------------------------------------------------------------------
    // DPS ↔ DeviceState translation
    dpsMapFor(dev) {
        var _a, _b;
        const devType = (_a = dev.device_type) !== null && _a !== void 0 ? _a : "light";
        const base = (_b = DEFAULT_DPS_MAPS[devType]) !== null && _b !== void 0 ? _b : DEFAULT_DPS_MAPS.light;
        if (!dev.dps_map) {
            return base;
        }
        return { ...base, ...dev.dps_map };
    }
    codeToDpsMap(dev) {
        const m = new Map();
        for (const [dpsStr, code] of Object.entries(this.dpsMapFor(dev))) {
            m.set(code, Number(dpsStr));
        }
        return m;
    }
    translateDpsToDeviceState(dps, dev, base) {
        var _a, _b, _c, _d, _e;
        const state = base ? { ...base } : { online: true };
        const mapping = this.dpsMapFor(dev);
        for (const [dpsKey, value] of Object.entries(dps)) {
            const code = mapping[Number(dpsKey)];
            if (!code) {
                continue;
            }
            switch (code) {
                case "switch_led":
                case "switch_1":
                case "switch":
                    state.state = value;
                    break;
                case "bright_value":
                    state.brightness = Math.round((value - 10) / 245 * 990 + 10);
                    break;
                case "bright_value_v2":
                    state.brightness = value;
                    break;
                case "colour_data":
                case "colour_data_v2": {
                    const isV1 = code === "colour_data";
                    const obj = typeof value === "string"
                        ? JSON.parse(value)
                        : value;
                    state.color = {
                        hue: String((_a = obj.h) !== null && _a !== void 0 ? _a : 0),
                        saturation: isV1
                            ? String(Math.round((((_b = obj.s) !== null && _b !== void 0 ? _b : 0) / 255) * 100))
                            : String(Math.round(((_c = obj.s) !== null && _c !== void 0 ? _c : 0) / 10)),
                        brightness: isV1
                            ? String(Math.round((((_d = obj.v) !== null && _d !== void 0 ? _d : 0) / 255) * 1000))
                            : String((_e = obj.v) !== null && _e !== void 0 ? _e : 0),
                    };
                    break;
                }
                case "temp_value":
                    state.color_temp = Math.round((value / 255) * 1000);
                    break;
                case "temp_value_v2":
                    state.color_temp = value;
                    break;
                case "work_mode":
                    state.color_mode = value;
                    break;
                case "fan_speed_percent":
                case "speed":
                    state.speed = value;
                    break;
                case "speed_level":
                    state.speed_level = value;
                    break;
                case "temp_set":
                    state.temperature = value;
                    break;
                case "temp_current":
                    state.current_temperature = value;
                    break;
                case "mode":
                    state.mode = value;
                    break;
                case "control":
                    if (value === "open") {
                        state.state = response_1.CoverState.Opening;
                    }
                    else if (value === "close") {
                        state.state = response_1.CoverState.Closing;
                    }
                    else if (value === "stop") {
                        state.state = response_1.CoverState.Stopped;
                    }
                    break;
                case "percent_state": {
                    const n = Number(value);
                    if (Number.isFinite(n)) {
                        state.brightness = n;
                    }
                    break;
                }
            }
        }
        return state;
    }
    translateMethodToCommands(dev, method, payload) {
        var _a, _b;
        const devType = (_a = dev.device_type) !== null && _a !== void 0 ? _a : "light";
        const mapping = this.dpsMapFor(dev);
        const codes = new Set(Object.values(mapping));
        switch (method) {
            case "turnOnOff": {
                const p = payload;
                const on = p.value === 1;
                if ((devType === "cover" || devType === "window") &&
                    codes.has("control")) {
                    return [{ code: "control", value: on ? "open" : "close" }];
                }
                // Pick whichever on/off code this device has.
                for (const code of ["switch_led", "switch_1", "switch"]) {
                    if (codes.has(code)) {
                        return [{ code, value: on }];
                    }
                }
                return [{ code: "switch_1", value: on }];
            }
            case "brightnessSet": {
                const p = payload;
                if (codes.has("bright_value_v2")) {
                    return [{ code: "bright_value_v2", value: Math.round(p.value) }];
                }
                if (codes.has("bright_value")) {
                    const v1 = Math.round(((p.value - 10) / 990) * 245 + 10);
                    return [{ code: "bright_value", value: v1 }];
                }
                return [{ code: "bright_value_v2", value: Math.round(p.value) }];
            }
            case "colorSet": {
                const p = payload;
                const useV1 = !codes.has("colour_data_v2") && codes.has("colour_data");
                const colorData = useV1
                    ? {
                        h: Math.round(p.color.hue),
                        s: Math.round(p.color.saturation * 255),
                        v: Math.round((p.color.brightness / 1000) * 255),
                    }
                    : {
                        h: Math.round(p.color.hue),
                        s: Math.round(p.color.saturation * 1000),
                        v: Math.round(p.color.brightness),
                    };
                const cmds = [];
                if (codes.has("work_mode")) {
                    cmds.push({ code: "work_mode", value: "colour" });
                }
                cmds.push({
                    code: useV1 ? "colour_data" : "colour_data_v2",
                    value: JSON.stringify(colorData),
                });
                return cmds;
            }
            case "colorTemperatureSet": {
                const p = payload;
                const useV1 = !codes.has("temp_value_v2") && codes.has("temp_value");
                const cmds = [];
                if (codes.has("work_mode")) {
                    cmds.push({ code: "work_mode", value: "white" });
                }
                cmds.push({
                    code: useV1 ? "temp_value" : "temp_value_v2",
                    value: Math.round(useV1 ? (p.value / 1000) * 255 : p.value),
                });
                return cmds;
            }
            case "windSpeedSet": {
                const p = payload;
                if (codes.has("fan_speed_percent")) {
                    return [{ code: "fan_speed_percent", value: p.value }];
                }
                return [{ code: "speed", value: p.value }];
            }
            case "modeSet": {
                const p = payload;
                return [{ code: "mode", value: p.value }];
            }
            case "temperatureSet": {
                const p = payload;
                return [{ code: "temp_set", value: p.value }];
            }
            case "startStop":
                return [{ code: "control", value: "stop" }];
            default:
                (_b = this.log) === null || _b === void 0 ? void 0 : _b.warn("Unknown API method: %s", method);
                return [];
        }
    }
}
exports.LanTuyaWebApi = LanTuyaWebApi;
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=lanService.js.map