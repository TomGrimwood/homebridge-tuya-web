"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HoldPositionCharacteristic = void 0;
const base_1 = require("./base");
const response_1 = require("../../api/response");
const TuyaBoolean_1 = require("../../helpers/TuyaBoolean");
class HoldPositionCharacteristic extends base_1.TuyaWebCharacteristic {
    static HomekitCharacteristic(accessory) {
        return accessory.platform.Characteristic.HoldPosition;
    }
    static isSupportedByAccessory(accessory) {
        return (0, TuyaBoolean_1.TuyaBoolean)(accessory.deviceConfig.data.support_stop);
    }
    setRemoteValue(homekitValue, callback) {
        this.accessory
            .setDeviceState("startStop", { value: 0 }, { state: response_1.CoverState.Stopped, target_cover_state: response_1.CoverState.Stopped })
            .then(() => {
            this.debug("[SET]");
            callback();
        })
            .catch(this.accessory.handleError("SET", callback));
    }
}
exports.HoldPositionCharacteristic = HoldPositionCharacteristic;
HoldPositionCharacteristic.Title = "Characteristic.HoldPosition";
//# sourceMappingURL=holdPosition.js.map