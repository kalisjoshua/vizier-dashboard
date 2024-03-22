import { StatusDialog } from "./statusDialog.mjs";
import { encrypt } from "../lib/crypto.mjs";

const NAME = "cc-encrypted-copy-link";

export const getCopyLink = () => inDOM(`[is="${NAME}"]`);

async function click({ key }, pulls) {
  StatusDialog.setMessage("Encrypting each record will take a little time so please be patient.");
  StatusDialog.setTitle("Building cache object");
  StatusDialog.appendTo(document.body);

  const text = await [
    Promise.resolve(Object.values(pulls.data)),
    (all) =>
      all.map((pr, index, { length }) => {
        StatusDialog.dispatchEvent(`<p>Encrypting data for PR ${index} of ${length}.</p>`);

        return encrypt(JSON.stringify(pr), key);
      }),
    (pending) => Promise.all(pending),
    (data) => JSON.stringify({ data, updated_at: Date.now() }),
  ].reduce(async (input, fn) => fn(await input));

  StatusDialog.dispatchEvent("<p>Encryption complete.</p>");

  try {
    await navigator.clipboard.writeText(text);

    StatusDialog.getDialog().setComplete("<p>All data available in system clipboard.</p>");
  } catch (error) {
    if (error.message === "Failed to execute 'writeText' on 'Clipboard': Document is not focused.") {
      StatusDialog.getDialog().setComplete(
        "<p>If the document doesn't have focus when attempting to add content to the clipboard it will fail.</p>"
      );
    } else {
      console.error(error.message);
      StatusDialog.getDialog().setComplete("<p>An error occurred during encryption.</p>");
    }
  }
}

class EncryptedCopyLink extends HTMLButtonElement {
  #config;
  #pulls;

  constructor() {
    super();

    this.addEventListener("click", () => click(this.#config.read(), this.#pulls.read()));
  }

  initialize(config, pulls) {
    if (!this.config) {
      this.#config = config;
      this.#pulls = pulls;
    }
  }
}

customElements.define(NAME, EncryptedCopyLink, { extends: "button" });
