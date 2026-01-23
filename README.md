# 🔐 Secure Vault | Zero-Knowledge Encryption Gateway

A professional-grade demonstration of **Client-Side Encryption** built with Vanilla JavaScript and the **Web Crypto API**. This project follows NIST standards to ensure data privacy and integrity before files ever leave the local environment.


## 🛠️ Security Architecture
This vault implements a **Defense-in-Depth** strategy:

### 1. Cryptography (NIST SP 800-38D)
* **AES-256-GCM:** Authenticated encryption providing both confidentiality and data integrity.
* **PBKDF2 Derivation:** Protects against brute-force attacks by stretching passwords through 100,000 hashing iterations.
* **CSPRNG:** High-entropy random salts (16-byte) and IVs (12-byte) generated via `window.crypto.getRandomValues`.

### 2. Frontend Hardening
* **Strict CSP:** Meta-header configured to block unauthorized inline scripts and third-party exfiltration.
* **Privacy-First Inputs:** `spellcheck="false"` and `autocomplete="new-password"` prevent sensitive keys from being cached by browsers or sent to cloud spellcheck services.
* **MIME Validation:** Strict whitelisting of file types to prevent malicious script uploads.

## 🚀 How It Works
1.  **Local Read:** The file is read into an `ArrayBuffer` locally.
2.  **Key Derivation:** The user's password is combined with a random salt to derive a 256-bit key.
3.  **Encryption:** Data is encrypted locally; the browser outputs a secure package containing the `[Salt + IV + Ciphertext]`.
4.  **Zero Leakage:** No raw data or passwords are ever transmitted to a server. 
[🚀 Live Demo: Secure Vault](https://codewithbrandon.github.io/secure-vault/)
