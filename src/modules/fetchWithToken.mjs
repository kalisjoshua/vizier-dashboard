const GITHUB_API = "https://api.github.com";

const rDoubleSlash = /(?<!:)\/\/+/;

const cleanURL = (resource, root) =>
  resource.startsWith("http") ? resource : `${root ?? GITHUB_API}/${resource}`.replace(rDoubleSlash, "/");

/**
 * Make an API request with the given token to the provided resource;
 * optionally providing the API root. Written this way to allow for more
 * flexibility if "needed".
 *
 * @param {string} token - GitHub Personal Access Token (PAT)
 * @param {string} resource full URL, or resource path (within the `root` URL API)
 * @param {string} root - root (the common part) of an API; defaults to `https://api.github.com/`
 * @returns {Promise<Response>} - fetch return
 */
export const fetchWithToken = (token, resource, root) =>
  fetch(cleanURL(resource, root), {
    headers: [
      ["Authorization", `Bearer ${token}`],
      ["X-GitHub-Api-Version", "2022-11-28"],
    ],
  });
