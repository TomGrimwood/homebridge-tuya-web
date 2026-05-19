"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemperatureSensorAccessory = void 0;
const characteristics_1 = require("./characteristics");
const BaseAccessory_1 = require("./BaseAccessory");
class TemperatureSensorAccessory extends BaseAccessory_1.BaseAccessory {
    constructor(platform, homebridgeAccessory, deviceConfig) {
        super(platform, homebridgeAccessory, deviceConfig, 10 /* Categories.SENSOR */);
    }
    get currentTemperatureFactor() {
        var _a;
        if ((_a = this.deviceConfig.config) === null || _a === void 0 ? void 0 : _a.current_temperature_factor) {
            return Number(this.deviceConfig.config.current_temperature_factor);
        }
        return 1;
    }
    validateConfigOverwrites(config) {
        const errors = super.validateConfigOverwrites(config);
        if (config === null || config === void 0 ? void 0 : config.current_temperature_factor) {
            const tempFactor = Number(config.current_temperature_factor);
            if (!tempFactor) {
                errors.push("Wrong value configured for `current_temperature_factor`, should be a number");
            }
            else {
                config.current_temperature_factor = tempFactor;
            }
        }
        return errors;
    }
    get accessorySupportedCharacteristics() {
        return [characteristics_1.CurrentTemperatureCharacteristic];
    }
    get requiredCharacteristics() {
        return [characteristics_1.CurrentTemperatureCharacteristic];
    }
}
exports.TemperatureSensorAccessory = TemperatureSensorAccessory;
//# sourceMappingURL=TemperatureSensorAccessory.js.map