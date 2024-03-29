const yearAndMonth = (str) => (str ? str.match(/(\d{4})-(\d{2})/).slice(1, 3) : []);

export function createOpenTimesPlot(data) {
  const graphData = Object.values(data).reduce((acc, pr) => {
    if (pr.state === "merged" && pr.days_open > 1) {
      const [year, month] = yearAndMonth(pr.closed_at);

      // TODO: include more options:
      //   * state: closed?, merged
      //   * dependabot...?

      acc[year + "/" + month] ??= [];
      acc[year + "/" + month].push(pr.days_open);
    }

    return acc;
  }, {});

  const plots = Object.entries(graphData)
    .sort()
    .map(([name, y]) => ({ y, type: "box", name, boxpoints: "all" }));

  const layout = {
    displayModeBar: false,
    yaxis: {
      type: "log",
    },
  };

  Plotly.newPlot("openTimes--graph", plots, layout);
}
