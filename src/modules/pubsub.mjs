function required(parent, name) {
  throw new Error(`Argument "${name}" must be provided for "${parent}".`);
}

export function pubsubFactory(
  name = requireArgument("pubsubFactory", "name"),
  { events = {}, ...methods } = required("pubsubFactory", "instance")
) {
  return {
    ...methods,

    events: Object.freeze(events),

    pub(event = required(name, "event"), data = {}) {
      setTimeout(() => {
        dispatchEvent(new CustomEvent(this.events[event] ?? event, { detail: JSON.stringify(data) }));
      }, 1);
    },

    sub(event = requiredArgument(name, "event"), fn = requiredArgument(name, "fn")) {
      addEventListener(event, ({ detail }) => (this[fn]?.bind(this) ?? fn)(JSON.parse(detail)));
    },
  };
}
