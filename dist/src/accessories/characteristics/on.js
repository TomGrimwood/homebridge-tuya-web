"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnCharacteristic = void 0;
const base_1 = require("./base");
const TuyaBoolean_1 = require("../../helpers/TuyaBoolean");
class OnCharacteristic extends base_1.TuyaWebCharacteristic {
    static HomekitCharacteristic(accessory) {
        return accessory.platform.Characteristic.On;
    }
    static isSupportedByAccessory(accessory) {
        return accessory.deviceConfig.data.state !== undefined;
    }
    getRemoteValue(callback) {
        this.accessory
            .getDeviceState()
            .then((data) => {
            this.debug("[GET] %s", data === null || data === void 0 ? void 0 : data.state);
            this.updateValue(data, callback);
        })
            .catch(this.accessory.handleError("GET", callback));
    }
    setRemoteValue(homekitValue, callback) {
        // Set device state in Tuya Web API
        const value = homekitValue ? 1 : 0;
        this.accessory
            .setDeviceState("turnOnOff", { value }, { state: Boolean(homekitValue) })
            .then(() => {
            this.debug("[SET] %s %s", homekitValue, value);
            callback();
        })
            .catch(this.accessory.handleError("SET", callback));
    }
    updateValue(data, callback) {
        if ((data === null || data === void 0 ? void 0 : data.state) !== undefined) {
            const stateValue = (0, TuyaBoolean_1.TuyaBoolean)(data.state);
            this.accessory.setCharacteristic(this.homekitCharacteristic, stateValue, !callback);
            callback && callback(null, stateValue);
        }
        else {
            callback &&
                callback(new Error("Could not find required property 'state'"));
        }
    }
}
exports.OnCharacteristic = OnCharacteristic;
OnCharacteristic.Title = "Characteristic.On";
//# sourceMappingURL=on.js.map