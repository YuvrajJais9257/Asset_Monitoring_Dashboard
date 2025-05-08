import CryptoJS from "crypto-js";

const SECRET_KEY = "ersmith@hyphen"; 

// Encrypt data
export const encryptData = (data) => {
  try {
    return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
  } catch (error) {
    console.error("Encryption Error:", error);
    return null;
  }
};

// Decrypt data
export const decryptData = (cipherText) => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedData);
  } catch (error) {
    console.error("Decryption Error:", error);
    return null;
  }
};
