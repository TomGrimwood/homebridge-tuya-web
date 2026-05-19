"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DimmerAccessory = void 0;
const BaseAccessory_1 = require("./BaseAccessory");
const characteristics_1 = require("./characteristics");
class DimmerAccessory extends BaseAccessory_1.BaseAccessory {
    constructor(platform, homebridgeAccessory, deviceConfig) {
        super(platform, homebridgeAccessory, deviceConfig, 5 /* Categories.LIGHTBULB */);
    }
    get accessorySupportedCharacteristics() {
        return [characteristics_1.OnCharacteristic, characteristics_1.BrightnessCharacteristic];
    }
    get requiredCharacteristics() {
        return [characteristics_1.OnCharacteristic];
    }
    get deviceSupportedCharacteristics() {
        var _a, _b;
        // Get supported characteristics from configuration
        if (this.deviceConfig.config) {
            const supportedCharacteristics = [];
            if (((_b = (_a = this.deviceConfig.config) === null || _a === void 0 ? void 0 : _a.dimmer_characteristics) !== null && _b !== void 0 ? _b : []).includes("Brightness")) {
                supportedCharacteristics.push(characteristics_1.BrightnessCharacteristic);
            }
            return supportedCharacteristics;
        }
        return super.deviceSupportedCharacteristics;
    }
}
exports.DimmerAccessory = DimmerAccessory;
//# sourceMappingURL=DimmerAccessory.js.map