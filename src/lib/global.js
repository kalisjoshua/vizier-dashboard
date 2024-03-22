const inDOM = (s = "") => {
  const all = Array.from(document.querySelectorAll(s));

  return all.length === 1 ? all[0] : all;
};
