import { configDialog, configManager } from "./components/config.mjs";
import { EventLogger } from "./components/eventLogger.mjs";
import { getOverlay } from "./components/projectOverlay.mjs";
import { displayRatios } from "./components/ratios.mjs";
import { EVENT_NAME } from "./lib/gh.mjs";
import { displayOpenTimes } from "./lib/open.mjs";
import { prManagerFactory } from "./lib/prManager.mjs";

function appInit() {
  const token = configManager.getToken();

  if (token) {
    runAnalysis(configManager.read());
  } else {
    configDialog.showModal();
  }

  configManager.onChange(runAnalysis);
}

// TODO: cache the calculated graph data so that page refresh is quicker with cached data

async function runAnalysis({ org, repos, token }) {
  const pulls = prManagerFactory(token, org, repos);
  const pending = pulls.get();

  if (pending) {
    document.body.appendChild(EventLogger.create(EVENT_NAME, pulls));

    await pending;

    inDOM(`dialog[data-event]`).setComplete("All data updated");
  }

  displayRatios(pulls.read().data);
  displayOpenTimes(pulls.read().data);

  console.log(configManager.read());
  // getOverlay().innerHTML = "Hello";

  inDOM("main").style.display = "block";
}

addEventListener("DOMContentLoaded", appInit);
