export const DEFAULT_DELAY = 200;

export function debounce(fn, delay) {
  let pending;

  return function postponed(...args) {
    pending && clearTimeout(pending);
    pending = setTimeout(fn.bind(this, ...args), delay || DEFAULT_DELAY);
  };
}
