import { cacheManager, ONE_DAY } from "./cacheManager.mjs";
import { fetchWithToken } from "./fetchWithToken.mjs";
import { pubsubFactory } from "./pubsub.mjs";

const FOLLOW_HEADER_LINKS = true;

const daysOpen = (a = 0, b = 0) => (a && b ? parseInt((new Date(b) - new Date(a)) / ONE_DAY, 10) : 0);
const login = ({ user }) => user.login;
const status = (a, b) => ["open", "closed", "merged"][!!a + !!b];

const events = {
  INITIALIZED: "EVENT_PR_MANAGER_INITIALIZED",
  REQUEST: "EVENT_PR_MANAGER_REQUEST",
  SOURCE: "EVENT_CACHE_MANAGER_SOURCE", // GitHub API
  UPDATED: "EVENT_PR_MANAGER_UPDATED",
};

function formatSimple({ closed_at, created_at, merged_at, review_comments_url, url, user }) {
  return {
    author: user.login,
    closed_at,
    days_open: daysOpen(created_at, closed_at),
    review_comments_url,
    state: status(closed_at, merged_at), // closed=false and merged=true; not possible
    url,
  };
}

export const prManager = pubsubFactory("prManager", {
  events,

  async get(state = "open") {
    const urls = prManager.resources.map((uri) => `${uri}?per_page=100&state=${state}`);

    return await Promise
      // make all API requests and follow all "next" (pagination) links in response headers
      .all(urls.map((uri) => prManager.request(uri, FOLLOW_HEADER_LINKS)))
      // simplify the data returned by the API
      .then((all) => all.flat().map(formatSimple))
      .then(prManager.updateRecentlyClosedPRs.bind(prManager))
      // for each pull request get the comments;
      .then(prManager.getComments.bind(prManager));
  },

  // BEWARE! async recursion :) continuation passing style
  // recursive because spawning many 100s of fetch requests concurrently caused problems :(
  getComments([head, ...rest], withComments = []) {
    // TODO: batch/pool more API requests - 5-10? - for more parallelized data retrieval
    if (!head) return withComments;

    const { review_comments_url, ...pr } = head;

    return prManager
      .request(review_comments_url, null) // FIXME: should this be `null`?
      .then((comments = []) => ({
        ...pr,
        comment_count: comments.length,
        comments_from: Array.from(new Set(comments.map(login))).filter((name) => name !== pr.author),
      }))
      .catch((error) => ({ error, errored: true, ...pr }))
      .then((pr) => prManager.getComments(rest, withComments.concat(pr)));
  },

  async onExpired({ state }) {
    let data;
    let title = "Remote Data";

    if (cacheManager.hasData()) {
      prManager.pub(events.SOURCE, { level: "info", message: "Updating open PRs and recently closed.", title });
    } else {
      prManager.pub(events.SOURCE, { level: "info", message: "Fetching all PRs from the GitHub API...", title });
      prManager.pub(events.SOURCE, { level: "info", message: "This will take a long time..." });
      prManager.pub(events.SOURCE, { level: "info", message: "Seriously..." });
      prManager.pub(events.SOURCE, { level: "info", message: "a..." });
      prManager.pub(events.SOURCE, { level: "info", message: "long..." });
      prManager.pub(events.SOURCE, { level: "info", message: "time." });
    }

    try {
      data = await prManager.get(state);
    } catch (e) {
      prManager.pub(events.UPDATED, { level: "error", message: "Failed to update local data from API." });

      throw e;
    }

    prManager.pub(events.UPDATED, { level: "info", data });
  },

  onInit({ encryptionKey, org, token, ...reposConfig }) {
    const REL_NEXT = /<([^>,]+?)>;\s*rel="next"/;

    Object.assign(prManager, {
      request: async (uri, followNext = false) => {
        // TODO: add client-side throttling to prevent server-side throttling

        prManager.pub("REQUEST", { level: "info", message: `Fetching ${uri.replace(/.*?repos\//, "")}` });

        return await fetchWithToken(token, uri)
          .then(async (response) => {
            const next = followNext && response.headers.get("link")?.match(REL_NEXT)?.at(1);
            const result = await response.json();

            // BEWARE! async recursion :)
            return !next ? [result] : [result, await prManager.request(next, followNext)].flat();
          })
          .then((pending) => Promise.all(pending))
          .then((data) => data.flat())
          .then((result) => (result.length === 1 ? result[0] : result));
      },

      resources: Object.keys(reposConfig).map((repo) => `repos/${org}/${repo}/pulls`),
    });

    prManager.pub("INITIALIZED");
  },

  async updateRecentlyClosedPRs(all) {
    const { data } = cacheManager.read() ?? {}; // FIXME: remove dependency on cacheManager

    if (!data) return all;

    const currentlyOpen = all.map(({ url }) => url);
    const haveClosed = [
      Object.entries(data),
      (all) => all.filter(([_, { url, state }]) => /open/i.test(state) && !currentlyOpen.includes(url)),
      (open) => open.map(([url]) => url),
    ]
      .reduce((val, fn) => fn(val))
      .map((uri) => prManager.request(uri, FOLLOW_HEADER_LINKS));

    return all.concat(await Promise.all(haveClosed).then((closed) => closed.map(formatSimple)));
  },
});
