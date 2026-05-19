"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginControl = void 0;
const axios_1 = __importDefault(require("axios"));
const LOGIN_HOST = "https://apigw.iotbing.com";
const CLIENT_ID = "HA_3y9q4ak7g4ephrvke";
const SCHEMA = "haauthorize";
const QR_CODE_HEADER = "tuyaSmart--qrLogin?token=";
class LoginControl {
    /**
     * Generate a QR code token for pairing.
     * Returns the raw token string and the full QR data to encode.
     */
    async generateQrCode(userCode, log) {
        var _a, _b;
        const url = `${LOGIN_HOST}/v1.0/m/life/home-assistant/qrcode/tokens`;
        const params = {
            clientid: CLIENT_ID,
            usercode: userCode,
            schema: SCHEMA,
        };
        log === null || log === void 0 ? void 0 : log.debug("Requesting QR code token...");
        const response = await axios_1.default.post(url, null, { params, timeout: 30000 });
        const data = response.data;
        if (!data.success || !((_a = data.result) === null || _a === void 0 ? void 0 : _a.qrcode)) {
            throw new Error(`Failed to generate QR code: ${(_b = data.msg) !== null && _b !== void 0 ? _b : "unknown error"} (code: ${data.code})`);
        }
        const token = data.result.qrcode;
        return {
            token,
            qrData: QR_CODE_HEADER + token,
        };
    }
    /**
     * Poll for login result after the user scans the QR code.
     * Returns null if the user hasn't scanned yet.
     */
    async checkLoginResult(token, userCode) {
        var _a, _b;
        const url = `${LOGIN_HOST}/v1.0/m/life/home-assistant/qrcode/tokens/${token}`;
        const params = {
            clientid: CLIENT_ID,
            usercode: userCode,
        };
        const response = await axios_1.default.get(url, { params, timeout: 30000 });
        const data = response.data;
        if (!data.success) {
            return null;
        }
        const result = data.result;
        return {
            uid: result.uid,
            access_token: result.access_token,
            refresh_token: result.refresh_token,
            expire_time: result.expire_time,
            terminal_id: result.terminal_id,
            endpoint: result.endpoint,
            username: (_a = result.username) !== null && _a !== void 0 ? _a : "",
            t: (_b = data.t) !== null && _b !== void 0 ? _b : Date.now(),
        };
    }
    /**
     * Wait for user to scan QR code with polling.
     * @param timeoutMs How long to wait (default 5 minutes)
     * @param pollIntervalMs How often to poll (default 2 seconds)
     */
    async waitForLogin(token, userCode, log, timeoutMs = 300000, pollIntervalMs = 2000) {
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            try {
                const result = await this.checkLoginResult(token, userCode);
                if (result) {
                    return result;
                }
            }
            catch (_a) {
                // not ready yet
            }
            await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
            log === null || log === void 0 ? void 0 : log.debug("Waiting for QR code scan...");
        }
        throw new Error("QR code login timed out. Please restart Homebridge and try again.");
    }
}
exports.LoginControl = LoginControl;
//# sourceMappingURL=loginControl.js.map