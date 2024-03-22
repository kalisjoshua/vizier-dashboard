import { debounce } from "../lib/debounce.mjs";
import { githubSDKFactory } from "../lib/gh.mjs";
import { configManager } from "../lib/configManager.mjs";

const NAME = "cc-config-editor";

export class ConfigEditor extends HTMLDetailsElement {
  #buttonCopy;
  #buttonSave;
  #buttonTest;
  #configJSON;
  #configString;
  #errors;
  #invalid;
  static #listeners = [];
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

    const debounced = debounce(this.#updateConfigString);

    this.#withCleanup(this.#configJSON, "blur", debounced);
    this.#withCleanup(this.#configJSON, "change", debounced);
    this.#withCleanup(this.#configJSON, "keyup", debounced, 500);
    this.#withCleanup(this.#configString, "change", this.#handle1PasswordImport);
    this.#withCleanup(this.#buttonCopy, "click", this.#handleCopy);
    this.#withCleanup(this.#buttonSave, "click", this.#handleSave);
    this.#withCleanup(this.#buttonTest, "click", this.#handleTest);

    this.#loadLocalState();
    this.#setValid(true, true);
  }

  disconnectedCallback() {
    this.#needingCleanup.forEach(([el, event, fn]) => el.removeEventListener(event, fn));
  }

  #handle1PasswordImport() {
    this.#configJSON.value = JSON.stringify(JSON.parse(this.#configString.value.trim()), null, 2);

    this.#isValid();
  }

  async #handleCopy() {
    // NOTE: no need to try/catch because there is no mitigation if it does fail
    await navigator.clipboard.writeText(this.#configString.value.trim());
  }

  async #handleSave(event) {
    event.preventDefault();

    const token = this.#token.value.trim();

    // TODO: maybe? switch from alert to custom dialog
    if (!(await ConfigEditor.#tokenTest(token))) alert("The token provided is not valid.");
    // if (!this.#isValid()) // this isn't possible because the button is disabled when invalid
    else if (this.#isValid()) {
      configManager.write({
        token: this.#token.value.trim(),
        ...JSON.parse(this.#configString.value),
      });

      ConfigEditor.#listeners.forEach((fn) => fn(configManager.read()));
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

    const expectedProps = ["sonar"];
    const missing = [];

    let isValid = !!this.#token.value;
    let parsed;

    try {
      parsed = JSON.parse(this.#configJSON.value);
    } catch (e) {
      isValid = false;
    }

    if (parsed) {
      const { encryptionKey, org, ...repos } = parsed;

      if (!encryptionKey) missing.push("encryptionKey");
      if (!org) missing.push("org");

      // NOTE: need to go over all repos so that each gets validated and none are skipped because prior repos are invalid
      Object.entries(repos).forEach(([name, repo]) => {
        expectedProps.every((prop) => {
          if (!Object.keys(repo).includes(prop)) {
            missing.push(`${name}.${prop}`);
          }
        });
      });

      if (!Object.values(repos).length) this.#errors.innerHTML += `<p>No repos defined.</p>`;

      isValid &&= !!Object.values(repos).length && !missing.length;
    }

    missing.forEach((name) => {
      this.#errors.innerHTML += `<p>Missing the "${name}" property.</p>`;
    });

    this.#setValid(isValid);

    return isValid;
  }

  #loadLocalState() {
    const { token, ...config } = configManager.read();

    this.#token.value = token;
    this.#configJSON.value = JSON.stringify(config, null, 2);
    this.#updateConfigString();
  }

  static onUpdate(fn) {
    this.#listeners.push(fn);
  }

  // NOTE: intentionally not giving second arg a default value to take advantage of nullish coalescing
  #setValid(isValid = false, disabled) {
    this.#buttonCopy.disabled = disabled ?? !isValid;
    this.#buttonSave.disabled = disabled ?? !isValid;
    this.#invalid.style.visibility = isValid ? "hidden" : "visible";
  }

  static async #tokenTest(token) {
    const { status } = await githubSDKFactory(token, false)("octocat");

    return status >= 200 && status < 300;
  }

  #updateConfigString() {
    if (this.#isValid()) {
      this.#configString.value = JSON.stringify(JSON.parse(this.#configJSON.value.trim()));
    }
  }

  #withCleanup(el, event, method) {
    const fn = method.bind(this);

    el.addEventListener(event, fn);

    this.#needingCleanup.push([el, event, fn]);
  }
}

customElements.define(NAME, ConfigEditor, { extends: "details" });
