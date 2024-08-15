import { RatioCard } from "../components/RatioCard.mjs";

const ALL_CONTRIBUTIONS = "all contributions";
const AUTHORED = 1;
const COMMENTED = 0;
const ONE_DAY = 1000 * 60 * 60 * 24;
const compareStrings = (a, b) => (a > b ? 1 : a < b ? -1 : 0);
const monthlyRanges = [1, 2, 3, 6].map((months) => new Date(new Date() - ONE_DAY * months * 30));
const startingPoint = () => [0, 0]; // [comments, authored]

export function addRatioCards(data, excludedContributors = []) {
  // clear the element to not continually add the same content multiple times
  RatioCard.WRAPPER.innerHTML = "";

  // console.log(data);
  const counts = Object.values(data).reduce(countAllContributions, {});

  Object.entries(counts)
    .filter(([name]) => !excludedContributors.includes(name.toLowerCase()))
    .sort(([a], [b]) => compareStrings(a.toLowerCase(), b.toLowerCase()))
    .forEach(RatioCard.addCard);
}

function addToContributionCount(closedDate, acc, person, type) {
  // intentional mutation!
  acc[person] ??= [
    // one for each monthly range
    ...monthlyRanges.map(startingPoint),
    // another for all time
    startingPoint(),
  ];

  monthlyRanges.forEach((date, index) => {
    if (date <= closedDate) {
      acc[person][index][type] += 1;
    }
  });

  acc[person][monthlyRanges.length][type] += 1;
}

function countAllContributions(acc, { author, closed_at, comments_from = [] }) {
  const closedDate = new Date(closed_at ?? Date.now());

  addToContributionCount(closedDate, acc, author, AUTHORED);
  addToContributionCount(closedDate, acc, ALL_CONTRIBUTIONS, AUTHORED);

  comments_from.forEach((commentor) => {
    if (commentor !== author) {
      addToContributionCount(closedDate, acc, commentor, COMMENTED);
      addToContributionCount(closedDate, acc, ALL_CONTRIBUTIONS, COMMENTED);
    }
  });

  return acc;
}
