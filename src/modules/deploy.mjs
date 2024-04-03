import { ONE_DAY } from "./cacheManager.mjs";

const ONE_WEEK = ONE_DAY * 7;

const adjustDays = (date, adjust) => new Date(new Date(date).setDate(date.getDate() + adjust));
const newArray = (fill = () => []) => Array(rangeLength).fill(0).map(fill);
const repoName = (str) => rRepoName.exec(str)[1];

const today = new Date(new Date().toDateString()); // with no time info
const lastSunday = adjustDays(today, -today.getDay()); // most recent Sunday
const firstSunday = adjustDays(lastSunday, -(7 * 4 * 6)); // days * weeks * "months"
const range = allSundays([firstSunday], lastSunday);
const rangeLength = 4 * 6 + 1; // weeks * "months"
const rRepoName = /^.*?([^/]+)\/pulls\/\d+$/;

function allSundays(sundays, end) {
  const last = sundays.at(-1);

  return last >= end ? sundays : allSundays(sundays.concat(adjustDays(last, 7)), end);
}

export function createDeploysPlot(data) {
  const deploys = Object.values(data).reduce((acc, pr) => {
    const date = new Date(new Date(pr.closed_at).toDateString());

    if (date < firstSunday) return acc;

    const repo = repoName(pr.url);

    pr.weekNum = parseInt((date - firstSunday) / ONE_WEEK);

    acc[repo] ??= newArray();

    acc[repo][pr.weekNum].push(pr);

    return acc;
  }, {});

  const x = newArray((_, index) => range[index]);

  const reposData = Object.entries(deploys).map(([name, plot]) => ({
    name,
    x,
    y: plot.map((list) => list.length),
  }));

  const plots = [
    // {
    //   name: "Total",
    //   x,
    //   y: x.map((_, index) =>
    //     Object.values(reposData)
    //       .map(({ y }) => y[index])
    //       .reduce((a, b) => a + b)
    //   ),
    // },
    ...reposData,
  ];

  Plotly.newPlot(
    "deploys--graph",
    plots.concat(
      plots.map((plot) => {
        const average = plot.y.reduce((a, b) => a + b) / plot.y.length;

        return {
          ...plot,
          name: `${plot.name} (average)`,
          y: newArray(() => average),
        };
      })
    )
  );
}
