import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { fetchWithToken } from "./fetchWithToken.mjs";

describe("fetchWithToken", () => {
  const genToken = () => Math.random().toString(36).slice(2);
  const tests = [
    // description, token, resource, root, expected
    ["should call the GitHub API for the `foo` resource", genToken(), "foo", null, "https://api.github.com/foo"],
    ["should call the GitHub API for the `foo` resource", genToken(), "foo", undefined, "https://api.github.com/foo"],
    ["should call the GitHub API for the `foo` resource", genToken(), "/foo", null, "https://api.github.com/foo"],
    [
      "should call 'http://alt.root' for the `foo` resource",
      genToken(),
      "foo",
      "http://alt.root",
      "http://alt.root/foo",
    ],
    [
      "should call 'http://alt.root' for the `foo` resource",
      genToken(),
      "/foo",
      "http://alt.root",
      "http://alt.root/foo",
    ],
    [
      "should call 'http://alt.root' for the `foo` resource",
      genToken(),
      // intentional double-slash
      "/foo",
      "http://alt.root/",
      "http://alt.root/foo",
    ],
    [
      "should call the url without inserting a root",
      genToken(),
      "http://example.com/foo",
      null,
      "http://example.com/foo",
    ],
    [
      "should call the url without inserting a root",
      genToken(),
      "http://example.com/foo",
      "http://unused.root",
      "http://example.com/foo",
    ],
  ];

  tests.forEach(([description, token, resource, root, expected]) => {
    it(description, async (test) => {
      const fetchMock = test.mock.fn(() => expected);
      test.mock.method(global, "fetch", fetchMock);

      const result = await fetchWithToken(token, resource, root);

      const [url, options] = fetchMock.mock.calls[0].arguments;

      assert.equal(url, result);
      assert.deepEqual(options, {
        headers: [
          ["Authorization", `Bearer ${token}`],
          ["X-GitHub-Api-Version", "2022-11-28"],
        ],
      });
    });
  });
});
