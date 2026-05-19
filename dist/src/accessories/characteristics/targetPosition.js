"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TargetPositionCharacteristic = void 0;
const base_1 = require("./base");
const delay_1 = __importDefault(require("../../helpers/delay"));
class TargetPositionCharacteristic extends base_1.TuyaWebCharacteristic {
    static HomekitCharacteristic(accessory) {
        return accessory.platform.Characteristic.TargetPosition;
    }
    setProps(char) {
        return char === null || char === void 0 ? void 0 : char.setProps({
            unit: "percentage" /* Units.PERCENTAGE */,
            format: "int" /* Formats.INT */,
            minValue: 0,
            maxValue: 100,
            minStep: 100,
        });
    }
    static isSupportedByAccessory() {
        return true;
    }
    getRemoteValue(callback) {
        callback && callback(null, this.accessory.target);
    }
    setRemoteValue(homekitValue, callback) {
        const value = homekitValue === 0 ? 0 : 1;
        const coverAccessory = this.accessory;
        const target = value ? 100 : 0;
        this.accessory
            .setDeviceState("turnOnOff", { value }, {})
            .then(async () => {
            this.debug("[SET] turnOnOff command sent with value %s", value);
            callback();
            coverAccessory.target = target;
            this.accessory.setCharacteristic(this.accessory.platform.Characteristic.TargetPosition, target, true);
            coverAccessory.motor = value
                ? this.accessory.platform.Characteristic.PositionState.INCREASING
                : this.accessory.platform.Characteristic.PositionState.DECREASING;
            this.accessory.setCharacteristic(this.accessory.platform.Characteristic.PositionState, coverAccessory.motor, true);
            await (0, delay_1.default)(5000);
            coverAccessory.position = target;
            this.accessory.setCharacteristic(this.accessory.platform.Characteristic.CurrentPosition, coverAccessory.position, true);
            coverAccessory.motor =
                this.accessory.platform.Characteristic.PositionState.STOPPED;
            this.accessory.setCharacteristic(this.accessory.platform.Characteristic.PositionState, this.accessory.platform.Characteristic.PositionState.STOPPED, true);
        })
            .catch(this.accessory.handleError("SET", callback));
    }
    updateValue(_data, callback) {
        callback && callback(null, this.accessory.target);
    }
}
exports.TargetPositionCharacteristic = TargetPositionCharacteristic;
TargetPositionCharacteristic.Title = "Characteristic.TargetPosition";
//# sourceMappingURL=targetPosition.js.map