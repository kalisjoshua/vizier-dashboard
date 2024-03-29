export function fetchWithToken(token, resource) {
  const url = /^http/.test(resource) ? resource : `https://api.github.com/${resource}`;

  return fetch(url, {
    headers: [
      ["Authorization", `Bearer ${token}`],
      ["X-GitHub-Api-Version", "2022-11-28"],
    ],
  });
}
