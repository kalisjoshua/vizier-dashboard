export class RatioCard extends HTMLElement {
  static ELEMENT_NAME = "cc-ratio-card";
  static WRAPPER = inDOM(`#ratios--cards`);

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
    const el = document.createElement("figure", { is: RatioCard.ELEMENT_NAME });
    const id = Math.random().toString(36).slice(2).toUpperCase();

    el.innerHTML = `
      <figcaption><strong>${name.toLowerCase()}</strong></figcaption>

      <div id="${id}" style="height: 40px; margin: 0 auto; width: 180px;"></div>
    `;

    RatioCard.WRAPPER.appendChild(el);

    const colorAuthor = Array(5).fill("gainsboro");
    const colorComment = Array(5).fill("green");
    const xData = [1, 2, 3, 6].map((num) => `${num * 30} days`).concat("all time");

    Plotly.newPlot(
      id,
      ranges.reduce(
        (acc, [n, d]) => {
          const [comment, author] = RatioCard.calcStackedBarValues(n, d);

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

  static calcStackedBarValues(comment = 0, author = 0) {
    let ratio = parseFloat((comment >= author ? 1 : comment / author).toFixed(2));

    if (!comment && !author) ratio = 0;

    return ratio ? [ratio, 1 - ratio] : [0, +!!author];
  }
}

customElements.define(RatioCard.ELEMENT_NAME, RatioCard, { extends: "figure" });
