"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowAccessory = void 0;
const characteristics_1 = require("./characteristics");
const BaseAccessory_1 = require("./BaseAccessory");
const holdPosition_1 = require("./characteristics/holdPosition");
class WindowAccessory extends BaseAccessory_1.BaseAccessory {
    constructor(platform, homebridgeAccessory, deviceConfig) {
        super(platform, homebridgeAccessory, deviceConfig, 13 /* Categories.WINDOW */);
    }
    get accessorySupportedCharacteristics() {
        return [
            characteristics_1.CurrentPositionCharacteristic,
            holdPosition_1.HoldPositionCharacteristic,
            characteristics_1.PositionStateCharacteristic,
            characteristics_1.TargetPositionCharacteristic,
        ];
    }
    get requiredCharacteristics() {
        return [
            characteristics_1.CurrentPositionCharacteristic,
            characteristics_1.PositionStateCharacteristic,
            characteristics_1.TargetPositionCharacteristic,
        ];
    }
    get deviceSupportedCharacteristics() {
        var _a, _b, _c;
        // Get supported characteristics from configuration
        if (Array.isArray((_a = this.deviceConfig.config) === null || _a === void 0 ? void 0 : _a.cover_characteristics)) {
            const supportedCharacteristics = [];
            const configuredCharacteristics = (_c = (_b = this.deviceConfig.config) === null || _b === void 0 ? void 0 : _b.cover_characteristics) !== null && _c !== void 0 ? _c : [];
            if (configuredCharacteristics.includes("Stop")) {
                supportedCharacteristics.push(holdPosition_1.HoldPositionCharacteristic);
            }
            return supportedCharacteristics;
        }
        return super.deviceSupportedCharacteristics;
    }
}
exports.WindowAccessory = WindowAccessory;
//# sourceMappingURL=WindowAccessory.js.map