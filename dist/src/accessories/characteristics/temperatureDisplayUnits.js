"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemperatureDisplayUnitsCharacteristic = void 0;
const base_1 = require("./base");
class TemperatureDisplayUnitsCharacteristic extends base_1.TuyaWebCharacteristic {
    static HomekitCharacteristic(accessory) {
        return accessory.platform.Characteristic.TemperatureDisplayUnits;
    }
    static isSupportedByAccessory() {
        return true;
    }
    getRemoteValue(callback) {
        this.updateValue(undefined, callback);
    }
    get TemperatureDisplayUnits() {
        return this.accessory.platform.Characteristic.TemperatureDisplayUnits;
    }
    updateValue(data, callback) {
        callback && callback(null, this.TemperatureDisplayUnits.CELSIUS);
    }
}
exports.TemperatureDisplayUnitsCharacteristic = TemperatureDisplayUnitsCharacteristic;
TemperatureDisplayUnitsCharacteristic.Title = "Characteristic.TemperatureDisplayUnits";
//# sourceMappingURL=temperatureDisplayUnits.js.map