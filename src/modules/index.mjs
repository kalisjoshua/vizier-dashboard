import { cacheManager } from "./cacheManager.mjs";
import { configManager } from "./config.mjs";
import { createDeploysPlot } from "./deploy.mjs";
import { encryptedCopy } from "./encryptedCopyLink.mjs";
import { createOpenTimesPlot } from "./openTimes.mjs";
import { displayOverview } from "./overview.mjs";
import { prManager } from "./prManager.mjs";
import { addRatioCards } from "./ratios.mjs";
import { statusDialog } from "./statusDialog.mjs";

const show = (sel) => (inDOM(sel).style.visibility = "visible");

function render() {
  const { data } = cacheManager.read();

  addRatioCards(data);
  show("#copyData");

  createDeploysPlot(data);
  show("#deploys");

  createOpenTimesPlot(data);
  show("#openTimes");

  show(`#ratios`);
}

addEventListener("DOMContentLoaded", function appInit() {
  configManager.sub(configManager.events.VALID, () => {
    const { encryptionKey, org, token, ...reposConfig } = configManager.read();

    displayOverview(org, reposConfig);
  });

  cacheManager.sub(cacheManager.events.UPDATED, render);
  cacheManager.sub(configManager.events.VALID, "onValidConfig");
  cacheManager.sub(prManager.events.UPDATED, "onUpdated");

  prManager.sub(configManager.events.VALID, "onInit");
  prManager.sub(cacheManager.events.EXPIRED, "onExpired");

  statusDialog.sub(prManager.events.REQUEST, "handleEvents");
  statusDialog.sub(encryptedCopy.events.ENCRYPT, "handleEvents");
  Object.values(cacheManager.events).forEach((event) => statusDialog.sub(event, "handleEvents"));

  configManager.init(); // this needs to be last to kick everything off
});
