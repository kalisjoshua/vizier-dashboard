// sourced from - https://dev.to/halan/4-ways-of-symmetric-cryptography-and-javascript-how-to-aes-with-javascript-3o1b

const SALT_LENGTH = 16;

const algorithm = { name: "AES-CBC", length: 256 };
const base64 = {
  decode: (arg) => Uint8Array.from(atob(arg), (c) => c.charCodeAt(0)),
  encode: (arg) => btoa(String.fromCharCode(...new Uint8Array(arg))),
};
const chunks = [
  [0, SALT_LENGTH], // salt
  [SALT_LENGTH, SALT_LENGTH * 2], // iv - initial value
  [SALT_LENGTH * 2], // the rest; the message/subject
];

const encode = (arg) => new TextEncoder().encode(arg);
const execute = (method, iv, key, subject) => crypto.subtle[method]({ name: algorithm.name, iv }, key, subject);
const foldAsync = async (input, fn) => fn(await input);
const randomValues = () => crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

export async function decrypt(ciphertext, password) {
  const [salt, iv, subject] = chunks.reduce(
    ([acc, buffer], args) => [acc.concat(buffer.slice(...args)), buffer],
    [[], base64.decode(ciphertext)]
  )[0];

  return [
    generateKey(password, salt),
    (key) => execute("decrypt", iv, key, subject),
    (encoded) => new TextDecoder().decode(encoded),
  ].reduce(foldAsync);
}

export async function encrypt(plaintext, password) {
  const [iv, salt] = [randomValues(), randomValues()];

  return [
    generateKey(password, salt),
    (key) => execute("encrypt", iv, key, encode(plaintext)),
    (val) => base64.encode([...salt, ...iv, ...new Uint8Array(val)]),
  ].reduce(foldAsync);
}

async function generateKey(password, salt) {
  const name = "PBKDF2";

  return [
    // convert an external key - like a password/passphrase - to a CryptoKey object
    crypto.subtle.importKey(
      "raw",
      encode(password), // external key
      { name },
      false,
      ["deriveKey"]
    ),
    (material) =>
      // derive a secret key from a master key
      crypto.subtle.deriveKey(
        {
          name,
          salt: encode(salt),
          iterations: 100000,
          hash: "SHA-256",
        },
        material,
        algorithm,
        false,
        ["decrypt", "encrypt"]
      ),
  ].reduce(foldAsync);
}
