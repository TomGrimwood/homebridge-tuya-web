"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerApi = void 0;
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const REQUEST_TIMEOUT = 30000;
class CustomerApi {
    constructor(tokenInfo, clientId, userCode, endpoint, tokenListener, log) {
        this.clientId = clientId;
        this.userCode = userCode;
        this.endpoint = endpoint;
        this.tokenListener = tokenListener;
        this.log = log;
        this.refreshingToken = false;
        this.tokenInfo = tokenInfo;
        this.session = axios_1.default.create({ timeout: REQUEST_TIMEOUT });
    }
    async request(method, path, params, body) {
        var _a;
        await this.refreshAccessTokenIfNeeded();
        const rid = crypto_1.default.randomUUID();
        const sid = "";
        const hashKey = crypto_1.default
            .createHash("md5")
            .update(rid + this.tokenInfo.refresh_token)
            .digest("hex");
        const secret = secretGenerating(rid, sid, hashKey);
        let queryEncdata = "";
        let processedParams;
        if (params && Object.keys(params).length > 0) {
            const json = JSON.stringify(params);
            const encrypted = aesGcmEncrypt(json, secret);
            queryEncdata = encrypted;
            processedParams = { encdata: encrypted };
        }
        let bodyEncdata = "";
        let processedBody;
        if (body && Object.keys(body).length > 0) {
            const json = JSON.stringify(body);
            const encrypted = aesGcmEncrypt(json, secret);
            bodyEncdata = encrypted;
            processedBody = { encdata: encrypted };
        }
        const t = Date.now();
        const headers = {
            "X-appKey": this.clientId,
            "X-requestId": rid,
            "X-sid": sid,
            "X-time": String(t),
        };
        if (this.tokenInfo.access_token) {
            headers["X-token"] = this.tokenInfo.access_token;
        }
        headers["X-sign"] = restfulSign(hashKey, queryEncdata, bodyEncdata, headers);
        (_a = this.log) === null || _a === void 0 ? void 0 : _a.debug("CustomerApi %s %s", method, path);
        const response = await this.session.request({
            method,
            url: this.endpoint + path,
            params: processedParams,
            data: processedBody,
            headers,
            timeout: REQUEST_TIMEOUT,
        });
        const ret = response.data;
        if (!ret.success) {
            throw new Error(`API error (${ret.code}): ${ret.msg}`);
        }
        let decryptedResult;
        try {
            const decrypted = aesGcmDecrypt(ret.result, secret);
            try {
                decryptedResult = JSON.parse(decrypted);
            }
            catch (_b) {
                decryptedResult = decrypted;
            }
        }
        catch (_c) {
            decryptedResult = ret.result;
        }
        return {
            success: ret.success,
            result: decryptedResult,
            code: ret.code,
            msg: ret.msg,
            t: ret.t,
        };
    }
    async refreshAccessTokenIfNeeded() {
        var _a, _b, _c, _d, _e, _f;
        if (this.refreshingToken) {
            return;
        }
        const now = Date.now();
        const expiredTime = this.tokenInfo.expire_time;
        if (expiredTime - 60000 > now) {
            return;
        }
        this.refreshingToken = true;
        try {
            const response = await this.get(`/v1.0/m/token/${this.tokenInfo.refresh_token}`);
            if (response.success) {
                const result = response.result;
                const newTokenInfo = {
                    t: (_a = response.t) !== null && _a !== void 0 ? _a : Date.now(),
                    expire_time: ((_b = response.t) !== null && _b !== void 0 ? _b : Date.now()) + ((_c = result.expireTime) !== null && _c !== void 0 ? _c : 7200) * 1000,
                    uid: result.uid,
                    access_token: result.accessToken,
                    refresh_token: result.refreshToken,
                };
                this.tokenInfo = newTokenInfo;
                (_d = this.tokenListener) === null || _d === void 0 ? void 0 : _d.updateToken(newTokenInfo);
                (_e = this.log) === null || _e === void 0 ? void 0 : _e.info("Tuya token refreshed successfully");
            }
        }
        catch (e) {
            (_f = this.log) === null || _f === void 0 ? void 0 : _f.error("Failed to refresh token: %s", e instanceof Error ? e.message : String(e));
        }
        finally {
            this.refreshingToken = false;
        }
    }
    async get(path, params) {
        return this.request("GET", path, params);
    }
    async post(path, params, body) {
        return this.request("POST", path, params, body);
    }
}
exports.CustomerApi = CustomerApi;
// ---------- Crypto utilities (ported from tuya-device-sharing-sdk) ----------
function randomNonce(length) {
    const chars = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}
function secretGenerating(rid, sid, hashKey) {
    var _a;
    let message = hashKey;
    const mod = 16;
    if (sid) {
        const length = Math.min(sid.length, mod);
        let ecode = "";
        for (let i = 0; i < length; i++) {
            const idx = sid.charCodeAt(i) % mod;
            ecode += (_a = sid[idx]) !== null && _a !== void 0 ? _a : "";
        }
        message += "_" + ecode;
    }
    const hmac = crypto_1.default.createHmac("sha256", Buffer.from(rid, "utf8"));
    hmac.update(Buffer.from(message, "utf8"));
    const hex = hmac.digest("hex");
    return hex.substring(0, 16);
}
function aesGcmEncrypt(rawData, secret) {
    const nonce = randomNonce(12);
    const nonceBuffer = Buffer.from(nonce, "utf8");
    const secretBuffer = Buffer.from(secret, "utf8");
    const cipher = crypto_1.default.createCipheriv("aes-128-gcm", secretBuffer, nonceBuffer);
    const encrypted = Buffer.concat([
        cipher.update(rawData, "utf8"),
        cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    const ciphertext = Buffer.concat([encrypted, authTag]);
    return nonceBuffer.toString("base64") + ciphertext.toString("base64");
}
function aesGcmDecrypt(cipherData, secret) {
    const decoded = Buffer.from(cipherData, "base64");
    const nonce = decoded.subarray(0, 12);
    const ciphertextWithTag = decoded.subarray(12);
    const secretBuffer = Buffer.from(secret, "utf8");
    const authTag = ciphertextWithTag.subarray(ciphertextWithTag.length - 16);
    const encrypted = ciphertextWithTag.subarray(0, ciphertextWithTag.length - 16);
    const decipher = crypto_1.default.createDecipheriv("aes-128-gcm", secretBuffer, nonce);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]);
    return decrypted.toString("utf8");
}
function restfulSign(hashKey, queryEncdata, bodyEncdata, data) {
    var _a;
    const headerKeys = ["X-appKey", "X-requestId", "X-sid", "X-time", "X-token"];
    let headerSignStr = "";
    for (const key of headerKeys) {
        const val = (_a = data[key]) !== null && _a !== void 0 ? _a : "";
        if (val) {
            headerSignStr += key + "=" + val + "||";
        }
    }
    let signStr = headerSignStr.substring(0, headerSignStr.length - 2);
    if (queryEncdata) {
        signStr += queryEncdata;
    }
    if (bodyEncdata) {
        signStr += bodyEncdata;
    }
    const hmac = crypto_1.default.createHmac("sha256", Buffer.from(hashKey, "utf8"));
    hmac.update(Buffer.from(signStr, "utf8"));
    return hmac.digest("hex");
}
//# sourceMappingURL=customerApi.js.map