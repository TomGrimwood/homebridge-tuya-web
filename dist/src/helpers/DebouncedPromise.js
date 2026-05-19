"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebouncedPromise = void 0;
class DebouncedPromise {
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
}
exports.DebouncedPromise = DebouncedPromise;
//# sourceMappingURL=DebouncedPromise.js.map