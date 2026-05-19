import { PlatformConfig } from "homebridge";
import { TuyaDeviceType } from "./api/response";

export interface TuyaDeviceDefaults {
  id: string;
  device_type: TuyaDeviceType;
  min_temper: string | number;
  max_temper: string | number;
  current_temperature_factor: string | number;
  target_temperature_factor: string | number;
  dimmer_characteristics: "Brightness"[];
  fan_characteristics: "Speed"[];
  light_characteristics: ("Brightness" | "Color" | "Color Temperature")[];
  cover_characteristics: "Stop"[];
  min_brightness: string | number;
  max_brightness: string | number;
  min_kelvin: string | number;
  max_kelvin: string | number;
}

/**
 * Per-device configuration for LAN-only mode.
 * `id` and `local_key` are mandatory; `ip` is strongly recommended (UDP
 * discovery is unreliable on segregated VLANs).
 */
export interface LanDeviceConfig {
  /** Tuya virtual device id, e.g. "eb119c7e19b2e1f2a6gdmp". */
  id: string;
  /** 16-character AES key from the Tuya cloud or `tuya-cli wizard`. */
  local_key: string;
  /** LAN IP of the device. Optional, but recommended. */
  ip?: string;
  /** Human-friendly name shown in HomeKit. */
  name?: string;
  /** Tuya protocol version. Defaults to "3.3" (most common). */
  version?: string;
  /** What kind of accessory this device should appear as in HomeKit. */
  device_type?: TuyaDeviceType;
  /**
   * Optional DPS-number → instruction-code map overrides, for devices
   * that don't match the defaults baked into the plugin.
   * Example: { "20": "switch_led", "22": "bright_value_v2" }
   */
  dps_map?: Record<string, string>;
}

interface Config {
  options?: {
    /**
     * If true, the plugin will NOT contact any Tuya cloud endpoint.
     * Requires a non-empty `devices` array with id+local_key+ip for each
     * device.
     */
    localOnly?: boolean;
    userCode?: string;
    pollingInterval?: number;
  };
  /** Required when `options.localOnly === true`. */
  devices?: LanDeviceConfig[];
  defaults?: Partial<TuyaDeviceDefaults>[];
  scenes?: boolean | string[];
}

export type TuyaWebConfig = PlatformConfig & Config;
