"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RotationSpeedCharacteristic = void 0;
const base_1 = require("./base");
const MapRange_1 = require("../../helpers/MapRange");
class RotationSpeedCharacteristic extends base_1.TuyaWebCharacteristic {
    constructor() {
        super(...arguments);
        this.range = MapRange_1.MapRange.tuya(1, this.maxSpeedLevel).homeKit(this.minStep, this.maxSpeedLevel * this.minStep);
    }
    static HomekitCharacteristic(accessory) {
        return accessory.platform.Characteristic.RotationSpeed;
    }
    setProps(char) {
        return char === null || char === void 0 ? void 0 : char.setProps({
            unit: "percentage" /* Units.PERCENTAGE */,
            format: "int" /* Formats.INT */,
            minValue: 0,
            maxValue: 100,
            minStep: this.minStep,
        });
    }
    static isSupportedByAccessory(accessory) {
        return (accessory.deviceConfig.data.speed_level !== undefined &&
            accessory.deviceConfig.data.speed !== undefined);
    }
    get maxSpeedLevel() {
        const data = this.accessory.deviceConfig.data;
        return Number(data.speed_level) || 1;
    }
    get minStep() {
        return Math.floor(100 / this.maxSpeedLevel);
    }
    getRemoteValue(callback) {
        this.accessory
            .getDeviceState()
            .then((data) => {
            this.debug("[GET] %s", data === null || data === void 0 ? void 0 : data.speed);
            this.updateValue(data, callback);
        })
            .catch(this.accessory.handleError("GET", callback));
    }
    setRemoteValue(homekitValue, callback) {
        // Set device state in Tuya Web API
        let value = this.range.homekitToTuya(Number(homekitValue));
        // Set value to 1 if value is too small
        value = value < 1 ? 1 : value;
        // Set value to minSpeedLevel if value is too large
        value = value > this.maxSpeedLevel ? this.maxSpeedLevel : value;
        this.accessory
            .setDeviceState("windSpeedSet", { value }, { speed: value })
            .then(() => {
            this.debug("[SET] %s %s", homekitValue, value);
            callback();
        })
            .catch(this.accessory.handleError("SET", callback));
    }
    updateValue(data, callback) {
        if ((data === null || data === void 0 ? void 0 : data.speed) !== undefined) {
            const speed = this.range.tuyaToHomekit(Number(data.speed));
            this.accessory.setCharacteristic(this.homekitCharacteristic, speed, !callback);
            callback && callback(null, speed);
        }
        else {
            callback &&
                callback(new Error(`Unexpected speed value provided: ${data === null || data === void 0 ? void 0 : data.speed}`));
        }
    }
}
exports.RotationSpeedCharacteristic = RotationSpeedCharacteristic;
RotationSpeedCharacteristic.Title = "Characteristic.RotationSpeed";
//# sourceMappingURL=rotationSpeed.js.map