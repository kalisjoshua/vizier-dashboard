import { githubSDKFactory } from "../lib/gh.mjs";

const NAME = "access-config";
const configDialog = inDOM(`[is="${NAME}"]`);

class AccessConfig extends HTMLDialogElement {
  #inputOrg;
  #inputRepos;
  #inputToken;

  constructor() {
    super();

    // prevent cancel with "escape" key without a saved token
    this.addEventListener("cancel", (event) => {
      if (!configManager.getToken()) {
        event.preventDefault();
      }
    });

    this.#inputOrg = this.querySelector("#org");
    this.#inputRepos = this.querySelector("#repos");
    this.#inputToken = this.querySelector("#token");

    if (!this.#inputToken) {
      throw new Error("No textarea found for token entry.");
    }

    this.#addConfigLink();
    this.#addButtonHandlers();
  }

  #addButtonHandlers() {
    const handlers = {
      save: this.#saveHandler.bind(this),
      test: this.#testHandler.bind(this),
    };

    Array.from(this.querySelectorAll("button")).forEach((button) => {
      const [text] = button.innerHTML.toLowerCase().match(/save|test/);

      button.addEventListener("click", handlers[text]);
    });
  }

  #addConfigLink() {
    const button = document.createElement("button");

    button.addEventListener("click", () => {
      const { org, repos, token } = configManager.read();

      this.#inputOrg.value = org;
      this.#inputRepos.value = repos ? repos.join("\n") : "";
      this.#inputToken.value = token;
      this.showModal();
    });

    button.innerText = "Config";
    button.style = `background: transparent; border: 0; cursor: pointer; font-size: inherit`;
    button.title = "Edit the stored token";

    inDOM(`header > nav > menu`).appendChild(button);
  }

  async #saveHandler(event) {
    event.preventDefault();

    const org = this.#inputOrg.value.trim();
    const repos = this.#inputRepos.value
      .trim()
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const token = this.#inputToken.value.trim();
    const updateToken = token ? await tokenTest(token) : confirm("Are you sure that you want to erase your token?");

    if (org && repos && updateToken) {
      configManager.write({ org, repos, token });

      this.close();
    } else if (token) {
      alert("The token provided is not valid.");
    }
  }

  async #testHandler(event) {
    event.preventDefault();

    const token = this.#inputToken.value.trim();
    const status = token && (await tokenTest(token)) ? "succeeded" : "FAILED";

    alert(`Testing the token ${status}.`);
  }
}

customElements.define(NAME, AccessConfig, { extends: "dialog" });

const configManager = (function () {
  const CONFIG_KEY = "config";
  const listeners = [];

  const api = {
    onChange: (fn) => listeners.push(fn),
    getToken: () => api.read().token,
    setToken(token) {
      api.write({
        ...api.read(),
        token,
      });
    },
    read: () => JSON.parse(localStorage.getItem(CONFIG_KEY) ?? "{}"),
    write({ org, repos, token }) {
      localStorage.setItem(CONFIG_KEY, JSON.stringify({ org, repos, token }));
      listeners.forEach((fn) => fn({ org, repos, token }));
    },
  };

  return api;
})();

async function tokenTest(token) {
  const { status } = await githubSDKFactory(token, false)("octocat");

  return status >= 200 && status < 300;
}

export { configDialog, configManager };
