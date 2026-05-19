"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColorTemperatureCharacteristic = void 0;
const base_1 = require("./base");
const MapRange_1 = require("../../helpers/MapRange");
// HomeKit uses mired (micro reciprocal degrees): mired = 1,000,000 / Kelvin
// New Tuya API (temp_value_v2): 0–1000 where 0 = warmest, 1000 = coolest
class ColorTemperatureCharacteristic extends base_1.TuyaWebCharacteristic {
    constructor() {
        super(...arguments);
        // Tuya 0 (warm) → maxMired, Tuya 1000 (cool) → minMired
        this.rangeMapper = MapRange_1.MapRange.tuya(0, 1000).homeKit(this.maxMired, this.minMired);
    }
    static HomekitCharacteristic(accessory) {
        return accessory.platform.Characteristic.ColorTemperature;
    }
    static isSupportedByAccessory(accessory) {
        return accessory.deviceConfig.data.color_temp !== undefined;
    }
    setProps(char) {
        return char === null || char === void 0 ? void 0 : char.setProps({
            format: "int" /* Formats.INT */,
            minValue: this.minMired,
            maxValue: this.maxMired,
        });
    }
    get minMired() {
        const data = this.accessory.deviceConfig.config;
        if (data === null || data === void 0 ? void 0 : data.max_kelvin) {
            return Math.round(1000000 / Number(data.max_kelvin));
        }
        return 140;
    }
    get maxMired() {
        const data = this.accessory.deviceConfig.config;
        if (data === null || data === void 0 ? void 0 : data.min_kelvin) {
            return Math.round(1000000 / Number(data.min_kelvin));
        }
        return 500;
    }
    getRemoteValue(callback) {
        this.accessory
            .getDeviceState()
            .then((data) => {
            this.debug("[GET] %s", data === null || data === void 0 ? void 0 : data.color_temp);
            this.updateValue(data, callback);
        })
            .catch(this.accessory.handleError("GET", callback));
    }
    setRemoteValue(homekitValue, callback) {
        if (typeof homekitValue !== "number") {
            const errorMsg = `Received unexpected temperature value ${JSON.stringify(homekitValue)} of type ${typeof homekitValue}`;
            this.warn(errorMsg);
            callback(new Error(errorMsg));
            return;
        }
        const value = Math.round(this.rangeMapper.homekitToTuya(homekitValue));
        this.accessory
            .setDeviceState("colorTemperatureSet", { value }, { color_temp: value })
            .then(() => {
            this.debug("[SET] mired=%s tuya=%s", homekitValue, value);
            callback();
        })
            .catch(this.accessory.handleError("SET", callback));
    }
    updateValue(data, callback) {
        if ((data === null || data === void 0 ? void 0 : data.color_temp) !== undefined) {
            const tuyaValue = Number(data.color_temp);
            const homekitColorTemp = Math.round(this.rangeMapper.tuyaToHomekit(tuyaValue));
            if (homekitColorTemp > this.maxMired) {
                this.warn("ColorTemperature mired (%s) exceeds max (%s) for Tuya value (%s). Check your configuration.", homekitColorTemp, this.maxMired, tuyaValue);
            }
            else if (homekitColorTemp < this.minMired) {
                this.warn("ColorTemperature mired (%s) below min (%s) for Tuya value (%s). Check your configuration.", homekitColorTemp, this.minMired, tuyaValue);
            }
            this.accessory.setCharacteristic(this.homekitCharacteristic, homekitColorTemp, !callback);
            callback && callback(null, homekitColorTemp);
        }
        else {
            callback &&
                callback(new Error("Could not find required property 'color_temp'"));
        }
    }
}
exports.ColorTemperatureCharacteristic = ColorTemperatureCharacteristic;
ColorTemperatureCharacteristic.Title = "Characteristic.ColorTemperature";
//# sourceMappingURL=colorTemperature.js.map