"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentHeatingCoolingStateCharacteristic = void 0;
const base_1 = require("./base");
const TuyaBoolean_1 = require("../../helpers/TuyaBoolean");
class CurrentHeatingCoolingStateCharacteristic extends base_1.TuyaWebCharacteristic {
    static HomekitCharacteristic(accessory) {
        return accessory.platform.Characteristic.CurrentHeatingCoolingState;
    }
    static isSupportedByAccessory() {
        return true;
    }
    setProps(char) {
        const data = this.accessory.deviceConfig.data;
        const validValues = [
            this.CurrentHeatingCoolingState.OFF,
            this.CurrentHeatingCoolingState.HEAT,
        ];
        if (data.mode) {
            validValues.push(this.CurrentHeatingCoolingState.COOL);
        }
        return char === null || char === void 0 ? void 0 : char.setProps({
            validValues,
        });
    }
    getRemoteValue(callback) {
        this.accessory
            .getDeviceState()
            .then((data) => {
            const d = {
                state: data.state,
                mode: data.mode,
            };
            this.debug("[GET] %s", d);
            this.updateValue(d, callback);
        })
            .catch(this.accessory.handleError("GET", callback));
    }
    get CurrentHeatingCoolingState() {
        return this.accessory.platform.Characteristic.CurrentHeatingCoolingState;
    }
    updateValue(data, callback) {
        var _a;
        if (!(0, TuyaBoolean_1.TuyaBoolean)(data === null || data === void 0 ? void 0 : data.state)) {
            this.accessory.setCharacteristic(this.homekitCharacteristic, this.CurrentHeatingCoolingState.OFF, !callback);
            this.debug("[UPDATE] %S", "OFF");
            callback && callback(null, this.CurrentHeatingCoolingState.OFF);
            return;
        }
        const mode = {
            auto: this.CurrentHeatingCoolingState.COOL,
            wind: this.CurrentHeatingCoolingState.COOL,
            hot: this.CurrentHeatingCoolingState.HEAT,
            cold: this.CurrentHeatingCoolingState.COOL,
        }[(_a = data === null || data === void 0 ? void 0 : data.mode) !== null && _a !== void 0 ? _a : "hot"];
        this.debug("[UPDATE] %s", mode === this.CurrentHeatingCoolingState.HEAT ? "HEAT" : "COOL");
        this.accessory.setCharacteristic(this.homekitCharacteristic, mode, !callback);
        callback && callback(null, mode);
    }
}
exports.CurrentHeatingCoolingStateCharacteristic = CurrentHeatingCoolingStateCharacteristic;
CurrentHeatingCoolingStateCharacteristic.Title = "Characteristic.CurrentHeatingCoolingState";
//# sourceMappingURL=currentHeatingCoolingState.js.map