"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColorAccessory = void 0;
const BaseAccessory_1 = require("./BaseAccessory");
const lodash_debounce_1 = __importDefault(require("lodash.debounce"));
const DebouncedPromise_1 = require("../helpers/DebouncedPromise");
const characteristics_1 = require("./characteristics");
class ColorAccessory extends BaseAccessory_1.BaseAccessory {
    constructor() {
        super(...arguments);
        this.setColorDebounced = (0, lodash_debounce_1.default)(() => {
            var _a, _b;
            const { resolve, reject } = this.debouncePromise;
            this.debouncePromise = undefined;
            const hue = Number((_a = this.hue) !== null && _a !== void 0 ? _a : characteristics_1.HueCharacteristic.DEFAULT_VALUE);
            const saturation = Number((_b = this.saturation) !== null && _b !== void 0 ? _b : characteristics_1.SaturationCharacteristic.DEFAULT_VALUE);
            this.setRemoteColor({ hue, saturation }).then(resolve).catch(reject);
        }, 100, { maxWait: 500 });
    }
    async setRemoteColor(color) {
        const cachedValue = this.cachedValue(true);
        const brightness = Number(cachedValue
            ? cachedValue.brightness
            : characteristics_1.BrightnessCharacteristic.DEFAULT_VALUE);
        const tuyaData = {
            hue: color.hue,
            saturation: color.saturation / 100,
            brightness,
        };
        await this.setDeviceState("colorSet", { color: tuyaData }, {
            color: {
                hue: String(color.hue),
                saturation: String(color.saturation),
            },
            color_mode: characteristics_1.COLOR_MODES[0],
        });
    }
    setColor(color) {
        var _a, _b;
        if (!this.debouncePromise) {
            this.debouncePromise = new DebouncedPromise_1.DebouncedPromise();
        }
        this.hue = (_a = color.hue) !== null && _a !== void 0 ? _a : this.hue;
        this.saturation = (_b = color.saturation) !== null && _b !== void 0 ? _b : this.saturation;
        this.setColorDebounced();
        return this.debouncePromise.promise;
    }
}
exports.ColorAccessory = ColorAccessory;
//# sourceMappingURL=ColorAccessory.js.map