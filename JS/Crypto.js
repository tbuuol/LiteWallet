function getEntrophy() {
    const entropy = new Uint8Array(16)
    return crypto.getRandomValues(entropy)
}


async function saveEncryptedSeed(seed, password) {
  const encrypted = await encryptAES(seed, password);
  const Meta = getMeta()
  Meta.Seeds.push(encrypted)

  //console.log(Meta)

  setMeta(Meta)

  //localStorage.setItem("wallet", encrypted);

  //console.log(encrypted)

  //const decrypted = await decryptAES(encrypted, password)
  //console.log(decrypted)
  //console.log(bip39.entropyToMnemonic(decrypted))
}

async function saveEncryptedKey(pkey, password) {
  const encrypted = await encryptAES(pkey, password)
  const Meta = getMeta()
  Meta.Keys.push(encrypted)

  //console.log(Meta)

  setMeta(Meta)
}

async function loadEncryptedSeed(password) {
  //const encrypted = localStorage.getItem("wallet");
  //const key = await deriveKey(password);

  //return await decryptAES(encrypted, key);

  const Meta = getMeta()
  if (Meta.Seeds.length > 0) {
    const encrypted = new Uint8Array(Object.values(Meta.Seeds[0]))
    //console.log(encrypted)
    return await decryptAES(encrypted, password)
  }
}

async function loadEncryptedKey(password) {
  const Meta = getMeta()
  const array = new Array

  for (let a = 0; a < Meta.Keys.length; a++) {
    const encrypted = new Uint8Array(Object.values(Meta.Keys[a]))
    const decrypted = await decryptAES(encrypted, password)
    array.push(decrypted)
  }
  
  return array
}

async function encryptAES(secret, password) {
  const enc = new TextEncoder()
  const Meta = getMeta()

  // Passwort → Key ableiten (PBKDF2)
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  )

  //const salt = crypto.getRandomValues(new Uint8Array(16))
  const salt = new Uint8Array(Object.values(Meta.Salt))

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    {
      name: "AES-GCM",
      length: 256
    },
    false,
    ["encrypt", "decrypt"]
  )

  //const iv = crypto.getRandomValues(new Uint8Array(12));
  const iv = new Uint8Array(Object.values(Meta.IV))

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv
    },
    aesKey,
    secret
  )

  //return { ciphertext: new Uint8Array(ciphertext), iv, salt };
  return new Uint8Array(ciphertext)
}

async function decryptAES(ciphertext, password) {
    const enc = new TextEncoder();
    const Meta = getMeta()
    const salt = new Uint8Array(Object.values(Meta.Salt))
    const iv = new Uint8Array(Object.values(Meta.IV))

    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        "PBKDF2",
        false,
        ["deriveBits", "deriveKey"]
    );

    const key = await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
    );

    const decrypted = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv
        },
        key,
        ciphertext
    );

    return new Uint8Array(decrypted);
}

// async/await, modern und sicher
async function SHA256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);                 // Uint8Array
  const hashBuffer = await crypto.subtle.digest('SHA-256', data); // ArrayBuffer
  return bufferToHex(hashBuffer);
}

function bufferToHex(buffer) {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToUint8Array(hex) {
    if (hex.length % 2 !== 0) throw new Error("Invalid hex string");

    const bytes = new Uint8Array(hex.length / 2);

    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }

    return bytes;
}

