"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAccessory = void 0;
const lodash_debounce_1 = __importDefault(require("lodash.debounce"));
const settings_1 = require("../settings");
const util_1 = require("util");
const DebouncedPromise_1 = require("../helpers/DebouncedPromise");
const errors_1 = require("../errors");
const cache_1 = require("../helpers/cache");
const DeviceOfflineError_1 = require("../errors/DeviceOfflineError");
const TuyaBoolean_1 = require("../helpers/TuyaBoolean");
class BaseAccessory {
    /**
     * The characteristics that this device actually supports.
     */
    get deviceSupportedCharacteristics() {
        return this.accessorySupportedCharacteristics
            .filter((asc) => !this.requiredCharacteristics.includes(asc))
            .filter((asc) => asc.isSupportedByAccessory(this));
    }
    constructor(platform, homebridgeAccessory, deviceConfig, categoryType) {
        this.platform = platform;
        this.deviceConfig = deviceConfig;
        this.categoryType = categoryType;
        this.updateCallbackList = new Map();
        this.debouncedDeviceStateRequest = (0, lodash_debounce_1.default)(this.resolveDeviceStateRequest.bind(this), 500, { maxWait: 1500 });
        this.log = platform.log;
        this.deviceId = deviceConfig.id;
        this.log.debug("[%s] deviceConfig: %s", this.deviceConfig.name, (0, util_1.inspect)(this.deviceConfig));
        this.validateConfigOverwrites(this.deviceConfig.config).forEach((error) => this.error(error));
        switch (categoryType) {
            case 3 /* Categories.FAN */:
                this.serviceType = platform.Service.Fanv2;
                break;
            case 4 /* Categories.GARAGE_DOOR_OPENER */:
                this.serviceType = platform.Service.GarageDoorOpener;
                break;
            case 5 /* Categories.LIGHTBULB */:
                this.serviceType = platform.Service.Lightbulb;
                break;
            case 7 /* Categories.OUTLET */:
                this.serviceType = platform.Service.Outlet;
                break;
            case 8 /* Categories.SWITCH */:
                this.serviceType = platform.Service.Switch;
                break;
            case 10 /* Categories.SENSOR */:
                this.serviceType = platform.Service.TemperatureSensor;
                break;
            case 9 /* Categories.THERMOSTAT */:
                this.serviceType = platform.Service.Thermostat;
                break;
            case 13 /* Categories.WINDOW */:
                this.serviceType = platform.Service.Window;
                break;
            case 14 /* Categories.WINDOW_COVERING */:
                this.serviceType = platform.Service.WindowCovering;
                break;
            default:
                this.serviceType = platform.Service.AccessoryInformation;
        }
        // Retrieve existing of create new Bridged Accessory
        if (homebridgeAccessory) {
            homebridgeAccessory.controller = this;
            if (!homebridgeAccessory.context.deviceId) {
                homebridgeAccessory.context.deviceId = this.deviceConfig.id;
            }
            this.log.info("Existing Accessory found [Name: %s] [Tuya ID: %s] [HomeBridge ID: %s]", homebridgeAccessory.displayName, homebridgeAccessory.context.deviceId, homebridgeAccessory.UUID);
            homebridgeAccessory.displayName = this.deviceConfig.name;
        }
        else {
            homebridgeAccessory = new this.platform.platformAccessory(this.deviceConfig.name, this.platform.generateUUID(this.deviceConfig.id), categoryType);
            homebridgeAccessory.context.deviceId = this.deviceConfig.id;
            homebridgeAccessory.controller = this;
            this.log.info("Created new Accessory [Name: %s] [Tuya ID: %s] [HomeBridge ID: %s]", homebridgeAccessory.displayName, homebridgeAccessory.context.deviceId, homebridgeAccessory.UUID);
            this.platform.registerPlatformAccessory(homebridgeAccessory);
        }
        if (!homebridgeAccessory.context.cache) {
            homebridgeAccessory.context.cache = new cache_1.Cache();
        }
        else if (homebridgeAccessory.context.cache.constructor.name === "Object") {
            homebridgeAccessory.context.cache = Object.assign(new cache_1.Cache(), homebridgeAccessory.context.cache);
        }
        // Create service
        this.service = homebridgeAccessory.getService(this.serviceType);
        if (!this.service) {
            this.log.debug("Creating New Service %s", this.deviceConfig.id);
            this.service = homebridgeAccessory.addService(this.serviceType, this.deviceConfig.name, this.serviceType.UUID);
        }
        homebridgeAccessory.on("identify", this.onIdentify.bind(this));
        this.homebridgeAccessory = homebridgeAccessory;
        this.initializeCharacteristics();
        this.cleanupServices();
    }
    get cache() {
        const cache = this.homebridgeAccessory.context.cache;
        if (!cache) {
            throw new Error("Device cache not initialized");
        }
        return cache;
    }
    /**
    private get defaultCharacteristics(): CharacteristicConstructor[] {
      return [
        this.platform.Characteristic.Manufacturer,
        this.platform.Characteristic.Model,
        this.platform.Characteristic.Name,
        this.platform.Characteristic.SerialNumber,
      ];
    }
    */
    initializeCharacteristics() {
        var _a, _b;
        const deviceSupportedCharacteristics = [
            ...this.requiredCharacteristics,
            ...this.deviceSupportedCharacteristics,
        ];
        deviceSupportedCharacteristics.forEach((gc) => new gc(this));
        const homekitCharacteristics = deviceSupportedCharacteristics.map((gc) => gc.HomekitCharacteristic(this).UUID);
        (_b = (_a = this.service) === null || _a === void 0 ? void 0 : _a.characteristics) === null || _b === void 0 ? void 0 : _b.forEach((char) => {
            var _a;
            if (!homekitCharacteristics.includes(char.UUID)) {
                this.debug(`Characteristic ${char.displayName} not supported`);
                (_a = this.service) === null || _a === void 0 ? void 0 : _a.removeCharacteristic(char);
            }
        });
    }
    cleanupServices() {
        const outdatedServices = [];
        this.homebridgeAccessory.services.forEach((service) => {
            var _a;
            if (![
                (_a = this.service) === null || _a === void 0 ? void 0 : _a.UUID,
                this.platform.Service.AccessoryInformation.UUID,
            ].includes(service.UUID)) {
                this.info(`Removing superfluous service: ${service.displayName} (${service.characteristics.map((c) => c.displayName).join(", ")})`);
                outdatedServices.push(service);
            }
        });
        outdatedServices.forEach((service) => this.homebridgeAccessory.removeService(service));
    }
    /**
     * Should validate and correct the supplied overwrite configuration for this device.
     * @param config
     * @returns A list of all errors in this config.
     */
    validateConfigOverwrites(
    // Must be determined for overwrites down the line.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    config) {
        return [];
    }
    get name() {
        return this.homebridgeAccessory.displayName;
    }
    setTuyaCharacteristic(characteristic, data) {
        if (this.updateCallbackList.has(characteristic)) {
            const updateCallback = this.updateCallbackList.get(characteristic);
            updateCallback && updateCallback(data);
        }
    }
    setCharacteristic(characteristic, value, updateHomekit = false) {
        var _a;
        updateHomekit &&
            ((_a = this.service) === null || _a === void 0 ? void 0 : _a.getCharacteristic(characteristic).updateValue(value));
    }
    onIdentify() {
        this.log.info("[IDENTIFY] %s", this.name);
    }
    cachedValue(always = false) {
        return this.cache.get(always);
    }
    async resolveDeviceStateRequest() {
        const promise = this.debouncedDeviceStateRequestPromise;
        if (!promise) {
            this.error("Could not find base accessory promise.");
            return;
        }
        this.debug("Unsetting debouncedDeviceStateRequestPromise");
        this.debouncedDeviceStateRequestPromise = undefined;
        const cached = this.cache.get();
        if (cached !== null) {
            this.debug("Resolving resolveDeviceStateRequest from cache");
            if (!(0, TuyaBoolean_1.TuyaBoolean)(cached.online)) {
                return promise.reject(new DeviceOfflineError_1.DeviceOfflineError());
            }
            return promise.resolve(cached);
        }
        try {
            const data = await this.platform.tuyaWebApi.getDeviceState(this.deviceId);
            this.debug("Resolving resolveDeviceStateRequest from remote");
            this.debug("Set device state request cache");
            this.cache.set(data);
            if (!(0, TuyaBoolean_1.TuyaBoolean)(data.online)) {
                return promise.reject(new DeviceOfflineError_1.DeviceOfflineError());
            }
            return promise.resolve(data);
        }
        catch (error) {
            if (error instanceof errors_1.RateLimitError) {
                this.debug("Renewing cache due to RateLimitError");
                const data = this.cache.get(true);
                if (!(0, TuyaBoolean_1.TuyaBoolean)(data === null || data === void 0 ? void 0 : data.online)) {
                    return promise.reject(new DeviceOfflineError_1.DeviceOfflineError());
                }
                if (data) {
                    this.cache.renew();
                    return promise.resolve(data);
                }
            }
            if (error instanceof Error) {
                return promise.reject(error);
            }
            else {
                return promise.reject(new Error(JSON.stringify(error)));
            }
        }
    }
    async getDeviceState() {
        this.debug("Requesting device state");
        if (!this.debouncedDeviceStateRequestPromise) {
            this.debug("Creating new debounced promise");
            this.debouncedDeviceStateRequestPromise = new DebouncedPromise_1.DebouncedPromise();
        }
        this.debug("Triggering debouncedDeviceStateRequest");
        // Awaiting this promise is the responsibility of the caller.
        void this.debouncedDeviceStateRequest();
        return this.debouncedDeviceStateRequestPromise.promise;
    }
    /**
     * Caches the remote state
     * @param method
     * @param payload
     * @param cache tuya value to store in the cache
     */
    async setDeviceState(method, payload, cache) {
        this.cache.merge(cache);
        return this.platform.tuyaWebApi.setDeviceState(this.deviceId, method, payload);
    }
    updateAccessory(device) {
        var _a;
        const setCharacteristic = (characteristic, value) => {
            const char = accessoryInformationService.getCharacteristic(characteristic) ||
                accessoryInformationService.addCharacteristic(characteristic);
            if (char) {
                char.setValue(value);
            }
        };
        this.homebridgeAccessory.displayName = device.name;
        this.homebridgeAccessory._associatedHAPAccessory.displayName = device.name;
        const accessoryInformationService = (_a = this.homebridgeAccessory.getService(this.platform.Service.AccessoryInformation)) !== null && _a !== void 0 ? _a : this.homebridgeAccessory.addService(this.platform.Service.AccessoryInformation);
        setCharacteristic(this.platform.Characteristic.Name, device.name);
        setCharacteristic(this.platform.Characteristic.SerialNumber, this.deviceConfig.id);
        setCharacteristic(this.platform.Characteristic.Manufacturer, settings_1.PLUGIN_NAME);
        setCharacteristic(this.platform.Characteristic.Model, device.dev_type
            .split("_")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" "));
        // Update device specific state
        this.updateState(device.data);
    }
    updateState(data) {
        this.cache.set(data);
        for (const [, callback] of this.updateCallbackList) {
            if (callback !== null) {
                callback(data);
            }
        }
    }
    addUpdateCallback(char, callback) {
        this.updateCallbackList.set(char, callback);
    }
    handleError(type, callback) {
        return (error) => {
            if (error instanceof DeviceOfflineError_1.DeviceOfflineError) {
                this.error("%s", error.message);
            }
            else {
                this.error("[%s] %s", type, error.message);
            }
            callback(error);
        };
    }
    shortcutLog(logLevel, message, ...args) {
        this.log.log(logLevel, `[%s] - ${message}`, this.name, ...args);
    }
    debug(message, ...args) {
        this.shortcutLog("debug" /* LogLevel.DEBUG */, message, ...args);
    }
    info(message, ...args) {
        this.shortcutLog("info" /* LogLevel.INFO */, message, ...args);
    }
    warn(message, ...args) {
        this.shortcutLog("warn" /* LogLevel.WARN */, message, ...args);
    }
    error(message, ...args) {
        this.shortcutLog("error" /* LogLevel.ERROR */, message, ...args);
    }
}
exports.BaseAccessory = BaseAccessory;
//# sourceMappingURL=BaseAccessory.js.map