import { statusDialogEvent } from "../components/statusDialog.mjs";
import { githubSDKFactory } from "./gh.mjs";

const ONE_HOUR = 1000 * 60 * 60;
const ONE_DAY = ONE_HOUR * 24;
const CACHE_TIME = ONE_HOUR * 12;
const LOCAL_STORAGE_KEY = "cache";
const FOLLOW_HEADER_LINKS = true;
const STATUS_LABELS = ["open", "closed", "merged"];

const hasData = () => !!read()?.data;
const isFresh = () => hasData() && Date.now() - lastUpdated() < CACHE_TIME;
const lastUpdated = () => read()?.updated_at;
const login = ({ user }) => user.login;

const daysOpen = (a = 0, b = 0) => (a && b ? parseInt((new Date(b) - new Date(a)) / ONE_DAY, 10) : 0);
const publish = (uri) => statusDialogEvent(`<p>GitHub request for: ${uri}</p>`);
const status = (a, b) => STATUS_LABELS[!!a + !!b];

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

function read() {
  const cache = localStorage.getItem(LOCAL_STORAGE_KEY);

  return cache ? JSON.parse(cache) : null;
}

function write(updates, cached_at) {
  const data = updates.reduce((acc, pr) => {
    acc[pr.url] = pr;

    return acc;
  }, read()?.data ?? {});

  const updated_at = cached_at ?? Date.now();

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ data, updated_at }));

  return data;
}

export function prManagerFactory(org, repos, token) {
  const requestWithToken = githubSDKFactory(token);
  const resources = repos.map((repo) => `repos/${org}/${repo}/pulls`);

  // BEWARE! async recursion :) continuation passing style
  // recursively because spawning many 100s of fetch requests concurrently caused problems :(
  function getComments([head, ...rest], withComments = []) {
    // TODO: batch/pool more API requests - 5-10? - for more parallelized data retrieval
    if (!head) return withComments;

    const { review_comments_url, ...pr } = head;

    return requestWithToken(review_comments_url, null, publish)
      .then((comments = []) => ({
        ...pr,
        comment_count: comments.length,
        comments_from: Array.from(new Set(comments.map(login))).filter((name) => name !== pr.author),
      }))
      .catch((error) => ({ error, errored: true, ...pr }))
      .then((pr) => getComments(rest, withComments.concat(pr)));
  }

  async function updateRecentlyClosedPRs(all) {
    const { data } = read() ?? {};

    if (!data) return all;

    const currentlyOpen = all.map(({ url }) => url);
    const haveClosed = [
      data,
      Object.entries,
      (all) => all.filter(([_, { url, state }]) => /open/i.test(state) && !currentlyOpen.includes(url)),
      (open) => open.map(([url]) => url),
    ]
      .reduce((val, fn) => fn(val))
      .map((uri) => requestWithToken(uri, FOLLOW_HEADER_LINKS, publish));

    return all.concat(await Promise.all(haveClosed).then((closed) => closed.map(formatSimple)));
  }

  const api = {
    get() {
      if (Date.now() - lastUpdated() < CACHE_TIME) return;

      const state = hasData() ? "open" : "all";
      const urls = resources.map((uri) => `${uri}?per_page=100&state=${state}`);

      return (
        // make all API requests and follow all "next" (pagination) links in response headers
        Promise.all(
          urls.map((uri) => {
            publish(uri);

            return requestWithToken(uri, FOLLOW_HEADER_LINKS, publish);
          })
        )
          // simplify the data returned by the API
          .then((all) => all.flat().map(formatSimple))
          .then(updateRecentlyClosedPRs)
          // for each pull request get the comments;
          .then(getComments)
          // update localStorage data; not a complete overwrite
          .then(write)
      );
    },
    hasData,
    isFresh,
    lastUpdated,
    read,
    write,
  };

  return api;
}
