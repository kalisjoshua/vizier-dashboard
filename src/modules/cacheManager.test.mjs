import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { decrypt, encrypt } from "../utilities/crypto.mjs";
import { ONE_DAY, CACHE_TIME, cacheManager } from "./cacheManager.mjs";

describe("cacheManager", () => {
  let FOO;
  let STORE;

  global.localStorage = {
    getItem: (key) => STORE[key],
    setItem: (key, val) => (STORE[key] = val),
  };

  beforeEach(() => {
    FOO = [{ url: "http://foo.bar" }];
    STORE = {};
  });

  it("should provide a const for `CACHE_TIME`", () => {
    assert.equal(CACHE_TIME, 1000 * 60 * 60);
  });

  it("should provide a const for `ONE_DAY`", () => {
    assert.equal(ONE_DAY, 1000 * 60 * 60 * 24);
  });

  it("should have events", () => {
    assert.deepEqual(cacheManager.events, {
      DECRYPT: "EVENT_CACHE_MANAGER_DECRYPT",
      EMPTY: "EVENT_CACHE_MANAGER_EMPTY",
      EXPIRED: "EVENT_CACHE_MANAGER_EXPIRED",
      HISTORY: "EVENT_CACHE_MANAGER_HISTORY",
      STATUS: "EVENT_CACHE_MANAGER_STATUS",
      UPDATED: "EVENT_CACHE_MANAGER_UPDATED",
    });
  });

  it("should have methods", () => {
    assert.deepEqual(Object.keys(cacheManager), [
      "events",
      "hasData",
      "isFresh",
      "lastUpdated",
      "onUpdated",
      "onValidConfig",
      "read",
      "write",
      "pub",
      "sub",
    ]);
  });

  it("should read and write from/to localStorage", () => {
    assert.equal(cacheManager.read(), undefined);

    const expected = { [FOO[0].url]: FOO[0] };
    const result = cacheManager.write(FOO);

    assert.deepEqual(cacheManager.read()?.data, result);
    assert.deepEqual(cacheManager.read()?.data, { [FOO[0].url]: FOO[0] });
  });

  it("should check if there is data in the store", () => {
    assert(!cacheManager.hasData());

    cacheManager.write(FOO);

    assert(cacheManager.hasData());
  });

  it("should validate if the data is recent (fresh)", () => {
    assert(!cacheManager.hasData());
    // if there is no data it can not be fresh
    assert(!cacheManager.isFresh());

    // writing with no `cached_at` time will default it to being stale
    cacheManager.write(FOO);

    assert(!cacheManager.isFresh());

    // writing with a `cached_at` time will set to that timestamp
    cacheManager.write(FOO, Date.now());

    assert(cacheManager.isFresh());
  });

  it("should return the timestamp when the data was written to the store", () => {
    assert(!cacheManager.lastUpdated());

    const when = 1234;

    cacheManager.write(FOO, when);

    assert.equal(cacheManager.lastUpdated(), when);
  });

  it("should handle updated data", (test) => {
    const fn = test.mock.fn();

    test.mock.method(cacheManager, "pub", fn);

    assert.equal(fn.mock.calls.length, 0);
    assert(!cacheManager.read());

    cacheManager.onUpdated({ data: FOO });

    assert.equal(fn.mock.calls.length, 1);
    assert.deepEqual(fn.mock.calls[0].arguments, [
      "EVENT_CACHE_MANAGER_UPDATED",
      { level: "complete", message: "Data up to data. ;)" },
    ]);
    assert.deepEqual(cacheManager.read()?.data, {
      "http://foo.bar": {
        url: "http://foo.bar",
      },
    });
  });

  it("should throw for no data provided to onUpdated", (test) => {
    const fn = test.mock.fn();

    test.mock.method(cacheManager, "pub", fn);

    assert.throws(() => {
      cacheManager.onUpdated();
    }, /^Error: No data provided to cacheManager.onUpdated$/);
    assert.equal(fn.mock.calls.length, 1);
    assert.deepEqual(fn.mock.calls[0].arguments, [
      "EVENT_CACHE_MANAGER_EMPTY",
      { level: "error", message: "No data provided to cacheManager.onUpdated" },
    ]);
  });

  describe("onValidConfig", async () => {
    const encryptionKey = "this is only a test";
    const mockPR = { url: "test://mock.pr" };
    const mockJSON = {
      data: [await encrypt(JSON.stringify(mockPR), encryptionKey)],
      updated_at: Date.now(),
    };

    beforeEach((test) => {
      global.fetch = test.mock.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve(mockJSON),
        })
      );

      test.mock.method(cacheManager, "pub", test.mock.fn());
    });

    it("should fetch server-cached data: failed fetch", async (test) => {
      global.fetch = test.mock.fn();

      await cacheManager.onValidConfig({ encryptionKey });

      const result = cacheManager.pub.mock.calls.some(
        ({ arguments: args }) => args[0] === cacheManager.events.HISTORY && args[1].level === "error"
      );

      assert(result);
    });

    it("should fetch server-cached data: failed decrypt", async (test) => {
      await cacheManager.onValidConfig({ encryptionKey: "not the correct key" });

      const result = cacheManager.pub.mock.calls.some(
        ({ arguments: args }) => args[0] === cacheManager.events.DECRYPT && args[1].level === "error"
      );

      assert(result);
    });

    it("should fetch server-cached data: success (happy path)", async (test) => {
      assert.equal(cacheManager.pub.mock.calls.length, 0);

      await cacheManager.onValidConfig({ encryptionKey });

      const [event, { level }] = cacheManager.pub.mock.calls.pop().arguments;

      assert.equal(event, cacheManager.events.UPDATED);
      assert.equal(level, "complete");
    });

    it("should NOT fetch server-cached data with local data: fresh", async () => {
      cacheManager.write(FOO, Date.now());

      await cacheManager.onValidConfig({ encryptionKey });

      const [event, { level }] = cacheManager.pub.mock.calls.pop().arguments;

      assert.equal(event, cacheManager.events.UPDATED);
      assert.equal(level, "complete");
    });

    it("should NOT fetch server-cached data with local data: stale", async () => {
      cacheManager.write(FOO);

      await cacheManager.onValidConfig({ encryptionKey });

      const [event, { level }] = cacheManager.pub.mock.calls.pop().arguments;

      assert.equal(event, cacheManager.events.EXPIRED);
      assert.equal(level, "info");
    });
  });
});
