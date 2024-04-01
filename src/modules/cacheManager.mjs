import { decrypt } from "./crypto.mjs";
import { pubsubFactory } from "./pubsub.mjs";

const ONE_HOUR = 1000 * 60 * 60;

export const ONE_DAY = ONE_HOUR * 24;
export const CACHE_TIME = ONE_HOUR * 1;

const STORE_KEY = "cache";

const hasData = () => !!read()?.data;
const isFresh = () => hasData() && Date.now() - lastUpdated() < CACHE_TIME;
const lastUpdated = () => read()?.updated_at;

const events = {
  DECRYPT: "EVENT_CACHE_MANAGER_DECRYPT", // decrypt server cached data
  EXPIRED: "EVENT_CACHE_MANAGER_EXPIRED", // the cached data has expired/gone stale
  HISTORY: "EVENT_CACHE_MANAGER_HISTORY", // server cache
  STATUS: "EVENT_CACHE_MANAGER_STATUS", //
  UPDATED: "EVENT_CACHE_MANAGER_UPDATED", // localStorage updated
};

async function decryptServerCache(encryptionKey, data) {
  cacheManager.pub(events.DECRYPT, {
    level: "info",
    message: "<p>Decrypting each record will take a little time so please be patient.</p>",
  });

  cacheManager.pub(events.DECRYPT, {
    level: "info",
    message: `<p>Beginning decryption of ${data.length} PR records retrieved from server cache.</p>`,
  });

  return await Promise.all(
    data.map(async (pr, index, { length }) => {
      cacheManager.pub(events.DECRYPT, {
        level: "info",
        message: `<p>Decrypting data for PR ${index} of ${length}.</p>`,
      });

      // decrypt all of the pr records
      return JSON.parse(await decrypt(pr, encryptionKey));
    })
  );
}

function read() {
  const cache = localStorage.getItem(STORE_KEY);

  return cache ? JSON.parse(cache) : null;
}

function write(updates, cached_at = Date.now() - CACHE_TIME * 2) {
  const data = updates.reduce((acc, pr) => {
    acc[pr.url] = pr;

    return acc;
  }, read()?.data ?? {});

  const updated_at = cached_at ?? Date.now();

  localStorage.setItem(STORE_KEY, JSON.stringify({ data, updated_at }));

  return data;
}

export const cacheManager = pubsubFactory("cacheManager", {
  events,
  hasData,
  isFresh,
  lastUpdated,

  onUpdated({ data }) {
    if (data) {
      write(data, Date.now());
    }

    cacheManager.pub(events.UPDATED, {
      level: "complete",
      message: "Data up to data.",
      // title, // include to show dialog even if everything is up to date; disable to skip a dialog when up to date
    });
  },

  async onValidConfig({ encryptionKey }) {
    const title = "Local Data";

    if (!cacheManager.hasData()) {
      let decrypted;
      let serverCache;

      cacheManager.pub(events.HISTORY, { level: "info", message: "Fetching server cache.", title });
      try {
        serverCache = await fetch("data.json").then((r) => r.json());

        cacheManager.pub(events.HISTORY, { level: "info", message: "Successfully received server cache." });
      } catch (e) {
        cacheManager.pub(events.HISTORY, { level: "error", message: "Failed to fetch server cache." });
      }

      if (serverCache) {
        cacheManager.pub(events.HISTORY, { level: "info", message: "Decrypting server cache." });
        try {
          decrypted = await decryptServerCache(encryptionKey, serverCache.data);

          cacheManager.pub(events.HISTORY, { level: "info", message: "Successfully decrypted server cache." });
        } catch (e) {
          cacheManager.pub(events.DECRYPT, { level: "error", message: "Failed to completely decrypt server cache." });
        }
      }

      if (decrypted) {
        write(decrypted, serverCache.updated_at);

        cacheManager.pub(events.HISTORY, { level: "info", message: "Decrypted data stored in localStorage." });
      }
    }

    if (isFresh()) {
      cacheManager.pub(events.UPDATED, { level: "complete", message: "Data up to data." });
    } else {
      cacheManager.pub(events.EXPIRED, {
        level: "info",
        message: "Local data is stale and needs to be updated.",
        state: hasData() ? "open" : "all",
        title,
      });
    }
  },

  read,
  write,
});
