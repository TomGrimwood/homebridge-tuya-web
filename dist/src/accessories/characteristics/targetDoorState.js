"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TargetDoorStateCharacteristic = void 0;
const base_1 = require("./base");
const response_1 = require("../../api/response");
const TuyaBoolean_1 = require("../../helpers/TuyaBoolean");
class TargetDoorStateCharacteristic extends base_1.TuyaWebCharacteristic {
    static HomekitCharacteristic(accessory) {
        return accessory.platform.Characteristic.TargetDoorState;
    }
    static isSupportedByAccessory() {
        return true;
    }
    get TargetDoorState() {
        return this.accessory.platform.Characteristic.TargetDoorState;
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
        const value = homekitValue === this.TargetDoorState.CLOSED ? 0 : 1;
        const data = {
            target_cover_state: value === 0 ? response_1.CoverState.Closing : response_1.CoverState.Opening,
            state: value === 0 ? response_1.CoverState.Closing : response_1.CoverState.Opening,
        };
        this.accessory
            .setDeviceState("turnOnOff", { value }, data)
            .then(() => {
            this.debug("[SET] %s", value);
            callback();
        })
            .catch(this.accessory.handleError("SET", callback));
    }
    updateValue(data, callback) {
        if (!isNaN(Number(String(data === null || data === void 0 ? void 0 : data.state)))) {
            //State is a number and probably 1, 2 or 3
            const state = Number(data.state);
            let stateValue = this.TargetDoorState.OPEN;
            switch (state) {
                case response_1.CoverState.Opening:
                    stateValue = this.TargetDoorState.OPEN;
                    break;
                case response_1.CoverState.Closing:
                    stateValue = this.TargetDoorState.CLOSED;
                    break;
                default:
                    if (!isNaN(Number(String(data === null || data === void 0 ? void 0 : data.target_cover_state)))) {
                        stateValue =
                            data.target_cover_state === response_1.CoverState.Closing
                                ? this.TargetDoorState.CLOSED
                                : this.TargetDoorState.OPEN;
                    }
            }
            this.accessory.setCharacteristic(this.homekitCharacteristic, stateValue, !callback);
            callback && callback(null, stateValue);
        }
        else if (["true", "false"].includes(String(data === null || data === void 0 ? void 0 : data.state).toLowerCase())) {
            const stateValue = (0, TuyaBoolean_1.TuyaBoolean)(data.state)
                ? this.TargetDoorState.OPEN
                : this.TargetDoorState.CLOSED;
            this.accessory.setCharacteristic(this.homekitCharacteristic, stateValue, !callback);
            callback && callback(null, stateValue);
        }
        else {
            callback &&
                callback(new Error(`Unexpected state value provided: ${data === null || data === void 0 ? void 0 : data.state}`));
        }
    }
}
exports.TargetDoorStateCharacteristic = TargetDoorStateCharacteristic;
TargetDoorStateCharacteristic.Title = "Characteristic.TargetDoorState";
//# sourceMappingURL=targetDoorState.js.map