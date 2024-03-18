# Contributions Dashboard

This dashboard aims to hold metrics for monitoring contribution health across the team; each metric will have its own unique values and rules for use.

## Ratios

Contribution ratios are only ever to be used to indicate that individuals are commenting on an equal number of pull requests as they are authoring. These ratios should never be used to compare individuals against others.

# Project

No libraries. No tools.

```bash
# start a server
npx http-server

# testing
node --test
```

## Data (cached data)

The file `./data.json` is a shortcut to alleviate the need to fetch all information from the API for any new visitors to this tool; which takes a significant amount of time. The format of the file is exactly what is in localStorage so that updating the file is as easy as `copy value` from the localStorage key and paste into the local `./data.json` file and update the branch.
