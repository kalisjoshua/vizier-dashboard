const NAME = "cc-ratio-card";
const ONE_DAY = 1000 * 60 * 60 * 24;
const WRAPPER = inDOM(`#ratios--cards`);

function calcStackedBarValues(comment = 0, author = 0) {
  let ratio = parseFloat((comment >= author ? 1 : comment / author).toFixed(2));

  if (!comment && !author) ratio = 0;

  return ratio ? [ratio, 1 - ratio] : [0, +!!author];
}

const caseInsensitiveAlphaSort = (function () {
  const bin = (b) => `${b | 0}`;
  const low = ([x]) => x.toLowerCase();

  return (a, b) => {
    const [aa, bb] = [a, b].map(low);

    return parseInt(bin(aa > bb) + bin(aa === bb), 2) - 1;
  };
})();

export function addRatioCards(data) {
  const excludedNames = ["devops-vistingmedia", "dependabot[bot]", "mzyla-softserve"];

  // clear the element to not continually add the same content multiple times
  WRAPPER.innerHTML = "";

  Object.entries(getCounts(data))
    .filter(([name]) => !excludedNames.includes(name.toLowerCase()))
    .sort(caseInsensitiveAlphaSort)
    .forEach(RatioCard.addCard);
}

function getCounts(data) {
  const AUTHORED = 1;
  const COMMENTED = 0;
  const monthlyRanges = [1, 2, 3, 6].map((months) => new Date(new Date() - ONE_DAY * months * 30));

  function collect(closed, obj, key, type) {
    monthlyRanges.forEach((date, index) => {
      if (date <= closed) {
        obj[key][index][type] += 1;
      }
    });

    obj[key][4][type] += 1;
  }

  function initialValues(obj, key) {
    // [comments, authored]
    const val = () => [0, 0];

    // intentional mutation!
    obj[key] ??= [
      // one for each monthly range
      ...monthlyRanges.map(val),
      // another for all time
      val(),
    ];
  }

  return Object.values(data).reduce((acc, { author, closed_at, comments_from = [] }) => {
    const closed = new Date(closed_at ?? Date.now());

    initialValues(acc, author);
    collect(closed, acc, author, AUTHORED);

    comments_from.forEach((person) => {
      if (person !== author) {
        initialValues(acc, person);

        collect(closed, acc, person, COMMENTED);
      }
    });

    return acc;
  }, {});
}

class RatioCard extends HTMLElement {
  constructor() {
    super();

    this.style = `
      border: 2px solid gainsboro;
      border-radius: 5px;
      display: inline-block;
      margin: 1ex;
      overflow: auto;
      padding: 2ex;
      width: 12em;
    `;
  }

  static addCard([name, ranges]) {
    const el = document.createElement("figure", { is: NAME });
    const id = Math.random().toString(36).slice(2).toUpperCase();

    el.innerHTML = `
      <figcaption><strong>${name.toLowerCase()}</strong></figcaption>

      <div id="${id}" style="height: 40px; margin: 0 auto; width: 180px;"></div>
    `;

    WRAPPER.appendChild(el);

    const colorAuthor = Array(5).fill("gainsboro");
    const colorComment = Array(5).fill("green");
    const xData = [1, 2, 3, 6].map((num) => `${num * 30} days`).concat("all time");

    Plotly.newPlot(
      id,
      ranges.reduce(
        (acc, [n, d]) => {
          const [comment, author] = calcStackedBarValues(n, d);

          acc[0].y.push(comment);
          acc[1].y.push(author);

          return acc;
        },
        [
          { marker: { color: colorComment }, name: "Comment", type: "bar", x: xData, y: [] },
          { marker: { color: colorAuthor }, name: "Author", type: "bar", x: xData, y: [] },
        ]
      ),
      {
        barmode: "stack",
        margin: {
          b: 0,
          l: 0,
          pad: 0,
          r: 0,
          t: 0,
        },
        showlegend: false,
        xaxis: {
          autorange: "reversed",
        },
      },
      { displayModeBar: false }
    );
  }
}

customElements.define(NAME, RatioCard, { extends: "figure" });
