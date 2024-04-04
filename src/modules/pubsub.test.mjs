import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { addPubSub } from "./pubsub.mjs";

describe("pubsub", () => {
  const psTestingInstance = addPubSub("psTestingInstance", {
    events: {
      FUN: "EVENT_PUBSUB_FUN",
    },

    fun(data) {
      return data;
    },
  });

  it("should throw for no name arg", () => {
    assert.throws(() => {
      addPubSub();
    }, /^Error: Argument "name" must be provided for "addPubSub".$/);
  });

  it("should throw for no config value", () => {
    assert.throws(() => {
      addPubSub("name");
    }, /^Error: Argument "config" must be provided for "addPubSub".$/);
  });

  describe("subscribe", () => {
    it("should throw for no event", () => {
      assert.throws(() => {
        psTestingInstance.sub();
      }, /^Error: Argument "event" must be provided for "psTestingInstance".$/);
    });

    it("should throw for no handler", () => {
      assert.throws(() => {
        psTestingInstance.sub("FUN");
      }, /^Error: Argument "handler" must be provided for "psTestingInstance".$/);
    });

    it("should register subscriber function: string", (test) => {
      let handler;

      global.addEventListener = test.mock.fn((_, fn) => {
        handler = fn;
      });

      const expected = { foo: "bar" };

      psTestingInstance.sub("FUN", "fun");

      const actual = handler({ detail: JSON.stringify(expected) });

      assert.deepEqual(actual, expected);
    });

    it("should register subscriber function: function", (test) => {
      let handler;

      global.addEventListener = test.mock.fn((_, fn) => {
        handler = fn;
      });

      const expected = Symbol("something different");

      psTestingInstance.sub("FUN", () => expected);

      // NOTE: intentionally different to show that the registered function is working
      const actual = handler({ detail: JSON.stringify({ foo: "bar" }) });

      assert.deepEqual(actual, expected);
    });
  });

  describe("publish", () => {
    it("should throw for no event", () => {
      assert.throws(() => {
        psTestingInstance.pub();
      }, /^Error: Argument "event" must be provided for "psTestingInstance".$/);
    });

    it("should dispatch an event: registered", (test) => {
      test.mock.timers.enable({ apis: ["setTimeout"] });

      global.dispatchEvent = test.mock.fn();

      const expected = { foo: 1 };

      psTestingInstance.pub("FUN", expected);

      assert(global.dispatchEvent.mock.calls.length === 0);

      test.mock.timers.tick(1);

      assert(global.dispatchEvent.mock.calls.length === 1);

      const [{ detail, type }, ...rest] = global.dispatchEvent.mock.calls[0].arguments;

      assert.equal(type, psTestingInstance.events.FUN);
      assert.deepEqual(detail, JSON.stringify(expected));
      assert(rest.length === 0);
    });

    it("should dispatch an event: unregistered", (test) => {
      test.mock.timers.enable({ apis: ["setTimeout"] });

      global.dispatchEvent = test.mock.fn();

      const EVENT = "UNREGISTERED";
      const expected = { foo: 9 };

      psTestingInstance.pub(EVENT, expected);

      assert(global.dispatchEvent.mock.calls.length === 0);

      test.mock.timers.tick(1);

      assert(global.dispatchEvent.mock.calls.length === 1);

      const [{ detail, type }, ...rest] = global.dispatchEvent.mock.calls[0].arguments;

      assert.equal(type, EVENT);
      assert.deepEqual(detail, JSON.stringify(expected));
      assert(rest.length === 0);
    });
  });
});
