"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cache = void 0;
const settings_1 = require("../settings");
class Cache {
    constructor() {
        this.validUntil = 0;
    }
    get valid() {
        return (this.validUntil > Cache.getCurrentEpoch() && this.value !== undefined);
    }
    set(data) {
        this.validUntil = Cache.getCurrentEpoch() + settings_1.TUYA_DEVICE_TIMEOUT + 5;
        this.merge(data);
    }
    renew() {
        const data = this.get(true);
        if (data) {
            this.set(data);
        }
    }
    merge(data) {
        this.value = { ...this.value, ...data };
    }
    /**
     *
     * @param always - return the cache even if cache is not valid
     */
    get(always = false) {
        var _a;
        if (!always && !this.valid) {
            return null;
        }
        return (_a = this.value) !== null && _a !== void 0 ? _a : null;
    }
    static getCurrentEpoch() {
        return Math.ceil(new Date().getTime() / 1000);
    }
}
exports.Cache = Cache;
//# sourceMappingURL=cache.js.map