"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentTemperatureCharacteristic = void 0;
const base_1 = require("./base");
class CurrentTemperatureCharacteristic extends base_1.TuyaWebCharacteristic {
    static HomekitCharacteristic(accessory) {
        return accessory.platform.Characteristic.CurrentTemperature;
    }
    setProps(char) {
        //Roughly the coldest and hottest temperatures ever recorded on earth.
        return char === null || char === void 0 ? void 0 : char.setProps({
            minValue: -100,
            maxValue: 150,
        });
    }
    static isSupportedByAccessory(accessory) {
        return accessory.deviceConfig.data.current_temperature !== undefined;
    }
    getRemoteValue(callback) {
        this.accessory
            .getDeviceState()
            .then((data) => {
            this.debug("[GET] %s", data === null || data === void 0 ? void 0 : data.current_temperature);
            this.updateValue(data, callback);
        })
            .catch(this.accessory.handleError("GET", callback));
    }
    updateValue(data, callback) {
        let currentTemperature = (data === null || data === void 0 ? void 0 : data.current_temperature)
            ? Number(data === null || data === void 0 ? void 0 : data.current_temperature) *
                this.accessory.currentTemperatureFactor
            : undefined;
        if (currentTemperature) {
            currentTemperature = Math.round(currentTemperature * 10) / 10;
            this.debug("[UPDATE] %s", currentTemperature);
            this.accessory.setCharacteristic(this.homekitCharacteristic, currentTemperature, !callback);
            callback && callback(null, currentTemperature);
        }
        else {
            callback && callback(new Error("Could not get temperature from data"));
        }
    }
}
exports.CurrentTemperatureCharacteristic = CurrentTemperatureCharacteristic;
CurrentTemperatureCharacteristic.Title = "Characteristic.CurrentTemperature";
//# sourceMappingURL=currentTemperature.js.map