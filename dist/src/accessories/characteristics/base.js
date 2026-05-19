"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TuyaWebCharacteristic = void 0;
class TuyaWebCharacteristic {
    setProps(characteristic) {
        return characteristic;
    }
    constructor(accessory) {
        this.accessory = accessory;
        this.enable();
    }
    get staticInstance() {
        return this.constructor;
    }
    get title() {
        return this.staticInstance.Title;
    }
    get homekitCharacteristic() {
        return this.staticInstance.HomekitCharacteristic(this.accessory);
    }
    log(logLevel, message, ...args) {
        this.accessory.log.log(logLevel, `[%s] %s - ${message}`, this.accessory.name, this.title, ...args);
    }
    debug(message, ...args) {
        this.log("debug" /* LogLevel.DEBUG */, message, ...args);
    }
    info(message, ...args) {
        this.log("info" /* LogLevel.INFO */, message, ...args);
    }
    warn(message, ...args) {
        this.log("warn" /* LogLevel.WARN */, message, ...args);
    }
    error(message, ...args) {
        this.log("error" /* LogLevel.ERROR */, message, ...args);
    }
    enable() {
        var _a;
        const char = this.setProps((_a = this.accessory.service) === null || _a === void 0 ? void 0 : _a.getCharacteristic(this.homekitCharacteristic));
        if (char) {
            this.debug(JSON.stringify(char.props));
            if (this.getRemoteValue) {
                char.on("get", this.getRemoteValue.bind(this));
            }
            if (this.setRemoteValue) {
                char.on("set", this.setRemoteValue.bind(this));
            }
        }
        if (this.updateValue) {
            this.accessory.addUpdateCallback(this.homekitCharacteristic, this.updateValue.bind(this));
        }
    }
}
exports.TuyaWebCharacteristic = TuyaWebCharacteristic;
//# sourceMappingURL=base.js.map