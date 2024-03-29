export function debounce(fn, delay) {
  let pending;

  return function postponed(...args) {
    pending && clearTimeout(pending);
    pending = setTimeout(fn.bind(this, ...args), delay || 200);
  };
}
