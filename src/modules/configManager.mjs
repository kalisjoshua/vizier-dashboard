import { ConfigEditor } from "../components/ConfigEditor.mjs";
import { addPubSub } from "../utilities/pubsub.mjs";

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
    const el = inDOM(`[is="${ConfigEditor.ELEMENT_NAME}"]`);

    el.style.visibility = "visible";

    if (this.isValid()) {
      el.removeAttribute("open");

      // FIXME: there is probably a better way to go about this using `attributeChangedCallback`
      // populate the field for copy-ing
      inDOM(`[is="${ConfigEditor.ELEMENT_NAME}"] #config-string`).value = JSON.stringify(configManager.read());
      inDOM(`[is="${ConfigEditor.ELEMENT_NAME}"] button[data-type="copy"]`).disabled = false;

      this.pub("VALID", configManager.read());
    }
  },

  isValid(config = this.read()) {
    return !this.getValidations(config).length;
  },

  read: () => JSON.parse(localStorage.getItem(STORE_KEY) ?? "{}"),

  write: (config) => localStorage.setItem(STORE_KEY, JSON.stringify(config)),
});
