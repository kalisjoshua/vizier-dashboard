const EVENT_NAME = "STATUS_DIALOG_EVENT";
const NAME = "cc-status-dialog";

const text = {};

// prevent cancel with "escape" key
const noCancel = (event) => event.preventDefault();

export function statusDialogEvent(...args) {
  StatusDialog.dispatchEvent(...args);
}

function update(output, { detail }) {
  output.innerHTML += detail;
  output.scrollTop = output.scrollHeight;
}

export class StatusDialog extends HTMLDialogElement {
  #updateFn;

  constructor() {
    super();

    this.setAttribute("is", NAME);

    this.style = `
      border-radius: 2ex;
      width: 30em;
    `;
  }

  static appendTo(parent) {
    const el = document.createElement("dialog", { is: NAME });

    parent.appendChild(el);
  }

  connectedCallback() {
    this.innerHTML = [
      `<h2>${text.title}</h2>`,
      text.message && `<p>${text.message}</p>`,
      `<div style="background: gainsboro; height: 12em; overflow: auto;"></div>`,
    ]
      .filter(Boolean)
      .join("");

    this.addEventListener("cancel", noCancel);

    const output = this.querySelector("div");

    this.#updateFn = (event) => update(output, event);

    addEventListener(EVENT_NAME, this.#updateFn);

    this.showModal();
  }

  disconnectedCallback() {
    removeEventListener(EVENT_NAME, this.#updateFn);
    this.removeEventListener("cancel", noCancel);
  }

  static dispatchEvent(message) {
    setTimeout(() => {
      // get the event dispatch off the main thread
      dispatchEvent(new CustomEvent(EVENT_NAME, { detail: message }));
    }, 1);
  }

  static getDialog() {
    return inDOM(`[is="${NAME}"]`);
  }

  setComplete(message) {
    this.removeEventListener("cancel", noCancel);

    message && statusDialogEvent(message);

    const button = document.createElement("button");

    button.innerHTML = "Close dialog";
    button.onclick = () => {
      this.close();
      this.remove();
    };
    button.style = "margin: 1em 0;";

    this.appendChild(button);
  }

  static setMessage(message) {
    text.message = message;
  }

  static setTitle(title) {
    text.title = title;
  }
}

customElements.define(NAME, StatusDialog, { extends: "dialog" });
