import { debounce } from "../utilities/debounce.mjs";
import { fetchWithToken } from "../utilities/fetchWithToken.mjs";

export class ConfigEditor extends HTMLDetailsElement {
  #buttonCopy;
  #buttonSave;
  #buttonTest;
  #configJSON;
  #configManager;
  #configString;
  static ELEMENT_NAME = "cc-config-editor";
  #errors;
  #invalid;
  #needingCleanup = [];
  #token;

  async connectedCallback() {
    this.#configManager = (await import("../modules/configManager.mjs"))?.configManager;

    this.#buttonCopy = inDOM(`[is="${ConfigEditor.ELEMENT_NAME}"] button[data-type="copy"]`);
    this.#buttonTest = inDOM(`[is="${ConfigEditor.ELEMENT_NAME}"] button[data-type="test"]`);
    this.#buttonSave = inDOM(`[is="${ConfigEditor.ELEMENT_NAME}"] button[type="submit"]`);
    this.#configJSON = inDOM(`[is="${ConfigEditor.ELEMENT_NAME}"] #config-json`);
    this.#configString = inDOM(`[is="${ConfigEditor.ELEMENT_NAME}"] #config-string`);
    this.#errors = inDOM(`[is="${ConfigEditor.ELEMENT_NAME}"] #formatting-errors`);
    this.#invalid = inDOM(`[is="${ConfigEditor.ELEMENT_NAME}"] #error-invalidJSON`);
    this.#token = inDOM(`[is="${ConfigEditor.ELEMENT_NAME}"] #token`);

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
      this.#configManager.write({
        token: this.#token.value.trim(),
        ...JSON.parse(this.#configString.value),
      });

      this.#configManager.pub(this.#configManager.events.VALID, this.#configManager.read());

      inDOM(`[is="${ConfigEditor.ELEMENT_NAME}"]`).removeAttribute("open");
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
      errors = this.#configManager.getValidations({
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
    const { token, ...config } = this.#configManager.read();

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

customElements.define(ConfigEditor.ELEMENT_NAME, ConfigEditor, { extends: "details" });
