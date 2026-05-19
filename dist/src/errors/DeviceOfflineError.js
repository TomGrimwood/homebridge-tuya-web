"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceOfflineError = void 0;
class DeviceOfflineError extends Error {
    constructor(specificMessage) {
        let message = "Device Offline";
        if (specificMessage) {
            message = `${message} - ${specificMessage}`;
        }
        super(message);
    }
}
exports.DeviceOfflineError = DeviceOfflineError;
//# sourceMappingURL=DeviceOfflineError.js.map