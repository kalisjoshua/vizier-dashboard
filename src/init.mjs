import { ConfigEditor } from "./components/configEditor.mjs";
import { getCopyLink } from "./components/encryptedCopyLink.mjs";
import { Overview } from "./components/projectOverview.mjs";
import { displayRatios } from "./components/ratios.mjs";
import { StatusDialog } from "./components/statusDialog.mjs";
import { configManager } from "./lib/configManager.mjs";
import { decrypt } from "./lib/crypto.mjs";
import { displayOpenTimes } from "./lib/open.mjs";
import { prManagerFactory } from "./lib/prManager.mjs";

// TODO: add app-version vector to the config to verify needing to invalidate local cache of data/credentials

function appInit() {
  const token = configManager.getToken();

  if (token) {
    runAnalysis(configManager.read());
  }

  ConfigEditor.onUpdate(runAnalysis);
}

async function fetchServerCache(pulls, encryptionKey) {
  const { data, updated_at } = (await fetch("data.json").then((r) => r.json())) ?? {};

  if (data?.length) {
    StatusDialog.setMessage("Decrypting each record will take a little time so please be patient.");
    StatusDialog.setTitle("Fetching server cache");
    StatusDialog.appendTo(document.body);

    StatusDialog.dispatchEvent(`<p>${data.length} PR records retrieved from server cache.</p>`);
    StatusDialog.dispatchEvent(`<p>Beginning decryption of server cached PR data.</p>`);

    await [
      Promise.resolve(data),
      (all) =>
        all.map(async (pr, index, { length }) => {
          StatusDialog.dispatchEvent(`<p>Decrypting data for PR ${index} of ${length}.</p>`);

          // decrypt all of the pr records
          return JSON.parse(await decrypt(pr, encryptionKey));
        }),
      (pending) => Promise.all(pending),
      // write decrypted data to localStorage
      (resolved) => pulls.write(resolved, updated_at),
    ].reduce(async (input, fn) => fn(await input));
  } else {
    StatusDialog.setMessage("Fetching all data will take a long time... seriously... a long time.");
    StatusDialog.setTitle("Fetching source data");
    StatusDialog.appendTo(document.body);

    StatusDialog.dispatchEvent("<p>No data from server. Fetching from source.</p>");

    await pulls.get();
  }

  StatusDialog.getDialog().setComplete("<p>All data updated.</p>");
}

async function runAnalysis({ encryptionKey, org, token, ...reposConfig }) {
  const repos = Object.keys(reposConfig);
  const pulls = prManagerFactory(org, repos, token);

  const [configPanel, ...otherPanels] = inDOM("details");
  configPanel.removeAttribute("open");
  otherPanels.forEach((panel) => (panel.style.visibility = "visible"));

  if (!pulls.hasData()) await fetchServerCache(pulls, encryptionKey);

  const { data } = pulls.read();

  displayRatios(data);
  displayOpenTimes(data);
  Overview.render(org, reposConfig);

  getCopyLink().initialize(configManager, pulls);

  inDOM("main").style.visibility = "visible";
  Overview.showPanelContents();
}

addEventListener("DOMContentLoaded", appInit);
