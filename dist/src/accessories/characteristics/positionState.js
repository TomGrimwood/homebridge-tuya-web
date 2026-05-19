"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionStateCharacteristic = void 0;
const base_1 = require("./base");
class PositionStateCharacteristic extends base_1.TuyaWebCharacteristic {
    static HomekitCharacteristic(accessory) {
        return accessory.platform.Characteristic.PositionState;
    }
    static isSupportedByAccessory() {
        return true;
    }
    getRemoteValue(callback) {
        this.updateValue({}, callback);
    }
    updateValue(_data, callback) {
        callback && callback(null, this.accessory.motor);
    }
}
exports.PositionStateCharacteristic = PositionStateCharacteristic;
PositionStateCharacteristic.Title = "Characteristic.PositionState";
//# sourceMappingURL=positionState.js.map