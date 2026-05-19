"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GarageDoorAccessory = void 0;
const characteristics_1 = require("./characteristics");
const BaseAccessory_1 = require("./BaseAccessory");
class GarageDoorAccessory extends BaseAccessory_1.BaseAccessory {
    constructor(platform, homebridgeAccessory, deviceConfig) {
        super(platform, homebridgeAccessory, deviceConfig, 4 /* Categories.GARAGE_DOOR_OPENER */);
    }
    get accessorySupportedCharacteristics() {
        return [
            characteristics_1.CurrentDoorStateCharacteristic,
            characteristics_1.ObstructionDetectedCharacteristic,
            characteristics_1.TargetDoorStateCharacteristic,
        ];
    }
    get requiredCharacteristics() {
        return [
            characteristics_1.CurrentDoorStateCharacteristic,
            characteristics_1.ObstructionDetectedCharacteristic,
            characteristics_1.TargetDoorStateCharacteristic,
        ];
    }
}
exports.GarageDoorAccessory = GarageDoorAccessory;
//# sourceMappingURL=GarageDoorAccessory.js.map