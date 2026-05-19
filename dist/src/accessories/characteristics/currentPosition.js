"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentPositionCharacteristic = void 0;
const base_1 = require("./base");
class CurrentPositionCharacteristic extends base_1.TuyaWebCharacteristic {
    static HomekitCharacteristic(accessory) {
        return accessory.platform.Characteristic.CurrentPosition;
    }
    static isSupportedByAccessory() {
        return true;
    }
    getRemoteValue(callback) {
        this.updateValue({}, callback);
    }
    updateValue(_data, callback) {
        callback && callback(null, this.accessory.position);
    }
}
exports.CurrentPositionCharacteristic = CurrentPositionCharacteristic;
CurrentPositionCharacteristic.Title = "Characteristic.CurrentPosition";
//# sourceMappingURL=currentPosition.js.map