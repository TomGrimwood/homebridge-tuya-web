"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIMATE_MODES = exports.COLOR_MODES = void 0;
__exportStar(require("./active"), exports);
__exportStar(require("./brightness"), exports);
__exportStar(require("./colorTemperature"), exports);
__exportStar(require("./currentDoorState"), exports);
__exportStar(require("./currentHeatingCoolingState"), exports);
__exportStar(require("./currentPosition"), exports);
__exportStar(require("./currentTemperature"), exports);
__exportStar(require("./hue"), exports);
__exportStar(require("./momentaryOn"), exports);
__exportStar(require("./obstructionDetected"), exports);
__exportStar(require("./on"), exports);
__exportStar(require("./positionState"), exports);
__exportStar(require("./rotationSpeed"), exports);
__exportStar(require("./saturation"), exports);
__exportStar(require("./targetDoorState"), exports);
__exportStar(require("./targetHeatingCoolingState"), exports);
__exportStar(require("./targetPosition"), exports);
__exportStar(require("./targetTemperature"), exports);
__exportStar(require("./temperatureDisplayUnits"), exports);
exports.COLOR_MODES = ["color", "colour"];
exports.CLIMATE_MODES = ["cold", "hot", "wind", "auto"];
//# sourceMappingURL=index.js.map