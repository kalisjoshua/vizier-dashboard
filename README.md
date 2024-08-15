# Vizier Dashboard

This dashboard displays project metrics on:

- Sonarcloud badges as an overview
- Contribution ratios
- Pull request "open time"
- Deployments

## Contribution Ratios

Contribution ratios are only ever to be used to indicate that individuals are commenting on an equal number of pull requests as they are authoring. These ratios should never be used to compare individuals against others.

Each bar of each graph is showing the ratio of: comments - on other contributors' pull requests - (green) to authored pull requests (gray). The goal we should aim for is a completely green bar, meaning that we have commented on other peoples' pull requests at least as many times as we have asked for people to comment on our own pull requests. Or, "Are we providing as much feedback as we are asking for?"

## Open Time

The purpose of this plot is to evaluate how long PRs take to get accepted. This plot is only considering: PRs that were "merged", and open for more than 1 day.

## Deployments

Assuming PR merge is synonymous with deployment the graph of deployments sums up the number of merges between Sundays (weekly).

# Project

Zero dependencies.

```bash
# start a server
npx http-server src

# testing
npm test
```

# Cached Data

The file `./data.json` is a shortcut to alleviate the need to fetch all information from the GitHub API for all new visitors; which can take a significant amount of time depending on the number of repositories and pull requests. This file is encrypted so it is stored locally in `localStorage`. The "server cached" file can/should be updated infrequently to keep load times down.

# Use

In one project using this the package defines this project as a dependent module and copy its contents into a `docs/` directory for hosting on GitHub Pages.

```
  "scripts": {
    "clean": "rm -rf docs && mkdir docs",
    "install": "cp -r node_modules/vizier-dashboard/src/* docs",
    "preinstall": "npm run clean",
    "postinstall": "cp index.html data.json docs",
    "start": "npx http-server"
  },
```

# Config

Example config object:

```json
{
  "repos": {
    "...github_org/...repo": {
      "encryptionKey": "...",
      "sonar": [
        {
          "label": "...",
          "project": "...",
          "token": "..."
        }
        // ...
      ]
    }
  }
}
```
