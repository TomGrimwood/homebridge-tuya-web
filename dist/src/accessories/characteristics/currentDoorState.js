"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentDoorStateCharacteristic = void 0;
const base_1 = require("./base");
const response_1 = require("../../api/response");
const TuyaBoolean_1 = require("../../helpers/TuyaBoolean");
class CurrentDoorStateCharacteristic extends base_1.TuyaWebCharacteristic {
    static HomekitCharacteristic(accessory) {
        return accessory.platform.Characteristic.CurrentDoorState;
    }
    static isSupportedByAccessory() {
        return true;
    }
    get CurrentDoorState() {
        return this.accessory.platform.Characteristic.CurrentDoorState;
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
    updateValue(data, callback) {
        this.debug(`Updating value`, data);
        if (!isNaN(Number(String(data === null || data === void 0 ? void 0 : data.state)))) {
            //State is a number and probably 1, 2 or 3
            const state = Number(data.state);
            let stateValue;
            switch (state) {
                case response_1.CoverState.Opening:
                    stateValue = this.CurrentDoorState.OPENING;
                    break;
                case response_1.CoverState.Closing:
                    stateValue = this.CurrentDoorState.CLOSING;
                    break;
                case response_1.CoverState.Stopped:
                default:
                    if (data.target_cover_state === response_1.CoverState.Opening) {
                        stateValue = this.CurrentDoorState.OPEN;
                    }
                    else if (data.target_cover_state === response_1.CoverState.Stopped) {
                        stateValue = this.CurrentDoorState.CLOSED;
                    }
                    else {
                        stateValue = this.CurrentDoorState.STOPPED;
                    }
            }
            this.accessory.setCharacteristic(this.homekitCharacteristic, stateValue, !callback);
            callback && callback(null, stateValue);
        }
        else if (["true", "false"].includes(String(data === null || data === void 0 ? void 0 : data.state).toLowerCase())) {
            const stateValue = (0, TuyaBoolean_1.TuyaBoolean)(data.state)
                ? this.CurrentDoorState.OPEN
                : this.CurrentDoorState.CLOSED;
            this.accessory.setCharacteristic(this.homekitCharacteristic, stateValue, !callback);
            callback && callback(null, stateValue);
        }
        else {
            callback &&
                callback(new Error(`Unexpected state value provided: ${data === null || data === void 0 ? void 0 : data.state}`));
        }
    }
}
exports.CurrentDoorStateCharacteristic = CurrentDoorStateCharacteristic;
CurrentDoorStateCharacteristic.Title = "Characteristic.CurrentDoorState";
//# sourceMappingURL=currentDoorState.js.map