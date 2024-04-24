import { cacheManager } from "./cacheManager.mjs";
import { StatusDialog } from "../components/StatusDialog.mjs";
import { configManager } from "./configManager.mjs";
import { createDeploysPlot } from "./deploy.mjs";
import { encryptedCopy } from "./encryptedCopyLink.mjs";
import { createOpenTimesPlot } from "./openTimes.mjs";
import { displayOverview } from "./overview.mjs";
import { prManager } from "./prManager.mjs";
import { addRatioCards } from "./ratios.mjs";

const setVisible = (sel) => (inDOM(sel).style.visibility = "visible");

export function init(config = {}) {
  addEventListener("DOMContentLoaded", function appInit() {
    configManager.sub(configManager.events.VALID, () => {
      const { encryptionKey, org, token, ...reposConfig } = configManager.read();

      displayOverview(org, reposConfig);
    });

    cacheManager.sub(cacheManager.events.UPDATED, () => render(config.excludedContributors));
    cacheManager.sub(configManager.events.VALID, "onValidConfig");
    cacheManager.sub(prManager.events.UPDATED, "onUpdated");

    prManager.sub(configManager.events.VALID, "onInit");
    prManager.sub(cacheManager.events.EXPIRED, "onExpired");

    StatusDialog.listenFor(
      // forced formatting
      prManager.events.REQUEST,
      encryptedCopy.events.ENCRYPT,
      ...Object.values(cacheManager.events)
    );

    configManager.init(); // this needs to be last to kick everything off
  });
}

function render(excludedContributors = []) {
  const { data } = cacheManager.read();

  addRatioCards(data, excludedContributors);
  setVisible("#copyData");

  createDeploysPlot(data);
  setVisible("#deploys");

  createOpenTimesPlot(data);
  setVisible("#openTimes");

  setVisible(`#ratios`);
}
