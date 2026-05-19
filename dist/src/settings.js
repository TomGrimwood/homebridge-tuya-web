"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TUYA_DEVICE_TIMEOUT = exports.TUYA_DISCOVERY_TIMEOUT = exports.VERSION = exports.PLUGIN_NAME = exports.PLATFORM_NAME = void 0;
const package_json_1 = __importDefault(require("../package.json"));
/**
 * This is the name of the platform that users will use to register the plugin in the Homebridge config.json
 */
exports.PLATFORM_NAME = package_json_1.default.displayName;
/**
 * This must match the name of your plugin as defined the package.json
 */
exports.PLUGIN_NAME = package_json_1.default.name;
/**
 * The version the package is currently on as defined in package.json
 */
exports.VERSION = package_json_1.default.version;
/**
 * The standard timeout for Tuya discovery requests
 */
exports.TUYA_DISCOVERY_TIMEOUT = 600;
/**
 * The standard timeout for Tuya device requests.
 */
exports.TUYA_DEVICE_TIMEOUT = 60;
//# sourceMappingURL=settings.js.map