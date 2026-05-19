"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TuyaWebApi = void 0;
const errors_1 = require("../errors");
const customerApi_1 = require("./customerApi");
const loginControl_1 = require("./loginControl");
const response_1 = require("./response");
const DeviceOfflineError_1 = require("../errors/DeviceOfflineError");
const errors_2 = require("../errors");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const qrcode_1 = __importDefault(require("qrcode"));
class TuyaWebApi {
    constructor(userCode, storagePath, log) {
        this.userCode = userCode;
        this.storagePath = storagePath;
        this.log = log;
        this.deviceCodeMap = new Map();
        this.terminalId = "";
        this.endpoint = "";
        this.tokenFilePath = path.join(storagePath, "tuya-sharing-tokens.json");
    }
    updateToken(tokenInfo) {
        this.saveTokens({
            user_code: this.userCode,
            token_info: tokenInfo,
            terminal_id: this.terminalId,
            endpoint: this.endpoint,
        });
    }
    async getOrRefreshToken() {
        var _a, _b, _c;
        const saved = this.loadTokens();
        if (saved && saved.user_code === this.userCode) {
            (_a = this.log) === null || _a === void 0 ? void 0 : _a.info("Found saved Tuya tokens, attempting to use them...");
            this.terminalId = saved.terminal_id;
            this.endpoint = saved.endpoint;
            this.customerApi = new customerApi_1.CustomerApi(saved.token_info, "HA_3y9q4ak7g4ephrvke", this.userCode, saved.endpoint, this, this.log);
            try {
                await this.customerApi.refreshAccessTokenIfNeeded();
                (_b = this.log) === null || _b === void 0 ? void 0 : _b.info("Successfully connected with saved Tuya tokens");
                return;
            }
            catch (e) {
                (_c = this.log) === null || _c === void 0 ? void 0 : _c.warn("Saved tokens expired or invalid, starting QR code login: %s", e instanceof Error ? e.message : String(e));
            }
        }
        await this.performQrLogin();
    }
    async performQrLogin() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
        const loginControl = new loginControl_1.LoginControl();
        const { token, qrData } = await loginControl.generateQrCode(this.userCode, this.log);
        (_a = this.log) === null || _a === void 0 ? void 0 : _a.info("========================================");
        (_b = this.log) === null || _b === void 0 ? void 0 : _b.info("  TUYA SMART LIFE PAIRING REQUIRED");
        (_c = this.log) === null || _c === void 0 ? void 0 : _c.info("========================================");
        (_d = this.log) === null || _d === void 0 ? void 0 : _d.info("Please scan the QR code below with your Smart Life app:");
        (_e = this.log) === null || _e === void 0 ? void 0 : _e.info("  1. Open the Smart Life app on your phone");
        (_f = this.log) === null || _f === void 0 ? void 0 : _f.info("  2. Tap 'Me' → Scan QR Code");
        (_g = this.log) === null || _g === void 0 ? void 0 : _g.info("  3. Scan the QR code displayed below");
        (_h = this.log) === null || _h === void 0 ? void 0 : _h.info("  4. Confirm the authorization in the app");
        (_j = this.log) === null || _j === void 0 ? void 0 : _j.info("----------------------------------------");
        (_k = this.log) === null || _k === void 0 ? void 0 : _k.info("QR setup payload (paste into any QR generator if needed):");
        (_l = this.log) === null || _l === void 0 ? void 0 : _l.info("%s", qrData);
        try {
            const qrText = await qrcode_1.default.toString(qrData, {
                type: "terminal",
                small: true,
            });
            for (const line of qrText.split("\n")) {
                (_m = this.log) === null || _m === void 0 ? void 0 : _m.info(line);
            }
        }
        catch (_s) {
            (_o = this.log) === null || _o === void 0 ? void 0 : _o.info("QR Data: %s", qrData);
        }
        (_p = this.log) === null || _p === void 0 ? void 0 : _p.info("----------------------------------------");
        (_q = this.log) === null || _q === void 0 ? void 0 : _q.info("Waiting for you to scan (up to 5 minutes)...");
        const loginResult = await loginControl.waitForLogin(token, this.userCode, this.log);
        (_r = this.log) === null || _r === void 0 ? void 0 : _r.info("Login successful! Connected as: %s", loginResult.username || loginResult.uid);
        this.setupFromLoginResult(loginResult);
    }
    setupFromLoginResult(result) {
        const tokenInfo = {
            t: result.t,
            expire_time: result.t + result.expire_time * 1000,
            uid: result.uid,
            access_token: result.access_token,
            refresh_token: result.refresh_token,
        };
        this.terminalId = result.terminal_id;
        this.endpoint = result.endpoint;
        this.customerApi = new customerApi_1.CustomerApi(tokenInfo, "HA_3y9q4ak7g4ephrvke", this.userCode, result.endpoint, this, this.log);
        this.saveTokens({
            user_code: this.userCode,
            token_info: tokenInfo,
            terminal_id: result.terminal_id,
            endpoint: result.endpoint,
        });
    }
    // -------------------------------------------------------
    // Device Discovery & Control
    // -------------------------------------------------------
    async getAllDeviceStates() {
        return this.discoverDevices();
    }
    async discoverDevices() {
        var _a, _b, _c, _d, _e, _f, _g;
        if (!this.customerApi) {
            throw new errors_2.AuthenticationError("Not authenticated");
        }
        (_a = this.log) === null || _a === void 0 ? void 0 : _a.debug("Discovering devices via Smart Life API...");
        const homes = await this.queryHomes();
        if (homes.length === 0) {
            (_b = this.log) === null || _b === void 0 ? void 0 : _b.warn("No homes found. Make sure you have homes set up in your Smart Life app.");
            return [];
        }
        (_c = this.log) === null || _c === void 0 ? void 0 : _c.info("Found %d home(s)", homes.length);
        const allDevices = [];
        for (const home of homes) {
            (_d = this.log) === null || _d === void 0 ? void 0 : _d.debug("Fetching devices for home: %s", home.name);
            const cloudDevices = await this.queryDevicesByHome(home.id);
            for (const cd of cloudDevices) {
                const devType = this.resolveDeviceType(cd.category);
                const statusItems = (_e = cd.status) !== null && _e !== void 0 ? _e : [];
                const codeMapping = this.buildCodeMapping(cd.category, devType, statusItems);
                this.deviceCodeMap.set(cd.id, codeMapping);
                const deviceState = this.translateStatusToDeviceState(statusItems, cd.online);
                allDevices.push({
                    id: cd.id,
                    name: cd.name,
                    dev_type: devType,
                    ha_type: response_1.DEV_TYPE_TO_HA_TYPE[devType],
                    data: deviceState,
                });
                (_f = this.log) === null || _f === void 0 ? void 0 : _f.debug("Device [%s] category=%s → dev_type=%s (codes: %s)", cd.name, cd.category, devType, statusItems.map((s) => s.code).join(", "));
            }
        }
        (_g = this.log) === null || _g === void 0 ? void 0 : _g.info("Found %d device(s) total", allDevices.length);
        return allDevices;
    }
    async getDeviceState(deviceId) {
        var _a, _b;
        if (!this.customerApi) {
            throw new errors_2.AuthenticationError("Not authenticated");
        }
        const response = await this.customerApi.get("/v1.0/m/life/ha/devices/detail", { devIds: deviceId });
        if (!response.success || !((_a = response.result) === null || _a === void 0 ? void 0 : _a.length)) {
            throw new Error(`Failed to get device state for ${deviceId}`);
        }
        const device = response.result[0];
        const statusItems = (_b = device.status) !== null && _b !== void 0 ? _b : [];
        if (!this.deviceCodeMap.has(deviceId) && statusItems.length > 0) {
            const devType = this.resolveDeviceType(device.category);
            this.deviceCodeMap.set(deviceId, this.buildCodeMapping(device.category, devType, statusItems));
        }
        return this.translateStatusToDeviceState(statusItems, device.online);
    }
    async setDeviceState(deviceId, method, payload) {
        var _a;
        if (!this.customerApi) {
            throw new errors_2.AuthenticationError("Not authenticated");
        }
        const commands = this.translateMethodToCommands(deviceId, method, payload);
        (_a = this.log) === null || _a === void 0 ? void 0 : _a.debug("Sending commands to device %s: %s", deviceId, JSON.stringify(commands));
        try {
            await this.customerApi.post(`/v1.1/m/thing/${deviceId}/commands`, undefined, { commands });
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            if (msg.includes("2009") || msg.includes("UnsupportedOperation")) {
                throw new errors_1.UnsupportedOperationError("Unsupported operation", msg);
            }
            if (msg.includes("1100") || msg.includes("1101") || msg.includes("FrequentlyInvoke")) {
                throw new errors_1.RateLimitError("Rate limited", msg);
            }
            if (msg.includes("2013") || msg.includes("TargetOffline")) {
                throw new DeviceOfflineError_1.DeviceOfflineError();
            }
            throw e;
        }
    }
    // -------------------------------------------------------
    // Private: Smart Life API calls
    // -------------------------------------------------------
    async queryHomes() {
        const response = await this.customerApi.get("/v1.0/m/life/users/homes");
        if (!response.success || !Array.isArray(response.result)) {
            return [];
        }
        return response.result.map((h) => ({
            id: String(h.ownerId),
            name: h.name,
        }));
    }
    async queryDevicesByHome(homeId) {
        const response = await this.customerApi.get("/v1.0/m/life/ha/home/devices", { homeId });
        if (!response.success || !Array.isArray(response.result)) {
            return [];
        }
        return response.result.map((d) => {
            const status = [];
            if (Array.isArray(d.status)) {
                for (const s of d.status) {
                    if (typeof s === "object" &&
                        s !== null &&
                        "code" in s &&
                        "value" in s) {
                        status.push({ code: s.code, value: s.value });
                    }
                }
            }
            return { ...d, status };
        });
    }
    // -------------------------------------------------------
    // Private: Translation logic
    // -------------------------------------------------------
    resolveDeviceType(category) {
        var _a;
        return (_a = response_1.CATEGORY_TO_DEV_TYPE[category]) !== null && _a !== void 0 ? _a : "switch";
    }
    buildCodeMapping(category, devType, status) {
        const codes = status.map((s) => s.code);
        const mapping = {
            category,
            devType,
            switchCode: "switch",
        };
        if (codes.includes("switch_led")) {
            mapping.switchCode = "switch_led";
        }
        else if (codes.includes("switch_1")) {
            mapping.switchCode = "switch_1";
        }
        else if (codes.includes("switch")) {
            mapping.switchCode = "switch";
        }
        if (codes.includes("bright_value_v2")) {
            mapping.brightnessCode = "bright_value_v2";
        }
        else if (codes.includes("bright_value")) {
            mapping.brightnessCode = "bright_value";
            mapping.brightnessIsV1 = true;
        }
        if (codes.includes("colour_data_v2")) {
            mapping.colourCode = "colour_data_v2";
        }
        else if (codes.includes("colour_data")) {
            mapping.colourCode = "colour_data";
            mapping.colourIsV1 = true;
        }
        if (codes.includes("temp_value_v2")) {
            mapping.tempValueCode = "temp_value_v2";
        }
        else if (codes.includes("temp_value")) {
            mapping.tempValueCode = "temp_value";
            mapping.tempIsV1 = true;
        }
        if (codes.includes("work_mode")) {
            mapping.workModeCode = "work_mode";
        }
        if (codes.includes("fan_speed_percent")) {
            mapping.fanSpeedCode = "fan_speed_percent";
        }
        else if (codes.includes("speed")) {
            mapping.fanSpeedCode = "speed";
        }
        if (codes.includes("control")) {
            mapping.controlCode = "control";
        }
        return mapping;
    }
    translateStatusToDeviceState(status, online) {
        var _a, _b, _c, _d, _e, _f;
        const state = { online };
        for (const { code, value } of status) {
            switch (code) {
                case "switch_led":
                case "switch_1":
                case "switch":
                    state.state = value;
                    break;
                case "bright_value":
                    // v1 range 10-255 → normalize to 10-1000
                    state.brightness = Math.round((value - 10) / 245 * 990 + 10);
                    break;
                case "bright_value_v2":
                    state.brightness = value;
                    break;
                case "colour_data": {
                    // v1: h 0-360, s 0-255, v 0-255
                    const c1 = typeof value === "string"
                        ? JSON.parse(value)
                        : value;
                    state.color = {
                        hue: String((_a = c1.h) !== null && _a !== void 0 ? _a : 0),
                        saturation: String(Math.round((((_b = c1.s) !== null && _b !== void 0 ? _b : 0) / 255) * 100)),
                        brightness: String(Math.round((((_c = c1.v) !== null && _c !== void 0 ? _c : 0) / 255) * 1000)),
                    };
                    break;
                }
                case "colour_data_v2": {
                    // v2: h 0-360, s 0-1000, v 0-1000
                    const c2 = typeof value === "string"
                        ? JSON.parse(value)
                        : value;
                    state.color = {
                        hue: String((_d = c2.h) !== null && _d !== void 0 ? _d : 0),
                        saturation: String(Math.round(((_e = c2.s) !== null && _e !== void 0 ? _e : 0) / 10)),
                        brightness: String((_f = c2.v) !== null && _f !== void 0 ? _f : 0),
                    };
                    break;
                }
                case "temp_value":
                    // v1 range 0-255 → normalize to 0-1000
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
                case "upper_temp":
                    state.max_temper = value;
                    break;
                case "lower_temp":
                    state.min_temper = value;
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
                case "support_stop":
                    state.support_stop = value;
                    break;
            }
        }
        return state;
    }
    translateMethodToCommands(deviceId, method, payload) {
        var _a, _b, _c, _d, _e, _f, _g;
        const meta = this.deviceCodeMap.get(deviceId);
        switch (method) {
            case "turnOnOff": {
                const p = payload;
                const on = p.value === 1;
                if ((meta === null || meta === void 0 ? void 0 : meta.controlCode) &&
                    (meta.devType === "cover" || meta.devType === "window")) {
                    return [{ code: meta.controlCode, value: on ? "open" : "close" }];
                }
                return [{ code: (_a = meta === null || meta === void 0 ? void 0 : meta.switchCode) !== null && _a !== void 0 ? _a : "switch", value: on }];
            }
            case "brightnessSet": {
                const p = payload;
                let bv = p.value;
                if (meta === null || meta === void 0 ? void 0 : meta.brightnessIsV1) {
                    // v2 range 10-1000 → v1 range 10-255
                    bv = (bv - 10) / 990 * 245 + 10;
                }
                return [
                    {
                        code: (_b = meta === null || meta === void 0 ? void 0 : meta.brightnessCode) !== null && _b !== void 0 ? _b : "bright_value_v2",
                        value: Math.round(bv),
                    },
                ];
            }
            case "colorSet": {
                const p = payload;
                let sv;
                let vv;
                if (meta === null || meta === void 0 ? void 0 : meta.colourIsV1) {
                    // saturation: 0-1 → 0-255, brightness: 0-1000 → 0-255
                    sv = Math.round(p.color.saturation * 255);
                    vv = Math.round((p.color.brightness / 1000) * 255);
                }
                else {
                    sv = Math.round(p.color.saturation * 1000);
                    vv = Math.round(p.color.brightness);
                }
                const colorData = {
                    h: Math.round(p.color.hue),
                    s: sv,
                    v: vv,
                };
                const colorCmds = [];
                if (meta === null || meta === void 0 ? void 0 : meta.workModeCode) {
                    colorCmds.push({ code: meta.workModeCode, value: "colour" });
                }
                colorCmds.push({
                    code: (_c = meta === null || meta === void 0 ? void 0 : meta.colourCode) !== null && _c !== void 0 ? _c : "colour_data_v2",
                    value: JSON.stringify(colorData),
                });
                return colorCmds;
            }
            case "colorTemperatureSet": {
                const p = payload;
                let tv = p.value;
                if (meta === null || meta === void 0 ? void 0 : meta.tempIsV1) {
                    // v2 range 0-1000 → v1 range 0-255
                    tv = (tv / 1000) * 255;
                }
                const tempCmds = [];
                if (meta === null || meta === void 0 ? void 0 : meta.workModeCode) {
                    tempCmds.push({ code: meta.workModeCode, value: "white" });
                }
                tempCmds.push({
                    code: (_d = meta === null || meta === void 0 ? void 0 : meta.tempValueCode) !== null && _d !== void 0 ? _d : "temp_value_v2",
                    value: Math.round(tv),
                });
                return tempCmds;
            }
            case "windSpeedSet": {
                const p = payload;
                return [
                    {
                        code: (_e = meta === null || meta === void 0 ? void 0 : meta.fanSpeedCode) !== null && _e !== void 0 ? _e : "fan_speed_percent",
                        value: p.value,
                    },
                ];
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
                return [{ code: (_f = meta === null || meta === void 0 ? void 0 : meta.controlCode) !== null && _f !== void 0 ? _f : "control", value: "stop" }];
            default:
                (_g = this.log) === null || _g === void 0 ? void 0 : _g.warn("Unknown API method: %s", method);
                return [];
        }
    }
    // -------------------------------------------------------
    // Token persistence
    // -------------------------------------------------------
    loadTokens() {
        var _a;
        try {
            if (fs.existsSync(this.tokenFilePath)) {
                const data = fs.readFileSync(this.tokenFilePath, "utf8");
                return JSON.parse(data);
            }
        }
        catch (e) {
            (_a = this.log) === null || _a === void 0 ? void 0 : _a.debug("Could not load saved tokens: %s", e instanceof Error ? e.message : String(e));
        }
        return null;
    }
    saveTokens(data) {
        var _a, _b;
        try {
            fs.writeFileSync(this.tokenFilePath, JSON.stringify(data, null, 2));
            (_a = this.log) === null || _a === void 0 ? void 0 : _a.debug("Tokens saved to %s", this.tokenFilePath);
        }
        catch (e) {
            (_b = this.log) === null || _b === void 0 ? void 0 : _b.warn("Could not save tokens: %s", e instanceof Error ? e.message : String(e));
        }
    }
}
exports.TuyaWebApi = TuyaWebApi;
//# sourceMappingURL=service.js.map