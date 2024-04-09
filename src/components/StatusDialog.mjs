import { subscribe } from "../utilities/pubsub.mjs";

// prevent cancel with "escape" key
const noCancel = (event) => event.preventDefault();

export class StatusDialog extends HTMLDialogElement {
  static ELEMENT_NAME = "cc-status-dialog";
  static #instance;
  #output;

  constructor() {
    super();

    StatusDialog.#instance = this;

    this.setAttribute("is", StatusDialog.ELEMENT_NAME);

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

  static handleEvents({ level, message, title }) {
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
  }

  static insert(title, message) {
    const dialog = document.createElement("dialog", { is: StatusDialog.ELEMENT_NAME });

    dialog.innerHTML = `
      <h2 id="status-dialog--title">${title}</h2>
      <p id="status-dialog--message">${message}</p>
      <div id="status-dialog--log" style="background: gainsboro; height: 12em; overflow: auto;"></div>
    `;

    document.body.appendChild(dialog);
  }

  static listenFor(...events) {
    events.forEach((event) => subscribe(event, StatusDialog.handleEvents));
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

customElements.define(StatusDialog.ELEMENT_NAME, StatusDialog, { extends: "dialog" });
