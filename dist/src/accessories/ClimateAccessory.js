"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClimateAccessory = void 0;
const characteristics_1 = require("./characteristics");
const BaseAccessory_1 = require("./BaseAccessory");
class ClimateAccessory extends BaseAccessory_1.BaseAccessory {
    constructor(platform, homebridgeAccessory, deviceConfig) {
        super(platform, homebridgeAccessory, deviceConfig, 9 /* Categories.THERMOSTAT */);
    }
    get targetTemperatureFactor() {
        var _a;
        if ((_a = this.deviceConfig.config) === null || _a === void 0 ? void 0 : _a.target_temperature_factor) {
            return Number(this.deviceConfig.config.target_temperature_factor);
        }
        return 1;
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
        if (config === null || config === void 0 ? void 0 : config.min_temper) {
            const minTemp = Number(config.min_temper);
            if (!minTemp) {
                errors.push("Wrong value configured for `min_temper`, should be a number");
            }
            else {
                //Ensure that the min temp is a multiple of 0.5;
                config.min_temper = Math.round(minTemp * 2) / 2;
            }
        }
        if (config === null || config === void 0 ? void 0 : config.max_temper) {
            const maxTemp = Number(config.max_temper);
            if (!maxTemp) {
                errors.push("Wrong value configured for `max_temper`, should be a number");
            }
            else {
                //Ensure that the min temp is a multiple of 0.5;
                config.max_temper = Math.round(maxTemp * 2) / 2;
            }
        }
        if (config === null || config === void 0 ? void 0 : config.target_temperature_factor) {
            const tempFactor = Number(config.target_temperature_factor);
            if (!tempFactor) {
                errors.push("Wrong value configured for `target_temperature_factor`, should be a number");
            }
            else {
                config.target_temperature_factor = tempFactor;
            }
        }
        if (config === null || config === void 0 ? void 0 : config.current_temperature_factor) {
            const tempFactor = Number(config.current_temperature_factor);
            if (!tempFactor) {
                errors.push("Wrong value configured for `current_temperature_factor`, should be a number");
            }
            else {
                config.current_temperature_factor = tempFactor;
            }
        }
        if (errors.length) {
            //Return early to let users fix basic errors.
            return errors;
        }
        if ((config === null || config === void 0 ? void 0 : config.min_temper) &&
            (config === null || config === void 0 ? void 0 : config.max_temper) &&
            config.min_temper >= config.max_temper) {
            errors.push("The minimum temperature is larger then the maximum temperature");
        }
        return errors;
    }
    get accessorySupportedCharacteristics() {
        return [
            characteristics_1.CurrentTemperatureCharacteristic,
            characteristics_1.TargetTemperatureCharacteristic,
            characteristics_1.CurrentHeatingCoolingStateCharacteristic,
            characteristics_1.TargetHeatingCoolingStateCharacteristic,
            characteristics_1.TemperatureDisplayUnitsCharacteristic,
        ];
    }
    get requiredCharacteristics() {
        return [
            characteristics_1.CurrentTemperatureCharacteristic,
            characteristics_1.TargetTemperatureCharacteristic,
            characteristics_1.CurrentHeatingCoolingStateCharacteristic,
            characteristics_1.TargetHeatingCoolingStateCharacteristic,
            characteristics_1.TemperatureDisplayUnitsCharacteristic,
        ];
    }
}
exports.ClimateAccessory = ClimateAccessory;
//# sourceMappingURL=ClimateAccessory.js.map