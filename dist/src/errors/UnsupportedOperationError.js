"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnsupportedOperationError = void 0;
class UnsupportedOperationError extends Error {
    constructor(message, reason) {
        if (reason) {
            message += ` - ${reason}`;
        }
        super(message);
    }
}
exports.UnsupportedOperationError = UnsupportedOperationError;
//# sourceMappingURL=UnsupportedOperationError.js.map