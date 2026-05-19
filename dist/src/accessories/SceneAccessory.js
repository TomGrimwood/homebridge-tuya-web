"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneAccessory = void 0;
const BaseAccessory_1 = require("./BaseAccessory");
const characteristics_1 = require("./characteristics");
class SceneAccessory extends BaseAccessory_1.BaseAccessory {
    constructor(platform, homebridgeAccessory, deviceConfig) {
        super(platform, homebridgeAccessory, deviceConfig, 8 /* Categories.SWITCH */);
    }
    get accessorySupportedCharacteristics() {
        return [characteristics_1.MomentaryOnCharacteristic];
    }
    get requiredCharacteristics() {
        return [characteristics_1.MomentaryOnCharacteristic];
    }
}
exports.SceneAccessory = SceneAccessory;
//# sourceMappingURL=SceneAccessory.js.map