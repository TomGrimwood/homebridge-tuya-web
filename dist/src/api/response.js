"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEV_TYPE_TO_HA_TYPE = exports.CATEGORY_TO_DEV_TYPE = exports.HomeAssistantDeviceTypes = exports.TuyaDeviceTypes = exports.CoverState = void 0;
var CoverState;
(function (CoverState) {
    CoverState[CoverState["Opening"] = 1] = "Opening";
    CoverState[CoverState["Closing"] = 2] = "Closing";
    CoverState[CoverState["Stopped"] = 3] = "Stopped";
})(CoverState || (exports.CoverState = CoverState = {}));
exports.TuyaDeviceTypes = [
    "climate",
    "cover",
    "dimmer",
    "fan",
    "garage",
    "light",
    "outlet",
    "scene",
    "switch",
    "temperature_sensor",
    "window",
];
exports.HomeAssistantDeviceTypes = [
    "climate",
    "cover",
    "dimmer",
    "fan",
    "light",
    "outlet",
    "scene",
    "switch",
];
/**
 * Maps Tuya device categories to our internal device types.
 * See: https://developer.tuya.com/en/docs/iot/standarddescription?id=K9i5ql6waswzq
 */
exports.CATEGORY_TO_DEV_TYPE = {
    // Lights
    dj: "light",
    dd: "light",
    xdd: "light",
    fwd: "light",
    dc: "light",
    gyd: "light",
    tyndj: "light",
    // Switches
    kg: "switch",
    tdq: "outlet",
    pc: "outlet",
    cz: "outlet",
    // Fans
    fs: "fan",
    fsd: "fan",
    // Covers
    cl: "cover",
    clkg: "cover",
    // Climate
    wk: "climate",
    kt: "climate",
    // Garage
    ckmkzq: "garage",
    // Temperature sensors
    wsdcg: "temperature_sensor",
    ldcg: "temperature_sensor",
    // Dimmers
    tgq: "dimmer",
    // Windows
    mc: "window",
};
exports.DEV_TYPE_TO_HA_TYPE = {
    climate: "climate",
    cover: "cover",
    dimmer: "dimmer",
    fan: "fan",
    garage: "switch",
    light: "light",
    outlet: "outlet",
    scene: "scene",
    switch: "switch",
    temperature_sensor: "switch",
    window: "cover",
};
//# sourceMappingURL=response.js.map