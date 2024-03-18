// sourced from https://gist.github.com/chrisveness/43bcda93af9f646d083fad678071b90a

const CON = "|";

const sixFour = {
  read: (val) =>
    val
      .match(/.{1,2}/g)
      .map((v) => String.fromCharCode(parseInt(v, 16)))
      .join(""),
  write: (val) => [...new TextEncoder().encode(val)].map((v) => v.toString(16).padStart(2, "0")).join(""),
};

const textEncode = (s) => new TextEncoder().encode(s);

async function getBuffer(subject, password, iv, direction) {
  const alg = { name: "AES-GCM", iv };
  const subtle = crypto.subtle;

  return [
    Promise.resolve(textEncode(password)),
    (password) => subtle.digest("SHA-256", password),
    (pwHash) => subtle.importKey("raw", pwHash, alg, false, [direction]),
    (key) => subtle[direction](alg, key, subject),
  ].reduce(async (input, fn) => await fn(await input));
}

export async function decrypt(ciphertext, password) {
  if (!ciphertext.includes(CON)) throw new Error("Invalid ciphertext");

  const [iv, ctStr] = ciphertext.split(CON).map((i) => sixFour.read(i));

  try {
    return await getBuffer(ctStr, password, iv, "decrypt").then((val) => new TextDecoder().decode(val));
  } catch (e) {
    throw new Error("Decrypt failed");
  }
}

export async function encrypt(plaintext, password) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const buff = await getBuffer(textEncode(plaintext), password, iv, "encrypt");

  return [iv, buff].map((i) => sixFour.write(i)).join(CON);
}
