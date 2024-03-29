import { cacheManager } from "./cacheManager.mjs";
import { configManager } from "./config.mjs";
import { pubsubFactory } from "./pubsub.mjs";
import { encrypt } from "./crypto.mjs";

const NAME = "cc-encrypted-copy-link";

export const encryptedCopy = pubsubFactory("encryptedCopy", {
  events: {
    ENCRYPT: "EVENT_ENCRYPTED_COPY_EVENT",
  },
  async click() {
    const { data, updated_at } = cacheManager.read();
    const { encryptionKey } = configManager.read();

    const title = "Building cache object";
    const message = "Encrypting each record will take a little time so please be patient.";

    encryptedCopy.pub("ENCRYPT", { level: "info", message, title });

    const text = await [
      Promise.resolve(Object.values(data)),
      (all) =>
        all.map((pr, index, { length }) => {
          encryptedCopy.pub("ENCRYPT", {
            level: "info",
            message: `<p>Encrypting data for PR ${index} of ${length}.</p>`,
          });

          return encrypt(JSON.stringify(pr), encryptionKey);
        }),
      (pending) => Promise.all(pending),
      (data) => JSON.stringify({ data, updated_at }),
    ].reduce(async (input, fn) => fn(await input));

    encryptedCopy.pub("ENCRYPT", {
      level: "info",
      message: "<p>Encryption complete.</p>",
    });
    encryptedCopy.pub("ENCRYPT", {
      level: "info",
      message: "<p>Please wait for data to be copied to the system clipboard.</p>",
    });

    try {
      await navigator.clipboard.writeText(text);

      encryptedCopy.pub("ENCRYPT", {
        level: "complete",
        message: "<p>All data available in system clipboard.</p>",
      });
    } catch (error) {
      if (/Document is not focused/i.test(error.message)) {
        encryptedCopy.pub("ENCRYPT", {
          level: "complete",
          message: "<p>You got distracted, and went to do other things, didn't you? :)</p>",
        });
      } else {
        console.error(error.message);
        encryptedCopy.pub("ENCRYPT", {
          level: "complete",
          message: "<p>An error occurred during encryption.</p>",
        });
      }
    }
  },
});

class EncryptedCopyLink extends HTMLButtonElement {
  connectedCallback() {
    this.addEventListener("click", encryptedCopy.click);
  }

  disconnectedCallback() {
    this.addEventListener("click", encryptedCopy.click);
  }
}

customElements.define(NAME, EncryptedCopyLink, { extends: "button" });
