"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrightnessCharacteristic = void 0;
const index_1 = require("./index");
const util_1 = require("util");
const base_1 = require("./base");
const MapRange_1 = require("../../helpers/MapRange");
class BrightnessCharacteristic extends base_1.TuyaWebCharacteristic {
    static HomekitCharacteristic(accessory) {
        return accessory.platform.Characteristic.Brightness;
    }
    static isSupportedByAccessory(accessory) {
        var _a;
        const configData = accessory.deviceConfig.data;
        return (configData.brightness !== undefined ||
            ((_a = configData.color) === null || _a === void 0 ? void 0 : _a.brightness) !== undefined);
    }
    get usesColorBrightness() {
        var _a, _b;
        const deviceData = this.accessory.deviceConfig.data;
        return ((deviceData === null || deviceData === void 0 ? void 0 : deviceData.color_mode) !== undefined &&
            index_1.COLOR_MODES.includes((_a = deviceData === null || deviceData === void 0 ? void 0 : deviceData.color_mode) !== null && _a !== void 0 ? _a : "") &&
            ((_b = deviceData === null || deviceData === void 0 ? void 0 : deviceData.color) === null || _b === void 0 ? void 0 : _b.brightness) !== undefined);
    }
    get rangeMapper() {
        var _a, _b, _c, _d;
        let minTuya = 10;
        let maxTuya = 1000;
        if (((_a = this.accessory.deviceConfig.config) === null || _a === void 0 ? void 0 : _a.min_brightness) !== undefined &&
            ((_b = this.accessory.deviceConfig.config) === null || _b === void 0 ? void 0 : _b.max_brightness) !== undefined) {
            minTuya = Number((_c = this.accessory.deviceConfig.config) === null || _c === void 0 ? void 0 : _c.min_brightness);
            maxTuya = Number((_d = this.accessory.deviceConfig.config) === null || _d === void 0 ? void 0 : _d.max_brightness);
        }
        else if (this.usesColorBrightness) {
            minTuya = 0;
            maxTuya = 1000;
        }
        return MapRange_1.MapRange.tuya(minTuya, maxTuya).homeKit(0, 100);
    }
    getRemoteValue(callback) {
        this.accessory
            .getDeviceState()
            .then((data) => {
            var _a, _b;
            this.debug("[GET] %s", (_a = data === null || data === void 0 ? void 0 : data.brightness) !== null && _a !== void 0 ? _a : (_b = data === null || data === void 0 ? void 0 : data.color) === null || _b === void 0 ? void 0 : _b.brightness);
            this.updateValue(data, callback);
        })
            .catch(this.accessory.handleError("GET", callback));
    }
    setRemoteValue(homekitValue, callback) {
        const value = this.rangeMapper.homekitToTuya(Number(homekitValue));
        this.accessory
            .setDeviceState("brightnessSet", { value }, this.usesColorBrightness
            ? { color: { brightness: String(value) } }
            : { brightness: value })
            .then(() => {
            this.debug("[SET] %s", value);
            callback();
        })
            .catch(this.accessory.handleError("SET", callback));
    }
    updateValue(data, callback) {
        var _a;
        const rawValue = this.usesColorBrightness
            ? (_a = data.color) === null || _a === void 0 ? void 0 : _a.brightness
            : data.brightness;
        if (rawValue === undefined || rawValue === null || rawValue === "") {
            this.debug("No brightness field in device data; skipping update. %s", (0, util_1.inspect)(data));
            callback && callback(null, BrightnessCharacteristic.DEFAULT_VALUE);
            return;
        }
        const tuyaValue = Number(rawValue);
        if (!Number.isFinite(tuyaValue)) {
            this.warn("Brightness value is not a number (%s); skipping update.", (0, util_1.inspect)(rawValue));
            callback && callback(null, BrightnessCharacteristic.DEFAULT_VALUE);
            return;
        }
        let homekitValue = this.rangeMapper.tuyaToHomekit(tuyaValue);
        if (homekitValue > 100) {
            this.warn("Characteristic 'Brightness' will receive value higher than allowed (%s) since provided Tuya value (%s) " +
                "exceeds configured maximum Tuya value (%s). Clamping to 100.", homekitValue, tuyaValue, this.rangeMapper.tuyaEnd);
            homekitValue = 100;
        }
        else if (homekitValue < 0) {
            this.warn("Characteristic 'Brightness' will receive value lower than allowed (%s) since provided Tuya value (%s) " +
                "is lower than configured minimum Tuya value (%s). Clamping to 0.", homekitValue, tuyaValue, this.rangeMapper.tuyaStart);
            homekitValue = 0;
        }
        this.accessory.setCharacteristic(this.homekitCharacteristic, homekitValue, !callback);
        callback && callback(null, homekitValue);
    }
}
exports.BrightnessCharacteristic = BrightnessCharacteristic;
BrightnessCharacteristic.Title = "Characteristic.Brightness";
BrightnessCharacteristic.DEFAULT_VALUE = 1000;
//# sourceMappingURL=brightness.js.map