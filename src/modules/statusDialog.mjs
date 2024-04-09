import { addPubSub } from "../utilities/pubsub.mjs";

const NAME = "cc-status-dialog";

// prevent cancel with "escape" key
const noCancel = (event) => event.preventDefault();

export const statusDialog = addPubSub("statusDialog", {
  events: {},
  handleEvents({ level, message, title }) {
    let dialog = StatusDialog.getInstance();

    if (title && !dialog) {
      StatusDialog.insert(title, message);
    }

    dialog ??= StatusDialog.getInstance();

    if (!title && message && dialog) {
      dialog.appendToLog(message);
    }

    if (/^complete$/i.test(level.trim())) {
      dialog?.setComplete();
    }
  },
});

class StatusDialog extends HTMLDialogElement {
  static #instance;
  #output;

  constructor() {
    super();

    StatusDialog.#instance = this;

    this.setAttribute("is", NAME);

    this.style = `
      border-radius: 2ex;
      width: 30em;
    `;
  }

  appendToLog(message) {
    this.#output.innerHTML += `<p>${message}</p>`;
    this.#output.scrollTop = this.#output.scrollHeight;
  }

  connectedCallback() {
    this.addEventListener("cancel", noCancel);

    this.#output = this.querySelector("div");

    this.showModal();
  }

  disconnectedCallback() {
    this.removeEventListener("cancel", noCancel);
  }

  static getInstance() {
    return StatusDialog.#instance;
  }

  static insert(title, message) {
    const dialog = document.createElement("dialog", { is: NAME });

    dialog.innerHTML = `
      <h2 id="status-dialog--title">${title}</h2>
      <p id="status-dialog--message">${message}</p>
      <div id="status-dialog--log" style="background: gainsboro; height: 12em; overflow: auto;"></div>
    `;

    document.body.appendChild(dialog);
  }

  setComplete() {
    this.removeEventListener("cancel", noCancel);

    const button = document.createElement("button");

    button.innerHTML = "Close dialog";
    button.onclick = () => {
      this.close();
      this.remove();
    };
    button.style = "margin: 1em 0;";

    this.appendChild(button);
  }
}

customElements.define(NAME, StatusDialog, { extends: "dialog" });
