import { RatioCard } from "../components/RatioCard.mjs";

const ONE_DAY = 1000 * 60 * 60 * 24;

const caseInsensitiveAlphaSort = (function () {
  const bin = (b) => `${b | 0}`;
  const low = ([x]) => x.toLowerCase();

  return (a, b) => {
    const [aa, bb] = [a, b].map(low);

    return parseInt(bin(aa > bb) + bin(aa === bb), 2) - 1;
  };
})();

export function addRatioCards(data, excludedContributors = []) {
  // clear the element to not continually add the same content multiple times
  RatioCard.WRAPPER.innerHTML = "";

  Object.entries(getCounts(data))
    .filter(([name]) => !excludedContributors.includes(name.toLowerCase()))
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
