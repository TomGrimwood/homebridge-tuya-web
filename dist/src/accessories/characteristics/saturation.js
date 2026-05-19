"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaturationCharacteristic = void 0;
const index_1 = require("./index");
const base_1 = require("./base");
class SaturationCharacteristic extends base_1.TuyaWebCharacteristic {
    static HomekitCharacteristic(accessory) {
        return accessory.platform.Characteristic.Saturation;
    }
    static isSupportedByAccessory(accessory) {
        const configData = accessory.deviceConfig.data;
        return configData.color_mode !== undefined;
    }
    getRemoteValue(callback) {
        this.accessory
            .getDeviceState()
            .then((data) => {
            var _a;
            this.debug("[GET] %s", (_a = data === null || data === void 0 ? void 0 : data.color) === null || _a === void 0 ? void 0 : _a.saturation);
            this.updateValue(data, callback);
        })
            .catch(this.accessory.handleError("GET", callback));
    }
    setRemoteValue(homekitValue, callback) {
        // Set device state in Tuya Web API
        const value = homekitValue;
        this.accessory
            .setColor({ saturation: value })
            .then(() => {
            this.debug("[SET] %s", value);
            callback();
        })
            .catch(this.accessory.handleError("SET", callback));
    }
    updateValue(data, callback) {
        var _a, _b;
        let stateValue = SaturationCharacteristic.DEFAULT_VALUE;
        if ((data === null || data === void 0 ? void 0 : data.color_mode) !== undefined &&
            index_1.COLOR_MODES.includes((_a = data === null || data === void 0 ? void 0 : data.color_mode) !== null && _a !== void 0 ? _a : "") &&
            ((_b = data === null || data === void 0 ? void 0 : data.color) === null || _b === void 0 ? void 0 : _b.saturation)) {
            stateValue = Number(data.color.saturation);
        }
        this.accessory.setCharacteristic(this.homekitCharacteristic, stateValue, !callback);
        callback && callback(null, stateValue);
    }
}
exports.SaturationCharacteristic = SaturationCharacteristic;
SaturationCharacteristic.Title = "Characteristic.Saturation";
SaturationCharacteristic.DEFAULT_VALUE = 0;
//# sourceMappingURL=saturation.js.map