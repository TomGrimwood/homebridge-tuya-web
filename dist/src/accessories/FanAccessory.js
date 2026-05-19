"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FanAccessory = void 0;
const BaseAccessory_1 = require("./BaseAccessory");
const characteristics_1 = require("./characteristics");
class FanAccessory extends BaseAccessory_1.BaseAccessory {
    constructor(platform, homebridgeAccessory, deviceConfig) {
        super(platform, homebridgeAccessory, deviceConfig, 3 /* Categories.FAN */);
    }
    get accessorySupportedCharacteristics() {
        return [characteristics_1.ActiveCharacteristic, characteristics_1.RotationSpeedCharacteristic];
    }
    get requiredCharacteristics() {
        return [characteristics_1.ActiveCharacteristic];
    }
    get deviceSupportedCharacteristics() {
        var _a, _b, _c;
        // Get supported characteristics from configuration
        if (Array.isArray((_a = this.deviceConfig.config) === null || _a === void 0 ? void 0 : _a.fan_characteristics)) {
            const supportedCharacteristics = [];
            const configuredCharacteristics = (_c = (_b = this.deviceConfig.config) === null || _b === void 0 ? void 0 : _b.fan_characteristics) !== null && _c !== void 0 ? _c : [];
            if (configuredCharacteristics.includes("Speed")) {
                supportedCharacteristics.push(characteristics_1.RotationSpeedCharacteristic);
            }
            return supportedCharacteristics;
        }
        return super.deviceSupportedCharacteristics;
    }
}
exports.FanAccessory = FanAccessory;
//# sourceMappingURL=FanAccessory.js.map