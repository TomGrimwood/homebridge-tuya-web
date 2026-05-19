"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceList = void 0;
class DeviceList {
    constructor(devices) {
        this.idNameMap = {};
        devices.forEach((device) => {
            this.idNameMap[device.id] = device.name;
        });
    }
    /**
     * Returns the device ID belonging to the supplied identifier
     * @param identifier
     */
    find(identifier) {
        if (Object.keys(this.idNameMap).includes(identifier)) {
            return identifier;
        }
        if (Object.values(this.idNameMap).includes(identifier)) {
            return Object.keys(this.idNameMap).find((key) => this.idNameMap[key] === identifier);
        }
        return undefined;
    }
    /**
     * Returns all device ids in this list
     */
    get all() {
        return Object.keys(this.idNameMap);
    }
}
exports.DeviceList = DeviceList;
//# sourceMappingURL=DeviceList.js.map