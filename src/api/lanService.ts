/**
 * Pure-LAN implementation of the Tuya Web API surface.
 *
 * Implements the same public methods as TuyaWebApi (cloud) so the rest of
 * the plugin doesn't need to know which transport is in use. Communicates
 * directly with Tuya devices on the local network over TCP/6668 using
 * TuyAPI. No cloud connection is ever made.
 *
 * Requires the user to provide each device's id + local_key + ip in config.
 * Local key can be obtained one-time via the cloud API (or `tuya-cli wizard`)
 * and never needs to be touched again.
 */
import { Logger } from "homebridge";
import TuyAPI from "tuyapi";
import {
  CoverState,
  DEV_TYPE_TO_HA_TYPE,
  DeviceState,
  TuyaApiMethod,
  TuyaApiPayload,
  TuyaDevice,
  TuyaDeviceType,
} from "./response";
import { DeviceOfflineError } from "../errors/DeviceOfflineError";
import { LanDeviceConfig } from "../config";

const DEFAULT_PROTOCOL_VERSION = "3.3";
const CONNECT_TIMEOUT_MS = 5_000;

/**
 * Default DPS number → instruction-code mappings, by device type. The
 * mapping for any specific device can be overridden in config via
 * `dps_map`. These defaults cover the most common Tuya light, switch,
 * outlet, fan, and cover firmwares.
 */
