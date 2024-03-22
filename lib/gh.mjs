const rNext = /<([^>,]+?)>;\s*rel="next"/;

// pass getJSON === false to skip json parse
function githubSDKFactory(token, getJSON = true) {
  const config = {
    headers: [
      ["Authorization", `Bearer ${token}`],
      ["X-GitHub-Api-Version", "2022-11-28"],
    ],
  };

  async function requestWithToken(uri, followNext = false, publishStatus = () => {}) {
    const url = /^http/.test(uri) ? uri : `https://api.github.com/${uri}`;

    // TODO: add client-side throttling to prevent server-side throttling

    return await fetch(url, config)
      .then(async (response) => {
        const next = followNext && response.headers.get("link")?.match(rNext)?.at(1);
        const result = getJSON ? response.json() : response;

        publishStatus(next);

        // BEWARE! async recursion :)
        return !next ? [result] : [result, await requestWithToken(next, followNext, publishStatus)].flat();
      })
      .then((pending) => Promise.all(pending))
      .then((data) => data.flat())
      .then((result) => (result.length === 1 ? result[0] : result));
  }

  return requestWithToken;
}

export { githubSDKFactory };
