async function encryptData(publicKeyPem, data) {
    // 1. Załaduj klucz publiczny z formatu PEM
    const publicKey = await importRSAPublicKey(publicKeyPem);
  
    // 2. Wygeneruj klucz AES
    const aesKey = await crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256, // Możesz użyć 128 lub 192, ale 256 to standard
      },
      true, // Klucz do używania do szyfrowania
      ["encrypt", "decrypt"]
    );
  
    // 3. Szyfruj dane za pomocą AES
    const iv = crypto.getRandomValues(new Uint8Array(12)); // Inicjalizacja wektora
    const encodedData = new TextEncoder().encode(data);
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      aesKey,
      encodedData
    );
  
    // 4. Szyfruj klucz AES za pomocą klucza publicznego RSA
    const encryptedAesKey = await crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      publicKey,
      aesKey
    );
  
    // 5. Zwróć zaszyfrowane dane oraz klucz AES
    return {
      aesKey: new Uint8Array(encryptedAesKey),
      iv: iv,
      encryptedData: new Uint8Array(encryptedData),
    };
  }
  
  // Funkcja importująca klucz publiczny z formatu PEM
  async function importRSAPublicKey(pem) {
    const binaryDerString = window.atob(pem.replace(/-----BEGIN PUBLIC KEY-----|\n|-----END PUBLIC KEY-----/g, ""));
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
      binaryDer[i] = binaryDerString.charCodeAt(i);
    }
  
    return await crypto.subtle.importKey(
      "spki", // Format klucza
      binaryDer.buffer,
      {
        name: "RSA-OAEP",
        hash: { name: "SHA-256" },
      },
      false,
      ["encrypt"]
    );
  }
  
  // Przykład użycia
  const publicKeyPem = `-----BEGIN PUBLIC KEY-----
  ...Twój publiczny klucz RSA w formacie PEM...
  -----END PUBLIC KEY-----`;
  
  const dataToEncrypt = { message: "Tajna wiadomość" };
  
  encryptData(publicKeyPem, JSON.stringify(dataToEncrypt))
    .then((encryptedData) => {
      console.log("Zaszyfrowane dane:", encryptedData);
    })
    .catch((error) => {
      console.error("Błąd podczas szyfrowania:", error);
    });
  