const DEFAULT_DPS_MAPS: Record<TuyaDeviceType, Record<number, string>> = {
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

interface LanConnection {
  config: LanDeviceConfig;
  tuya: InstanceType<typeof TuyAPI>;
  /** Last state pushed from the device. */
  lastState?: DeviceState;
  /** Last `set` payload — used to merge into our cached state if device echo is slow. */
  pendingDps?: Record<string, unknown>;
  /** Promise resolving to ready-to-use (connected) TuyAPI instance. */
  connected?: Promise<void>;
  reconnectTimer?: NodeJS.Timeout;
}

export class LanTuyaWebApi {
  private connections = new Map<string, LanConnection>();

  constructor(
    private readonly devices: LanDeviceConfig[],
    private readonly log?: Logger,
  ) {
    for (const dev of devices) {
      const tuya = new TuyAPI({
        id: dev.id,
        key: dev.local_key,
        ip: dev.ip,
        version: dev.version ?? DEFAULT_PROTOCOL_VERSION,
        issueGetOnConnect: true,
        nullPayloadOnJSONError: true,
      });

      const connection: LanConnection = { config: dev, tuya };

      tuya.on("connected", () => {
        this.log?.info("[%s] LAN connected (%s)", dev.name ?? dev.id, dev.ip);
      });
      tuya.on("disconnected", () => {
        this.log?.warn(
          "[%s] LAN disconnected; will reconnect on next request",
          dev.name ?? dev.id,
        );
        connection.connected = undefined;
      });
      tuya.on("error", (err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.log?.debug("[%s] LAN error: %s", dev.name ?? dev.id, msg);
      });
      tuya.on("data", (data: { dps?: Record<string, unknown> }) => {
        if (data?.dps) {
          connection.lastState = this.translateDpsToDeviceState(
            data.dps,
            dev,
            connection.lastState,
          );
          this.log?.debug(
            "[%s] LAN state push: %s",
            dev.name ?? dev.id,
            JSON.stringify(data.dps),
          );
        }
      });

      this.connections.set(dev.id, connection);
    }
  }

  /**
   * No-op for LAN mode. Kept for interface parity with the cloud TuyaWebApi.
   */
  public getOrRefreshToken(): Promise<void> {
    if (this.devices.length === 0) {
      return Promise.reject(
        new Error(
          "localOnly mode is enabled but no `devices` were configured. " +
            "Each device needs id, local_key, and ip.",
        ),
      );
    }
    this.log?.info(
      "LAN-only mode: managing %d device(s) without any cloud access",
      this.devices.length,
    );
    return Promise.resolve();
  }

  public async discoverDevices(): Promise<TuyaDevice[]> {
    const out: TuyaDevice[] = [];
    for (const dev of this.devices) {
      const devType = dev.device_type ?? "light";
      let state: DeviceState = { online: false };
      try {
        const conn = await this.ensureConnected(dev.id);
        if (conn.lastState) {
          state = conn.lastState;
        } else {
          // Force a read so we have an initial state for HomeKit
          const got = await conn.tuya.get({ schema: true });
          if (got && typeof got === "object" && "dps" in got) {
            state = this.translateDpsToDeviceState(
              (got as { dps: Record<string, unknown> }).dps,
              dev,
            );
            conn.lastState = state;
          }
        }
        state.online = true;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        this.log?.warn(
          "[%s] could not connect on startup (%s); device will appear offline",
          dev.name ?? dev.id,
          msg,
        );
      }

      out.push({
        id: dev.id,
        name: dev.name ?? dev.id,
        dev_type: devType,
        ha_type: DEV_TYPE_TO_HA_TYPE[devType],
        data: state,
      });
    }
    return out;
  }

  public async getAllDeviceStates(): Promise<TuyaDevice[]> {
    return this.discoverDevices();
  }

  public async getDeviceState(deviceId: string): Promise<DeviceState> {
    const conn = this.connections.get(deviceId);
    if (!conn) {
      throw new Error(`Unknown device ${deviceId}`);
    }
    try {
      await this.ensureConnected(deviceId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.log?.debug("[%s] LAN unreachable: %s", deviceId, msg);
      throw new DeviceOfflineError();
    }

    if (conn.lastState) {
      conn.lastState.online = true;
      return conn.lastState;
    }

    try {
      const got = await conn.tuya.get({ schema: true });
      if (got && typeof got === "object" && "dps" in got) {
        const state = this.translateDpsToDeviceState(
          (got as { dps: Record<string, unknown> }).dps,
          conn.config,
        );
        state.online = true;
        conn.lastState = state;
        return state;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.log?.warn("[%s] LAN get failed: %s", deviceId, msg);
    }

    throw new DeviceOfflineError();
  }

  public async setDeviceState<Method extends TuyaApiMethod>(
    deviceId: string,
    method: Method,
    payload: TuyaApiPayload<Method>,
  ): Promise<void> {
    const conn = this.connections.get(deviceId);
    if (!conn) {
      throw new Error(`Unknown device ${deviceId}`);
    }

    const commands = this.translateMethodToCommands(
      conn.config,
      method,
      payload,
    );

    const dpsMap = this.codeToDpsMap(conn.config);
    const multiDps: Record<string, unknown> = {};
    for (const { code, value } of commands) {
      const dp = dpsMap.get(code);
      if (dp === undefined) {
        this.log?.warn(
          "[%s] No DPS mapping for code '%s'; skipping",
          conn.config.name ?? deviceId,
          code,
        );
        continue;
      }
      multiDps[String(dp)] = value;
    }

    if (Object.keys(multiDps).length === 0) {
      this.log?.warn(
        "[%s] No DPS commands resolved for method %s",
        conn.config.name ?? deviceId,
        method,
      );
      return;
    }

    try {
      await this.ensureConnected(deviceId);
      this.log?.debug(
        "[%s] LAN set %s",
        conn.config.name ?? deviceId,
        JSON.stringify(multiDps),
      );
      // TuyAPI's TS types require value to be string|number|boolean, but in
      // practice it accepts any JSON-serializable payload (and our DP map
      // can contain JSON-stringified objects for colour_data). Cast through
      // unknown to avoid the false-positive type error.
      await conn.tuya.set({
        multiple: true,
        data: multiDps as unknown as Record<string, string | number | boolean>,
      });
      // Optimistically merge the just-sent values into our cached state so
      // a subsequent getDeviceState() reflects the change immediately, even
      // if the device hasn't pushed an updated status frame yet.
      conn.lastState = this.translateDpsToDeviceState(
        multiDps,
        conn.config,
        conn.lastState,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/offline|timeout|ECONNREFUSED|ETIMEDOUT|EHOSTUNREACH/i.test(msg)) {
        throw new DeviceOfflineError();
      }
      throw e;
    }
  }

  /**
   * Best-effort: returns whether the LAN side has at least one connection up.
   * Mainly useful for diagnostics.
   */
  public anyConnected(): boolean {
    for (const conn of this.connections.values()) {
      if (conn.tuya.isConnected()) {return true;}
    }
    return false;
  }

  // -------------------------------------------------------------------------
  // Internal connection management

  private async ensureConnected(deviceId: string): Promise<LanConnection> {
    const conn = this.connections.get(deviceId);
    if (!conn) {throw new Error(`Unknown device ${deviceId}`);}
    if (conn.tuya.isConnected()) {return conn;}

    if (!conn.connected) {
      conn.connected = (async () => {
        const ip = conn.config.ip;
        if (!ip) {
          // No IP configured — try UDP discovery
          await conn.tuya.find({ timeout: CONNECT_TIMEOUT_MS / 1000 });
        }
        await conn.tuya.connect();
      })().catch((e: unknown) => {
        conn.connected = undefined;
        throw e;
      });
    }
    await conn.connected;
    return conn;
  }

  // -------------------------------------------------------------------------
  // DPS ↔ DeviceState translation

  private dpsMapFor(dev: LanDeviceConfig): Record<number, string> {
    const devType = dev.device_type ?? "light";
    const base = DEFAULT_DPS_MAPS[devType] ?? DEFAULT_DPS_MAPS.light;
    if (!dev.dps_map) {return base;}
    return { ...base, ...dev.dps_map };
  }

  private codeToDpsMap(dev: LanDeviceConfig): Map<string, number> {
    const m = new Map<string, number>();
    for (const [dpsStr, code] of Object.entries(this.dpsMapFor(dev))) {
      m.set(code, Number(dpsStr));
    }
    return m;
  }

  private translateDpsToDeviceState(
    dps: Record<string, unknown>,
    dev: LanDeviceConfig,
    base?: DeviceState,
  ): DeviceState {
    const state: DeviceState = base ? { ...base } : { online: true };
    const mapping = this.dpsMapFor(dev);

    for (const [dpsKey, value] of Object.entries(dps)) {
      const code = mapping[Number(dpsKey)];
      if (!code) {continue;}

      switch (code) {
        case "switch_led":
        case "switch_1":
        case "switch":
          state.state = value as boolean;
          break;

        case "bright_value":
          state.brightness = Math.round(
            ((value as number) - 10) / 245 * 990 + 10,
          );
          break;
        case "bright_value_v2":
          state.brightness = value as number;
          break;

        case "colour_data":
        case "colour_data_v2": {
          const isV1 = code === "colour_data";
          const obj: Record<string, number> =
            typeof value === "string"
              ? (JSON.parse(value) as Record<string, number>)
              : (value as Record<string, number>);
          state.color = {
            hue: String(obj.h ?? 0),
            saturation: isV1
              ? String(Math.round(((obj.s ?? 0) / 255) * 100))
              : String(Math.round((obj.s ?? 0) / 10)),
            brightness: isV1
              ? String(Math.round(((obj.v ?? 0) / 255) * 1000))
              : String(obj.v ?? 0),
          };
          break;
        }

        case "temp_value":
          state.color_temp = Math.round(((value as number) / 255) * 1000);
          break;
        case "temp_value_v2":
          state.color_temp = value as number;
          break;

        case "work_mode":
          state.color_mode = value as DeviceState["color_mode"];
          break;

        case "fan_speed_percent":
        case "speed":
          state.speed = value as number;
          break;

        case "speed_level":
          state.speed_level = value as number;
          break;

        case "temp_set":
          state.temperature = value as number;
          break;

        case "temp_current":
          state.current_temperature = value as number;
          break;

        case "mode":
          state.mode = value as DeviceState["mode"];
          break;

        case "control":
          if (value === "open") {state.state = CoverState.Opening;}
          else if (value === "close") {state.state = CoverState.Closing;}
          else if (value === "stop") {state.state = CoverState.Stopped;}
          break;

        case "percent_state": {
          const n = Number(value);
          if (Number.isFinite(n)) {state.brightness = n;}
          break;
        }
      }
    }

    return state;
  }

  private translateMethodToCommands(
    dev: LanDeviceConfig,
    method: TuyaApiMethod,
    payload: TuyaApiPayload<TuyaApiMethod>,
  ): { code: string; value: unknown }[] {
    const devType = dev.device_type ?? "light";
    const mapping = this.dpsMapFor(dev);
    const codes = new Set(Object.values(mapping));

    switch (method) {
      case "turnOnOff": {
        const p = payload as TuyaApiPayload<"turnOnOff">;
        const on = p.value === 1;
        if (
          (devType === "cover" || devType === "window") &&
          codes.has("control")
        ) {
          return [{ code: "control", value: on ? "open" : "close" }];
        }
        // Pick whichever on/off code this device has.
        for (const code of ["switch_led", "switch_1", "switch"]) {
          if (codes.has(code)) {return [{ code, value: on }];}
        }
        return [{ code: "switch_1", value: on }];
      }

      case "brightnessSet": {
        const p = payload as TuyaApiPayload<"brightnessSet">;
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
        const p = payload as TuyaApiPayload<"colorSet">;
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
        const cmds: { code: string; value: unknown }[] = [];
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
        const p = payload as TuyaApiPayload<"colorTemperatureSet">;
        const useV1 = !codes.has("temp_value_v2") && codes.has("temp_value");
        const cmds: { code: string; value: unknown }[] = [];
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
        const p = payload as TuyaApiPayload<"windSpeedSet">;
        if (codes.has("fan_speed_percent")) {
          return [{ code: "fan_speed_percent", value: p.value }];
        }
        return [{ code: "speed", value: p.value }];
      }

      case "modeSet": {
        const p = payload as TuyaApiPayload<"modeSet">;
        return [{ code: "mode", value: p.value }];
      }

      case "temperatureSet": {
        const p = payload as TuyaApiPayload<"temperatureSet">;
        return [{ code: "temp_set", value: p.value }];
      }

      case "startStop":
        return [{ code: "control", value: "stop" }];

      default:
        this.log?.warn("Unknown API method: %s", method);
        return [];
    }
  }
}
