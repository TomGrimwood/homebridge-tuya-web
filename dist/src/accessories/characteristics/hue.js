"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HueCharacteristic = void 0;
const index_1 = require("./index");
const base_1 = require("./base");
class HueCharacteristic extends base_1.TuyaWebCharacteristic {
    static HomekitCharacteristic(accessory) {
        return accessory.platform.Characteristic.Hue;
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
            this.debug("[GET] %s", (_a = data === null || data === void 0 ? void 0 : data.color) === null || _a === void 0 ? void 0 : _a.hue);
            this.updateValue(data, callback);
        })
            .catch(this.accessory.handleError("GET", callback));
    }
    setRemoteValue(homekitValue, callback) {
        // Set device state in Tuya Web API
        const value = homekitValue;
        this.accessory
            .setColor({ hue: value })
            .then(() => {
            this.debug("[SET] %s", value);
            callback();
        })
            .catch(this.accessory.handleError("SET", callback));
    }
    updateValue(data, callback) {
        var _a, _b;
        let stateValue = HueCharacteristic.DEFAULT_VALUE;
        if ((data === null || data === void 0 ? void 0 : data.color_mode) !== undefined &&
            index_1.COLOR_MODES.includes((_a = data === null || data === void 0 ? void 0 : data.color_mode) !== null && _a !== void 0 ? _a : "") &&
            ((_b = data === null || data === void 0 ? void 0 : data.color) === null || _b === void 0 ? void 0 : _b.hue)) {
            stateValue = Number(data.color.hue);
        }
        this.accessory.setCharacteristic(this.homekitCharacteristic, stateValue, !callback);
        callback && callback(null, stateValue);
    }
}
exports.HueCharacteristic = HueCharacteristic;
HueCharacteristic.Title = "Characteristic.Hue";
HueCharacteristic.DEFAULT_VALUE = 0;
//# sourceMappingURL=hue.js.map