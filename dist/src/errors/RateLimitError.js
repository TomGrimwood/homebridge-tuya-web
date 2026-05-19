"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitError = void 0;
class RateLimitError extends Error {
    constructor(message, reason) {
        if (reason) {
            message += ` - ${reason}`;
        }
        super(message);
    }
}
exports.RateLimitError = RateLimitError;
//# sourceMappingURL=RateLimitError.js.map