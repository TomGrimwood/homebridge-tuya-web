"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapRange = void 0;
class MapRange {
    constructor(tuyaStart, tuyaEnd, homekitStart, homekitEnd) {
        this.tuyaStart = tuyaStart;
        this.tuyaEnd = tuyaEnd;
        this.homekitStart = homekitStart;
        this.homekitEnd = homekitEnd;
    }
    static tuya(start, end) {
        return {
            homeKit: (toStart, toEnd) => {
                return new MapRange(start, end, toStart, toEnd);
            },
        };
    }
    tuyaToHomekit(tuyaValue) {
        return (((tuyaValue - this.tuyaStart) * (this.homekitEnd - this.homekitStart)) /
            (this.tuyaEnd - this.tuyaStart) +
            this.homekitStart);
    }
    homekitToTuya(homeKitValue) {
        return (((homeKitValue - this.homekitStart) * (this.tuyaEnd - this.tuyaStart)) /
            (this.homekitEnd - this.homekitStart) +
            this.tuyaStart);
    }
}
exports.MapRange = MapRange;
//# sourceMappingURL=MapRange.js.map