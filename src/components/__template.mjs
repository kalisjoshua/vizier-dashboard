const NAME = "cc-access-config";

export class Component extends HTMLElement {
  // static observedAttributes = ["color", "size"];

  constructor() {
    // Always call super first in constructor
    super();
  }

  adoptedCallback() {
    // console.log("Custom element moved to new page.");
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // console.log(`Attribute ${name} has changed.`);
  }

  connectedCallback() {
    // console.log("Custom element added to page.");
  }

  disconnectedCallback() {
    // console.log("Custom element removed from page.");
  }
}

// customElements.define(NAME, Component, { extends: "dialog" });
customElements.define(NAME, Component);
