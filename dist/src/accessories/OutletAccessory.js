"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutletAccessory = void 0;
const BaseAccessory_1 = require("./BaseAccessory");
const characteristics_1 = require("./characteristics");
class OutletAccessory extends BaseAccessory_1.BaseAccessory {
    constructor(platform, homebridgeAccessory, deviceConfig) {
        super(platform, homebridgeAccessory, deviceConfig, 7 /* Categories.OUTLET */);
    }
    get accessorySupportedCharacteristics() {
        return [characteristics_1.OnCharacteristic];
    }
    get requiredCharacteristics() {
        return [characteristics_1.OnCharacteristic];
    }
}
exports.OutletAccessory = OutletAccessory;
//# sourceMappingURL=OutletAccessory.js.map