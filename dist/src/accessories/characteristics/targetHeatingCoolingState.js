"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TargetHeatingCoolingStateCharacteristic = void 0;
const base_1 = require("./base");
const TuyaBoolean_1 = require("../../helpers/TuyaBoolean");
class TargetHeatingCoolingStateCharacteristic extends base_1.TuyaWebCharacteristic {
    static HomekitCharacteristic(accessory) {
        return accessory.platform.Characteristic.TargetHeatingCoolingState;
    }
    static isSupportedByAccessory() {
        return true;
    }
    setProps(char) {
        const validValues = [
            this.TargetHeatingCoolingState.OFF,
            this.TargetHeatingCoolingState.AUTO,
        ];
        if (this.canSpecifyTarget) {
            validValues.push(this.TargetHeatingCoolingState.COOL, this.TargetHeatingCoolingState.HEAT);
        }
        return char === null || char === void 0 ? void 0 : char.setProps({
            validValues,
        });
    }
    get canSpecifyTarget() {
        const data = this.accessory.deviceConfig.data;
        return !!data.mode;
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
    get TargetHeatingCoolingState() {
        return this.accessory.platform.Characteristic.TargetHeatingCoolingState;
    }
    setRemoteValue(homekitValue, callback) {
        if (homekitValue === this.TargetHeatingCoolingState.OFF) {
            this.accessory
                .setDeviceState("turnOnOff", { value: 0 }, { state: false })
                .then(() => {
                this.debug("[SET] %s", homekitValue);
                callback();
            })
                .catch(this.accessory.handleError("SET", callback));
            return;
        }
        const map = {
            [this.TargetHeatingCoolingState.AUTO]: "auto",
            [this.TargetHeatingCoolingState.HEAT]: "hot",
            [this.TargetHeatingCoolingState.COOL]: "cold",
        };
        const value = map[homekitValue];
        this.accessory
            .setDeviceState("turnOnOff", { value: 1 }, { state: true })
            .then(() => {
            if (this.canSpecifyTarget) {
                this.accessory
                    .setDeviceState("modeSet", { value }, { mode: value })
                    .then(() => {
                    this.debug("[SET] %s %s", homekitValue, value);
                    callback();
                })
                    .catch(this.accessory.handleError("SET", callback));
            }
            else {
                callback();
            }
        })
            .catch(this.accessory.handleError("SET", callback));
    }
    updateValue(data, callback) {
        var _a;
        if (!(0, TuyaBoolean_1.TuyaBoolean)(data === null || data === void 0 ? void 0 : data.state)) {
            this.accessory.setCharacteristic(this.homekitCharacteristic, this.TargetHeatingCoolingState.OFF, !callback);
            this.debug("[UPDATE] %s", "OFF");
            callback && callback(null, this.TargetHeatingCoolingState.OFF);
            return;
        }
        const mode = {
            auto: this.TargetHeatingCoolingState.AUTO,
            wind: this.TargetHeatingCoolingState.AUTO,
            hot: this.TargetHeatingCoolingState.HEAT,
            cold: this.TargetHeatingCoolingState.COOL,
        }[(_a = data === null || data === void 0 ? void 0 : data.mode) !== null && _a !== void 0 ? _a : "auto"];
        this.debug("[UPDATE] %s", mode === this.TargetHeatingCoolingState.HEAT
            ? "HEAT"
            : mode === this.TargetHeatingCoolingState.COOL
                ? "COOL"
                : "AUTO");
        this.accessory.setCharacteristic(this.homekitCharacteristic, mode, !callback);
        callback && callback(null, mode);
    }
}
exports.TargetHeatingCoolingStateCharacteristic = TargetHeatingCoolingStateCharacteristic;
TargetHeatingCoolingStateCharacteristic.Title = "Characteristic.TargetHeatingCoolingState";
//# sourceMappingURL=targetHeatingCoolingState.js.map