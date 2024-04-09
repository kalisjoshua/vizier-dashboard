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
      setTimeout(() => {
        dispatchEvent(new CustomEvent(this.events[event] ?? event, { detail: JSON.stringify(data) }));
      }, 1);
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
      addEventListener(event, ({ detail }) => (this[handler]?.bind(this) ?? handler)(JSON.parse(detail)));
    },
  });
}
