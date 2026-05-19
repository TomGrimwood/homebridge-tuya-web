"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TargetTemperatureCharacteristic = void 0;
const base_1 = require("./base");
class TargetTemperatureCharacteristic extends base_1.TuyaWebCharacteristic {
    static HomekitCharacteristic(accessory) {
        return accessory.platform.Characteristic.TargetTemperature;
    }
    get minTemp() {
        var _a;
        if ((_a = this.accessory.deviceConfig.config) === null || _a === void 0 ? void 0 : _a.min_temper) {
            return Number(this.accessory.deviceConfig.config.min_temper);
        }
        const data = this.accessory.deviceConfig.data;
        if (data.min_temper) {
            return (Number(data.min_temper) *
                this.accessory.targetTemperatureFactor);
        }
        return 0;
    }
    get maxTemp() {
        var _a;
        if ((_a = this.accessory.deviceConfig.config) === null || _a === void 0 ? void 0 : _a.max_temper) {
            return Number(this.accessory.deviceConfig.config.max_temper);
        }
        const data = this.accessory.deviceConfig.data;
        if (data.max_temper) {
            return (Number(data.max_temper) *
                this.accessory.targetTemperatureFactor);
        }
        return 100;
    }
    setProps(char) {
        return char === null || char === void 0 ? void 0 : char.setProps({
            minValue: this.minTemp,
            maxValue: this.maxTemp,
            minStep: 0.5,
        });
    }
    static isSupportedByAccessory(accessory) {
        return accessory.deviceConfig.data.temperature !== undefined;
    }
    getRemoteValue(callback) {
        this.accessory
            .getDeviceState()
            .then((data) => {
            this.debug("[GET] %s", data === null || data === void 0 ? void 0 : data.temperature);
            this.updateValue(data, callback);
        })
            .catch(this.accessory.handleError("GET", callback));
    }
    setRemoteValue(homekitValue, callback) {
        const temperature = Number(homekitValue);
        this.accessory
            .setDeviceState("temperatureSet", { value: temperature }, {
            temperature: temperature /
                this.accessory.targetTemperatureFactor,
        })
            .then(() => {
            this.debug("[SET] %s %s", homekitValue, temperature);
            callback();
        })
            .catch(this.accessory.handleError("SET", callback));
    }
    updateValue(data, callback) {
        let temperature = (data === null || data === void 0 ? void 0 : data.temperature)
            ? Number(data === null || data === void 0 ? void 0 : data.temperature) *
                this.accessory.targetTemperatureFactor
            : undefined;
        if (temperature) {
            temperature = Math.round(temperature * 10) / 10;
            this.debug("[UPDATE] %s", temperature);
            this.accessory.setCharacteristic(this.homekitCharacteristic, temperature, !callback);
            callback && callback(null, temperature);
        }
        else {
            callback && callback(new Error("Could not get temperature from data"));
        }
    }
}
exports.TargetTemperatureCharacteristic = TargetTemperatureCharacteristic;
TargetTemperatureCharacteristic.Title = "Characteristic.TargetTemperature";
//# sourceMappingURL=targetTemperature.js.map