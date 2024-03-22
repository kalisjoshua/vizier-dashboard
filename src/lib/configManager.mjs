const STORE_KEY = "config";

export const configManager = {
  getToken: () => configManager.read().token,
  setToken(token) {
    configManager.write({ ...configManager.read(), token });
  },
  read: () => JSON.parse(localStorage.getItem(STORE_KEY) ?? "{}"),
  write(config) {
    localStorage.setItem(STORE_KEY, JSON.stringify(config));
  },
};
