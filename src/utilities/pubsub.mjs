import { requiredArg } from "./requiredArgument.mjs";

/**
 *
 * @param {string} name - name of the pubsub object to create; provides for
 * more specific error messages for missing arguments in `pub` and `sub`.
 *
 * @param {{events?: Object.<string, string>, [...key: string]: any}} config -
 * object to be augmented with `pub` and `sub` methods.
 *
 * @returns
 */
export function addPubSub(name = requiredArg("addPubSub", "name"), config = requiredArg("addPubSub", "config")) {
  return Object.assign(config, {
    /**
     * Publish and event with the provided data.
     *
     * @param {string} event - event name (key of the events property)
     *
     * @param {any} data - data (any type) to pass to the event handler
     */
    pub(event = requiredArg(name, "event"), data = {}) {
      const detail = JSON.stringify(data);
      const custom = new CustomEvent(this.events[event] ?? event, { detail });

      setTimeout(() => dispatchEvent(custom), 1);
    },

    /**
     * Subscribe, to an event, the provided method name or function definition.
     *
     * @param {string} event - string name of event
     *
     * @param {function|string} handler - name of a method (string) or a
     * function to execute for the event
     */
    sub(event = requiredArg(name, "event"), handler = requiredArg(name, "handler")) {
      subscribe.call(this, event, this[handler]?.bind(this) ?? handler);
    },
  });
}

/**
 * Subscribe, to an event, the provided method name or function definition.
 *
 * @param {string} event - string name of event
 *
 * @param {function|string} handler - name of a method (string) or a
 * function to execute for the event
 */
export function subscribe(event = requiredArg("subscribe", "event"), handler = requiredArg("subscribe", "handler")) {
  addEventListener(event, ({ detail }) => handler(JSON.parse(detail)));
}
