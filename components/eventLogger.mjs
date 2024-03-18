const noCancel = (event) => event.preventDefault();

export class EventLogger extends HTMLDialogElement {
  #output;
  #updateFn;

  constructor() {
    super();

    this.style = `
            border-radius: 2ex;
            width: 30em;
        `;

    this.#updateFn = ({ detail: { url } }) => {
      this.#output.innerHTML += `<p>Retrieved data for:\n${url}</p>`;
      this.#output.scrollTop = this.#output.scrollHeight;
    };
  }

  connectedCallback() {
    this.innerHTML = [
      "<h2>Fetching content from the GitHub API</h2>",
      this.dataset.fetch === "open"
        ? "<p>Updating to latest data for PRs.</p>"
        : "<p>Please wait while all PR data is retrieved.</p>",
      `<div style="background: gainsboro; height: 12em; overflow: auto;"></div>`,
    ].join("");

    this.#output = this.querySelector("div");

    addEventListener(this.dataset.event, this.#updateFn);

    // prevent cancel with "escape" key
    this.addEventListener("cancel", noCancel);

    this.showModal();
  }

  static create(eventName, pulls) {
    const el = document.createElement("dialog", { is: "event-logger" });

    el.dataset.event = eventName;
    el.dataset.fetch = pulls.hasData() ? "open" : "all";

    return el;
  }

  disconnectedCallback() {
    removeEventListener(this.dataset.event, this.#updateFn);
    this.removeEventListener("cancel", noCancel);
  }

  setComplete(message) {
    this.removeEventListener("cancel", noCancel);
    this.innerHTML += `<p>${message}</p>`;

    const button = document.createElement("button");

    button.innerHTML = "View Analysis";
    button.onclick = () => this.close();

    this.appendChild(button);
  }
}

customElements.define("event-logger", EventLogger, { extends: "dialog" });
