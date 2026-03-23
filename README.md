<div align="center">

# Secure Vault

### Zero-Knowledge Client-Side File Encryption

[![Live Demo](https://img.shields.io/badge/Live_Demo-Launch_Vault-4a9eff?style=for-the-badge&logo=github)](https://codewithbrandon.github.io/secure-vault/)

![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla_ES6+-F7DF1E?logo=javascript&logoColor=black)
![Crypto](https://img.shields.io/badge/Crypto-AES--256--GCM-00d9a3?logo=letsencrypt&logoColor=white)
![KDF](https://img.shields.io/badge/KDF-PBKDF2_100k_Iterations-CC0000?logoColor=white)
![Standard](https://img.shields.io/badge/Standard-NIST_SP_800--38D-0080FF?logoColor=white)
![Dependencies](https://img.shields.io/badge/Dependencies-Zero-success)

> **Your files never leave your browser.** All cryptographic operations are performed client-side using the native Web Crypto API — no server, no uploads, no trust required.

</div>

---

## Table of Contents

- [Overview](#overview)
- [Cryptographic Specification](#cryptographic-specification)
- [How It Works](#how-it-works)
- [Skills Demonstrated](#skills-demonstrated)
- [Tech Stack](#tech-stack)
- [Screenshots](#screenshots)
  - [Cryptographic Architecture](#ref-1--cryptographic-architecture)
  - [Frontend Hardening](#ref-2--frontend-hardening-implementation)
  - [Encryption Workflow](#ref-3--encryption-workflow)
- [Security Hardening](#security-hardening)
- [Best Practices & Mitigations](#best-practices--mitigations)
- [Final Reflections](#final-reflections)

---

## Overview

Secure Vault is a professional-grade, browser-based file encryption tool built entirely with vanilla JavaScript and the Web Crypto API. It implements a **zero-knowledge architecture** — meaning the application itself has no knowledge of your password or file contents. Encryption happens locally, entirely within your browser.

This project demonstrates real-world application of NIST-compliant cryptographic standards: authenticated encryption, key derivation hardening, and frontend security controls that protect against data leakage at every layer.

---

## Cryptographic Specification

| Parameter | Value | Standard |
|-----------|-------|----------|
| **Cipher** | AES-GCM | NIST SP 800-38D |
| **Key Length** | 256-bit | NIST SP 800-57 |
| **Authentication Tag** | 128-bit | NIST SP 800-38D §5.2.1.2 |
| **Key Derivation** | PBKDF2-SHA256 | NIST SP 800-132 |
| **KDF Iterations** | 100,000 | OWASP recommendation |
| **Salt** | 16 bytes (128-bit, CSPRNG) | `window.crypto.getRandomValues` |
| **IV** | 12 bytes (96-bit, CSPRNG) | NIST GCM recommended nonce size |
| **Output Format** | `[salt (16B)] + [IV (12B)] + [ciphertext + tag]` | — |

---

## How It Works

```
User Password + File
        │
        ▼
┌───────────────────────────────────────────────────────┐
│                  BROWSER (client-side only)            │
│                                                       │
│  1. File → FileReader → ArrayBuffer                   │
│                                                       │
│  2. CSPRNG → 16-byte Salt                             │
│              12-byte  IV                              │
│                                                       │
│  3. Password + Salt ──PBKDF2-SHA256──► 256-bit Key    │
│                        (100,000 iterations)           │
│                                                       │
│  4. Key + IV + ArrayBuffer ──AES-256-GCM──► Ciphertext│
│                              + 128-bit Auth Tag       │
│                                                       │
│  5. Package: [ Salt | IV | Ciphertext+Tag ]           │
│              └─── Base64 ──► .encrypted download ───┘ │
└───────────────────────────────────────────────────────┘
        │
        ▼
  Zero network traffic.
  Server sees nothing.
```

**Why AES-GCM?** Unlike AES-CBC, GCM provides *authenticated* encryption — the 128-bit authentication tag detects any tampering with the ciphertext before decryption is attempted.

**Why PBKDF2 with 100k iterations?** A direct hash of a password as a key is vulnerable to brute force. PBKDF2 stretches the password derivation into a computationally expensive operation, making offline dictionary attacks infeasible on modern hardware.

---

## Skills Demonstrated

| Domain | Skill |
|--------|-------|
| **Applied Cryptography** | AES-256-GCM authenticated encryption; confidentiality + integrity in a single primitive |
| **Key Derivation** | PBKDF2-SHA256 with 100,000 iterations; CSPRNG salt generation |
| **Web Crypto API** | `subtle.importKey`, `subtle.deriveKey`, `subtle.encrypt`; native browser crypto |
| **Frontend Security** | Content Security Policy (CSP) meta-header; no third-party dependencies |
| **Input Hardening** | Privacy-first attributes (`autocomplete="new-password"`, `spellcheck="false"`) to prevent credential caching |
| **Secure File Handling** | MIME type whitelisting; 5MB file size enforcement; ArrayBuffer processing without network I/O |
| **Security UX** | Real-time password strength scoring; live audit log; status panel |

---

## Tech Stack

| Category | Detail |
|----------|--------|
| **Language** | Vanilla JavaScript (ES6+) — zero dependencies |
| **Cryptography** | Web Crypto API (`window.crypto.subtle`) |
| **File I/O** | HTML5 File API (`FileReader`, `ArrayBuffer`, `Blob`) |
| **Security Policy** | Content Security Policy via `<meta http-equiv>` |
| **Standard** | NIST SP 800-38D (AES-GCM), NIST SP 800-132 (PBKDF2) |

---

## Screenshots

### Ref 1 — Cryptographic Architecture

![Ref 1: Cryptographic Architecture](./svref2.png)

The vault implements **AES-256-GCM** authenticated encryption, providing both confidentiality (data cannot be read) and integrity (data cannot be tampered with undetected). PBKDF2 key derivation stretches user passwords through 100,000 hashing iterations, making brute-force attacks computationally infeasible. High-entropy random values are generated with `window.crypto.getRandomValues` for both the salt (16 bytes) and the IV (12 bytes), ensuring every encryption operation produces a unique ciphertext.

---

### Ref 2 — Frontend Hardening Implementation

![Ref 2: Frontend Hardening Implementation](./svref3.png)

A strict **Content Security Policy** is applied via `<meta http-equiv>` to block unauthorized inline scripts and prevent third-party resource loading. Privacy-first input attributes (`autocomplete="new-password"`, `spellcheck="false"`) prevent sensitive data from being cached by the browser or transmitted to cloud spellcheck services. MIME type validation enforces a strict whitelist, blocking malicious scripts disguised as legitimate file types.

---

### Ref 3 — Encryption Workflow

![Ref 3: Encryption Workflow](./svref4.png)

Files are read locally into an `ArrayBuffer` with no network transmission — maintaining the zero-knowledge guarantee. The password is combined with a CSPRNG-generated salt via PBKDF2 to produce a 256-bit AES key. The encrypted output is a binary package containing `[salt + IV + ciphertext]` — no filenames, no metadata, no plaintext. Even if intercepted, the ciphertext is computationally indistinguishable from random bytes without the password.

---

## Security Hardening

| Control | Implementation |
|---------|----------------|
| **Zero network I/O** | All operations run in `FileReader` → `ArrayBuffer` pipeline; confirmed via browser DevTools network tab |
| **No key persistence** | Keys exist only as non-exportable `CryptoKey` objects in memory during the active session |
| **Unique IVs** | 12-byte IV generated fresh for every encryption operation — IV reuse under the same key breaks GCM security |
| **Authenticated ciphertext** | GCM's 128-bit tag ensures decryption fails immediately on any tampered byte |
| **CSP enforcement** | Blocks inline script injection and unauthorized external resources |
| **MIME whitelisting** | Only `.txt`, `.pdf`, `.jpg`, `.png`, `.doc`, `.docx` accepted |
| **File size cap** | Hard 5MB limit prevents browser memory exhaustion |
| **Password minimum** | 12-character minimum enforced before encrypt button activates |

---

## Best Practices & Mitigations

- **Strong passwords are load-bearing.** PBKDF2 slows derivation but cannot compensate for a weak password. The UI enforces a 12-character minimum and provides real-time strength scoring to guide users toward high-entropy passphrases.
- **Keys live in memory only.** Encryption keys are never written to `localStorage`, `sessionStorage`, or any persistent store — they are derived on demand and exist only as in-memory `CryptoKey` objects for the duration of the operation.
- **Encrypted files require physical security.** The ciphertext is only as safe as the storage medium. Users should be aware that possession of the encrypted file plus the password is sufficient for decryption.
- **File size limits protect stability.** The 5MB cap prevents `ArrayBuffer` allocations from exhausting browser memory during encryption of large binaries.

---

## Final Reflections

Secure Vault demonstrates that production-grade encryption doesn't require a backend, a database, or a third-party library. The entire cryptographic surface is covered by the browser's native Web Crypto API — a FIPS-validated, hardware-accelerated implementation that is more trustworthy than any JavaScript library.

The zero-knowledge design is the core architectural guarantee: the server (GitHub Pages) serves only static files. It cannot see your password, your file, or your ciphertext. The only party that ever touches plaintext is the browser running on your machine.

This pattern — **encrypt at the client, store anywhere** — is directly applicable to real-world security architectures: end-to-end encrypted file storage, secure form submissions, and privacy-preserving data pipelines.

---

<div align="center">

[![Live Demo](https://img.shields.io/badge/Try_It_Live-Launch_Secure_Vault-4a9eff?style=for-the-badge&logo=github)](https://codewithbrandon.github.io/secure-vault/)

<sub>Built by <a href="https://github.com/codewithbrandon">Brandon</a> · AES-256-GCM · PBKDF2 · Zero Dependencies · No Server</sub>

</div>
