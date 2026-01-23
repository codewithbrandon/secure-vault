// Security Configuration
const SECURITY_CONFIG = {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_MIME_TYPES: [
        'text/plain',
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    MIN_PASSWORD_LENGTH: 12,
    PBKDF2_ITERATIONS: 100000,
    AES_KEY_LENGTH: 256,
    SALT_LENGTH: 16, // bytes
    IV_LENGTH: 12 // bytes for GCM
};

// DOM Elements
const elements = {
    fileInput: document.getElementById('fileInput'),
    passwordInput: document.getElementById('passwordInput'),
    confirmPasswordInput: document.getElementById('confirmPasswordInput'),
    encryptBtn: document.getElementById('encryptBtn'),
    togglePassword: document.getElementById('togglePassword'),
    fileInfo: document.getElementById('fileInfo'),
    passwordStrength: document.getElementById('passwordStrength'),
    resultsSection: document.getElementById('resultsSection'),
    encryptedOutput: document.getElementById('encryptedOutput'),
    downloadBtn: document.getElementById('downloadBtn'),
    resetBtn: document.getElementById('resetBtn'),
    logContainer: document.getElementById('logContainer'),
    encryptionStatus: document.getElementById('encryptionStatus'),
    keyStrength: document.getElementById('keyStrength'),
    validationStatus: document.getElementById('validationStatus')
};

// State Management
let selectedFile = null;
let encryptedData = null;
let encryptionMetadata = null;

// Event Listeners
elements.fileInput.addEventListener('change', handleFileSelect);
elements.passwordInput.addEventListener('input', handlePasswordInput);
elements.confirmPasswordInput.addEventListener('input', validateForm);
elements.togglePassword.addEventListener('click', togglePasswordVisibility);
elements.encryptBtn.addEventListener('click', handleEncryption);
elements.downloadBtn.addEventListener('click', handleDownload);
elements.resetBtn.addEventListener('click', resetVault);

// Initialize
logSecurityEvent('System initialized', 'success');
updateStatus('encryptionStatus', 'Standby', 'primary');

// File Selection Handler
function handleFileSelect(event) {
    const file = event.target.files[0];
    
    if (!file) {
        selectedFile = null;
        elements.fileInfo.textContent = 'No file selected';
        updateStatus('validationStatus', 'Pending', 'warning');
        validateForm();
        return;
    }

    // File Size Validation
    if (file.size > SECURITY_CONFIG.MAX_FILE_SIZE) {
        logSecurityEvent(`File rejected: Size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds 5MB limit`, 'error');
        alert('File size exceeds 5MB limit. Please select a smaller file.');
        elements.fileInput.value = '';
        updateStatus('validationStatus', 'Failed - Size', 'error');
        return;
    }

    // MIME Type Validation
    if (!SECURITY_CONFIG.ALLOWED_MIME_TYPES.includes(file.type)) {
        logSecurityEvent(`File rejected: MIME type ${file.type} not whitelisted`, 'error');
        alert('File type not allowed. Please select: TXT, PDF, JPG, PNG, DOC, or DOCX');
        elements.fileInput.value = '';
        updateStatus('validationStatus', 'Failed - Type', 'error');
        return;
    }

    selectedFile = file;
    elements.fileInfo.textContent = `${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
    logSecurityEvent(`File validated: ${file.name} - ${file.type}`, 'success');
    updateStatus('validationStatus', 'Passed', 'success');
    
    validateForm();
}

// Password Input Handler
function handlePasswordInput() {
    const password = elements.passwordInput.value;
    const strength = calculatePasswordStrength(password);
    
    elements.passwordStrength.className = `password-strength ${strength.level}`;
    
    if (password.length >= SECURITY_CONFIG.MIN_PASSWORD_LENGTH) {
        updateStatus('keyStrength', `${strength.level.toUpperCase()} (${strength.score}/100)`, 'success');
    } else {
        updateStatus('keyStrength', 'Too Short', 'error');
    }
    
    validateForm();
}

// Password Strength Calculator
function calculatePasswordStrength(password) {
    let score = 0;
    
    if (password.length >= 12) score += 25;
    if (password.length >= 16) score += 15;
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^a-zA-Z0-9]/.test(password)) score += 15;
    
    let level = 'weak';
    if (score >= 70) level = 'strong';
    else if (score >= 50) level = 'medium';
    
    return { score, level };
}

// Toggle Password Visibility
function togglePasswordVisibility() {
    const type = elements.passwordInput.type === 'password' ? 'text' : 'password';
    elements.passwordInput.type = type;
    elements.confirmPasswordInput.type = type;
}

// Form Validation
function validateForm() {
    const password = elements.passwordInput.value;
    const confirmPassword = elements.confirmPasswordInput.value;
    
    const isValid = 
        selectedFile !== null &&
        password.length >= SECURITY_CONFIG.MIN_PASSWORD_LENGTH &&
        password === confirmPassword;
    
    elements.encryptBtn.disabled = !isValid;
}

// Main Encryption Handler
async function handleEncryption() {
    try {
        elements.encryptBtn.disabled = true;
        updateStatus('encryptionStatus', 'Processing...', 'warning');
        logSecurityEvent('Encryption process initiated', 'success');

        // Step 1: Read file
        const fileData = await readFileAsArrayBuffer(selectedFile);
        logSecurityEvent('File read complete', 'success');

        // Step 2: Generate cryptographic salt
        const salt = window.crypto.getRandomValues(new Uint8Array(SECURITY_CONFIG.SALT_LENGTH));
        logSecurityEvent(`Salt generated: ${SECURITY_CONFIG.SALT_LENGTH} bytes`, 'success');

        // Step 3: Derive encryption key using PBKDF2
        const password = elements.passwordInput.value;
        const keyMaterial = await deriveKeyMaterial(password, salt);
        logSecurityEvent(`PBKDF2 key derivation complete (${SECURITY_CONFIG.PBKDF2_ITERATIONS} iterations)`, 'success');

        // Step 4: Generate initialization vector (IV)
        const iv = window.crypto.getRandomValues(new Uint8Array(SECURITY_CONFIG.IV_LENGTH));
        logSecurityEvent(`IV generated: ${SECURITY_CONFIG.IV_LENGTH} bytes`, 'success');

        // Step 5: Encrypt data using AES-GCM
        const encryptedContent = await encryptData(keyMaterial, iv, fileData);
        logSecurityEvent('AES-GCM-256 encryption complete', 'success');

        // Step 6: Package encrypted data with metadata
        encryptedData = packageEncryptedData(salt, iv, encryptedContent);
        
        // Step 7: Store metadata
        encryptionMetadata = {
            fileName: selectedFile.name,
            originalSize: selectedFile.size,
            encryptedSize: encryptedData.byteLength,
            timestamp: new Date().toISOString()
        };

        // Step 8: Display results
        displayResults();
        updateStatus('encryptionStatus', 'Complete', 'success');
        
        // Mock transmission (console.log as specified)
        console.log('=== ENCRYPTED DATA READY FOR TRANSMISSION ===');
        console.log('Metadata:', encryptionMetadata);
        console.log('Encrypted Data Length:', encryptedData.byteLength, 'bytes');
        console.log('Base64 Preview:', arrayBufferToBase64(encryptedData).substring(0, 100) + '...');
        
        logSecurityEvent('Encryption successful - Ready for transmission', 'success');

    } catch (error) {
        console.error('Encryption error:', error);
        logSecurityEvent(`Encryption failed: ${error.message}`, 'error');
        alert('Encryption failed. Please try again.');
        updateStatus('encryptionStatus', 'Failed', 'error');
    } finally {
        elements.encryptBtn.disabled = false;
    }
}

// Read File as ArrayBuffer
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('File read failed'));
        reader.readAsArrayBuffer(file);
    });
}

// Derive Key Material using PBKDF2
async function deriveKeyMaterial(password, salt) {
    // Import password as key material
    const encoder = new TextEncoder();
    const passwordKey = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    );

    // Derive AES-GCM key
    return await window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: SECURITY_CONFIG.PBKDF2_ITERATIONS,
            hash: 'SHA-256'
        },
        passwordKey,
        { name: 'AES-GCM', length: SECURITY_CONFIG.AES_KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
}

// Encrypt Data using AES-GCM
async function encryptData(key, iv, data) {
    return await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv,
            tagLength: 128 // Authentication tag length
        },
        key,
        data
    );
}

// Package Encrypted Data with Salt and IV
function packageEncryptedData(salt, iv, encryptedContent) {
    // Structure: [salt (16 bytes)] + [iv (12 bytes)] + [encrypted data]
    const totalLength = salt.length + iv.length + encryptedContent.byteLength;
    const packagedData = new Uint8Array(totalLength);
    
    packagedData.set(salt, 0);
    packagedData.set(iv, salt.length);
    packagedData.set(new Uint8Array(encryptedContent), salt.length + iv.length);
    
    return packagedData.buffer;
}

// Display Encryption Results
function displayResults() {
    elements.resultsSection.style.display = 'block';
    
    const base64Data = arrayBufferToBase64(encryptedData);
    elements.encryptedOutput.value = base64Data.substring(0, 500) + '\n\n... [truncated for display] ...';
    
    // Scroll to results
    elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// Download Handler
function handleDownload() {
    if (!encryptedData) return;
    
    const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${encryptionMetadata.fileName}.encrypted`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    logSecurityEvent(`Encrypted file downloaded: ${a.download}`, 'success');
}

// Reset Vault
function resetVault() {
    selectedFile = null;
    encryptedData = null;
    encryptionMetadata = null;
    
    elements.fileInput.value = '';
    elements.passwordInput.value = '';
    elements.confirmPasswordInput.value = '';
    elements.fileInfo.textContent = 'No file selected';
    elements.passwordStrength.className = 'password-strength';
    elements.resultsSection.style.display = 'none';
    
    updateStatus('encryptionStatus', 'Standby', 'primary');
    updateStatus('keyStrength', 'N/A', 'primary');
    updateStatus('validationStatus', 'Pending', 'warning');
    
    validateForm();
    logSecurityEvent('Vault reset - All data cleared from memory', 'success');
}

// Update Status Display
function updateStatus(elementId, text, type) {
    const element = document.getElementById(elementId);
    element.textContent = text;
    
    const colors = {
        primary: 'var(--primary-accent)',
        success: 'var(--success-color)',
        warning: 'var(--warning-color)',
        error: 'var(--danger-color)'
    };
    
    element.style.color = colors[type] || colors.primary;
}

// Security Event Logger
function logSecurityEvent(message, type = 'success') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = `[${timestamp}] ${message}`;
    
    elements.logContainer.insertBefore(logEntry, elements.logContainer.firstChild);
    
    // Limit log entries to 50
    while (elements.logContainer.children.length > 50) {
        elements.logContainer.removeChild(elements.logContainer.lastChild);
    }
}