"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LightAccessory = void 0;
const characteristics_1 = require("./characteristics");
const ColorAccessory_1 = require("./ColorAccessory");
class LightAccessory extends ColorAccessory_1.ColorAccessory {
    constructor(platform, homebridgeAccessory, deviceConfig) {
        super(platform, homebridgeAccessory, deviceConfig, 5 /* Categories.LIGHTBULB */);
    }
    get accessorySupportedCharacteristics() {
        return [
            characteristics_1.OnCharacteristic,
            characteristics_1.BrightnessCharacteristic,
            characteristics_1.ColorTemperatureCharacteristic,
            characteristics_1.HueCharacteristic,
            characteristics_1.SaturationCharacteristic,
        ];
    }
    get requiredCharacteristics() {
        return [characteristics_1.OnCharacteristic];
    }
    get deviceSupportedCharacteristics() {
        var _a, _b, _c;
        // Get supported characteristics from configuration
        if (Array.isArray((_a = this.deviceConfig.config) === null || _a === void 0 ? void 0 : _a.light_characteristics)) {
            const supportedCharacteristics = [];
            const configuredCharacteristics = (_c = (_b = this.deviceConfig.config) === null || _b === void 0 ? void 0 : _b.light_characteristics) !== null && _c !== void 0 ? _c : [];
            if (configuredCharacteristics.includes("Brightness")) {
                supportedCharacteristics.push(characteristics_1.BrightnessCharacteristic);
            }
            if (configuredCharacteristics.includes("Color")) {
                supportedCharacteristics.push(characteristics_1.HueCharacteristic);
                supportedCharacteristics.push(characteristics_1.SaturationCharacteristic);
            }
            if (configuredCharacteristics.includes("Color Temperature")) {
                supportedCharacteristics.push(characteristics_1.ColorTemperatureCharacteristic);
            }
            return supportedCharacteristics;
        }
        return super.deviceSupportedCharacteristics;
    }
}
exports.LightAccessory = LightAccessory;
//# sourceMappingURL=LightAccessory.js.map