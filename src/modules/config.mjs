import { debounce } from "./debounce.mjs";
import { fetchWithToken } from "./fetchWithToken.mjs";
import { addPubSub } from "./pubsub.mjs";

const NAME = "cc-config-editor";
const STORE_KEY = "config";

export const configManager = addPubSub("config", {
  events: { VALID: "CONFIG_EVENT_VALID" },

  getValidations(config = this.read()) {
    const missing = [];
    const missingProp = (name) => missing.push(`Missing "${name}" property.`);

    const { encryptionKey, org, token, ...reposConfig } = config;

    ["encryptionKey", "org", "token"].forEach((prop) => {
      if (!config[prop]) missingProp(prop);
    });

    if (!Object.keys(reposConfig).length) {
      missing.push(`No repositories defined.`);
    } else {
      const expectedProps = ["sonar"];

      Object.entries(reposConfig).forEach(([name, repo]) => {
        const props = Object.keys(repo);

        expectedProps.forEach((expected) => {
          if (!props.includes(expected)) {
            missingProp(`${name}.${expected}`);
          }
        });
      });
    }

    return missing;
  },

  init() {
    const el = inDOM(`[is="${NAME}"]`);

    el.style.visibility = "visible";

    if (this.isValid()) {
      el.removeAttribute("open");

      // FIXME: there is probably a better way to go about this using `attributeChangedCallback`
      // populate the field for copy-ing
      inDOM(`[is="${NAME}"] #config-string`).value = JSON.stringify(configManager.read());
      inDOM(`[is="${NAME}"] button[data-type="copy"]`).disabled = false;

      this.pub("VALID", configManager.read());
    }
  },

  isValid(config = this.read()) {
    return !this.getValidations(config).length;
  },

  read: () => JSON.parse(localStorage.getItem(STORE_KEY) ?? "{}"),

  write: (config) => localStorage.setItem(STORE_KEY, JSON.stringify(config)),
});

class ConfigEditor extends HTMLDetailsElement {
  #buttonCopy;
  #buttonSave;
  #buttonTest;
  #configJSON;
  #configString;
  #errors;
  #invalid;
  #needingCleanup = [];
  #token;

  connectedCallback() {
    this.#buttonCopy = inDOM(`[is="${NAME}"] button[data-type="copy"]`);
    this.#buttonTest = inDOM(`[is="${NAME}"] button[data-type="test"]`);
    this.#buttonSave = inDOM(`[is="${NAME}"] button[type="submit"]`);
    this.#configJSON = inDOM(`[is="${NAME}"] #config-json`);
    this.#configString = inDOM(`[is="${NAME}"] #config-string`);
    this.#errors = inDOM(`[is="${NAME}"] #formatting-errors`);
    this.#invalid = inDOM(`[is="${NAME}"] #error-invalidJSON`);
    this.#token = inDOM(`[is="${NAME}"] #token`);

    this.#withCleanup(this.#buttonCopy, "click", this.#handleClipboard);
    this.#withCleanup(this.#buttonSave, "click", this.#handleSave);
    this.#withCleanup(this.#buttonTest, "click", this.#handleTest);
    this.#withCleanup(
      this.#configJSON,
      ["blur", "change", "keyup"],
      debounce(() => {
        if (this.#isValid()) {
          this.#configString.value = JSON.stringify(JSON.parse(this.#configJSON.value));
        }
      }, 500)
    );
    this.#withCleanup(this.#configString, "change", this.#handleAutofill);

    this.#loadLocalState();
    this.#setValid(true, true);
  }

  disconnectedCallback() {
    this.#needingCleanup.forEach(([el, event, fn]) => el.removeEventListener(event, fn));
  }

  #handleAutofill() {
    this.#configJSON.value = JSON.stringify(JSON.parse(this.#configString.value.trim()), null, 2);

    this.#isValid();
  }

  async #handleClipboard() {
    // NOTE: no need to try/catch because there is no mitigation if it does fail
    await navigator.clipboard.writeText(this.#configString.value.trim());
  }

  async #handleSave(event) {
    event.preventDefault();

    const token = this.#token.value.trim();

    if (!(await ConfigEditor.#tokenTest(token))) {
      // TODO: maybe? switch from alert to custom dialog
      alert("The token provided is not valid.");
    }
    // if (!this.#isValid()) // this isn't possible because the button is disabled when invalid
    else if (this.#isValid()) {
      configManager.write({
        token: this.#token.value.trim(),
        ...JSON.parse(this.#configString.value),
      });

      configManager.pub(configManager.events.VALID, configManager.read());

      inDOM(`[is="${NAME}"]`).removeAttribute("open");
    }
  }

  async #handleTest(event) {
    event.preventDefault();

    const token = this.#token.value.trim();

    if (token) {
      const status = token && (await ConfigEditor.#tokenTest(token)) ? "succeeded" : "FAILED";

      // TODO: maybe? switch from alert to custom dialog
      alert(`Testing the token ${status}.`);
    }
  }

  #isValid() {
    this.#errors.innerHTML = "";

    let errors = [];
    let parsed;

    try {
      parsed = JSON.parse(this.#configJSON.value);
    } catch (e) {
      errors.push(`Invalid JSON input.`);
    }

    if (parsed) {
      errors = configManager.getValidations({
        ...parsed,
        token: this.#token.value.trim(),
      });
    }

    if (errors.length) {
      this.#errors.innerHTML = errors.map((str) => `<p>${str}</p>`).join("\n");
    }

    this.#setValid(!errors.length);

    return !errors.length;
  }

  #loadLocalState() {
    const { token, ...config } = configManager.read();

    this.#token.value = token;
    this.#configJSON.value = JSON.stringify(config, null, 2);
  }

  // NOTE: intentionally not giving second arg a default value to take advantage of nullish coalescing
  #setValid(isValid = false, disabled) {
    this.#buttonCopy.disabled = disabled ?? !isValid;
    this.#buttonSave.disabled = disabled ?? !isValid;
    this.#invalid.style.visibility = isValid ? "hidden" : "visible";
  }

  static async #tokenTest(token) {
    const { status } = await fetchWithToken(token, "octocat");

    return status >= 200 && status < 300;
  }

  #withCleanup(el, event, method) {
    const fn = method.bind(this);

    (event.map ? event : [event]).forEach((event) => {
      el.addEventListener(event, fn);

      this.#needingCleanup.push([el, event, fn]);
    });
  }
}

customElements.define(NAME, ConfigEditor, { extends: "details" });
