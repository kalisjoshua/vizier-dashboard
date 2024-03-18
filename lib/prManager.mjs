import { githubSDKFactory } from "./gh.mjs";

const ONE_HOUR = 1000 * 60 * 60;
const ONE_DAY = ONE_HOUR * 24;
const CACHE_TIME = ONE_HOUR * 12;
const LOCAL_STORAGE_KEY = "cache";
const FOLLOW_HEADER_LINKS = true;
const STATUS_LABELS = ["open", "closed", "merged"];

const obscure = {};

const hasData = () => !!read()?.data;
const lastUpdated = () => read()?.updated_at;
const login = ({ user }) => user.login;

const daysOpen = (a = 0, b = 0) => (a && b ? parseInt((new Date(b) - new Date(a)) / ONE_DAY, 10) : 0);
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

function obscureFactory(org, repos) {
  const PROP = "url";
  const ROOT = "https://api.github.com/repos/";
  const rPARTS = /repos\/[^/]+\/([^/]+)\/pulls\/(\d+)/;
  const SEP = "/";

  const tok = (repo, num) => `${repos.indexOf(repo)}${SEP}${num}`;
  const url = (repo, pull) => `${ROOT}${org}/${repos[repo]}/pulls/${pull}`;

  return {
    read: (key, val) => (key !== PROP ? val : url(...val.split(SEP))),
    write: (key, val) => (key !== PROP ? val : tok(...val.match(rPARTS).slice(1))),
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

  // this value is "safe" to store on the server because the "sensitive" information is obscured
  localStorage.setItem("cache-safe", JSON.stringify({ data: Object.values(data), updated_at }, obscure.write));

  return data;
}

export function prManagerFactory(token, org, list) {
  const requestWithToken = githubSDKFactory(token);
  const repos = list.map((repo) => `repos/${org}/${repo}/pulls`);

  Object.assign(obscure, obscureFactory(org, list));

  function get() {
    if (Date.now() - lastUpdated() < CACHE_TIME) return;

    const state = hasData() ? "open" : "all";
    const uris = repos.map((uri) => `${uri}?per_page=100&state=${state}`);

    return (
      // make all API requests and follow all "next" (pagination) links in response headers
      Promise.all(uris.map((uri) => requestWithToken(uri, FOLLOW_HEADER_LINKS)))
        // simplify the data returned by the API
        .then((all) => all.flat().map(formatSimple))
        .then(updateRecentlyClosedPRs)
        // for each pull request get the comments;
        .then(getComments)
        // update localStorage data; not a complete overwrite
        .then(write)
    );
  }

  // BEWARE! async recursion :) continuation passing style
  // recursively because spawning many 100s of fetch requests concurrently caused problems :(
  function getComments([head, ...rest], withComments = []) {
    // TODO: batch/pool more API requests - 5-10? - for more parallelized data retrieval
    if (!head) return withComments;

    const { review_comments_url, ...pr } = head;

    return requestWithToken(review_comments_url)
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
      .map((uri) => requestWithToken(uri, FOLLOW_HEADER_LINKS));

    return all.concat(await Promise.all(haveClosed).then((closed) => closed.map(formatSimple)));
  }

  const api = {
    get() {
      function fixAPI() {
        api.get = get;

        return get();
      }

      return hasData()
        ? fixAPI()
        : fetch("data.json")
            .then((response) => response.text())
            .then((body) => {
              const { data, updated_at } = JSON.parse(body, obscure.read);

              write(data, updated_at);

              fixAPI();
            });
    },
    hasData,
    lastUpdated,
    read,
    write,
  };

  return api;
}
