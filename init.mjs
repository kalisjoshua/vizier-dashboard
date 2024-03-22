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

function decryptServerCache(key, list) {
  StatusDialog.dispatchEvent(`<p>${list.length} PR records retrieved from server cache.</p>`);
  StatusDialog.dispatchEvent(`<p>Beginning decryption of server cached PR data.</p>`);

  return list.map(async (pr, index) => {
    StatusDialog.dispatchEvent(`<p>Decrypting data for PR ${index} of ${list.length}.</p>`);

    const result = JSON.parse(await decrypt(pr, key));

    return result;
  });
}

async function fetchServerCache(pulls, encryptionKey) {
  const { data, updated_at } = (await fetch("data.json").then((r) => r.json())) ?? {};

  if (data) {
    StatusDialog.setMessage("Decrypting each record will take a little time so please be patient.");
    StatusDialog.setTitle("Fetching server cache");
    StatusDialog.appendTo(document.body);

    // decrypt all of the pr records and write them to localStorage
    pulls.write(await Promise.all(decryptServerCache(encryptionKey, data), updated_at));
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

  if (!pulls.hasData()) {
    fetchServerCache(pulls, encryptionKey);
  }

  const { data } = pulls.read();

  displayRatios(data);
  displayOpenTimes(data);
  Overview.render(org, reposConfig);

  inDOM("main").style.visibility = "visible";
  Overview.showPanelContents();

  getCopyLink().initialize(configManager, pulls);
}

addEventListener("DOMContentLoaded", appInit);
