import { TuyaWebApi } from "../src/api/service";

import { config } from "./environment";
import assert from "assert";
import * as os from "os";
import { before, describe, it } from "mocha";

// These tests talk to the real Tuya Smart Life API and require a
// `test/environment.ts` file that exports a `config` object with at
// least `userCode` and `deviceId`. The first run will require a manual
// QR code scan; subsequent runs reuse the saved tokens.

describe("TuyaWebApi", () => {
  let api: TuyaWebApi;

  before(() => {
    api = new TuyaWebApi(
      config.userCode,
      config.storagePath ?? os.tmpdir(),
    );
  });

  describe("get access token", () => {
    it("should get an access token from the Smart Life API", (done) => {
      api
        .getOrRefreshToken()
        .then(() => {
          assert.ok(true, "Token acquired");
          done();
        })
        .catch((error) => {
          done(error);
        });
    });
  });

  describe("discover devices", () => {
    it("should get a list with devices", (done) => {
      api
        .discoverDevices()
        .then((devices) => {
          assert.notStrictEqual((devices || []).length, 0, "No devices found");
          done();
        })
        .catch((error) => {
          done(error);
        });
    });
  });

  describe("get device state", () => {
    it("should get the state of a device", (done) => {
      const deviceId = config.deviceId;
      api
        .getDeviceState(deviceId)
        .then((data) => {
          assert.notStrictEqual(data.state, null, "No device state received");
          done();
        })
        .catch((error) => {
          done(error);
        });
    });
  });

  describe("set device state", () => {
    it("should set the state of a device", (done) => {
      const deviceId = config.deviceId;
      api
        .setDeviceState(deviceId, "turnOnOff", { value: 1 })
        .then(() => {
          assert.ok(true, "Device has been set");
          done();
        })
        .catch((error) => {
          done(error);
        });
    });
  });
});
