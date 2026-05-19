"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Delay for a given time
 * @param t time in ms
 */
function delay(t) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, t);
    });
}
exports.default = delay;
//# sourceMappingURL=delay.js.map