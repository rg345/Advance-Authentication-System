// Authentication related functions
class Auth {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || {};
        this.otpData = {};
    }

    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    checkPasswordStrength(password) {
        const hasMinLength = password.length >= 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /[0-9]/.test(password);
        const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        const passedChecks = [hasMinLength, hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChars].filter(Boolean).length;
        
        if (passedChecks <= 2) return 'weak';
        if (passedChecks <= 4) return 'medium';
        return 'strong';
    }

    registerUser(badgeId, password) {
        if (this.users[badgeId]) {
            return { success: false, message: 'Badge ID already registered' };
        }

        this.users[badgeId] = {
            password: this.hashPassword(password),
            registeredOn: new Date().toISOString()
        };

        localStorage.setItem('users', JSON.stringify(this.users));
        return { success: true, message: 'Registration successful' };
    }

    login(badgeId, password) {
        if (!this.users[badgeId] || this.users[badgeId].password !== this.hashPassword(password)) {
            return { success: false, message: 'Invalid credentials' };
        }
        return { success: true, message: 'Login successful' };
    }

    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    sendOTP(badgeId) {
        const user = this.users[badgeId];
        const otp = this.generateOTP();
        const expiryTime = new Date();
        expiryTime.setMinutes(expiryTime.getMinutes() + 3); // 3 minutes expiry

        this.otpData[badgeId] = {
            code: otp,
            expiry: expiryTime.getTime(),
            attempts: 0
        };

        // In a real app, send OTP via email/SMS
        console.log(`OTP for ${badgeId}: ${otp}`); // For demonstration

        return {
            verificationMethod: user.verificationMethod || 'email',
            contactInfo: this.maskContactInfo(user.contactInfo || 'default@example.com')
        };
    }

    maskContactInfo(info) {
        if (info.includes('@')) {
            // Mask email
            const [username, domain] = info.split('@');
            const maskedUsername = username[0] + '*'.repeat(username.length - 2) + username[username.length - 1];
            return `${maskedUsername}@${domain}`;
        } else {
            // Mask phone
            return '*'.repeat(info.length - 4) + info.slice(-4);
        }
    }

    verifyOTP(badgeId, enteredOTP) {
        const otpInfo = this.otpData[badgeId];
        
        if (!otpInfo) {
            return { success: false, message: 'Authentication error' };
        }

        if (Date.now() > otpInfo.expiry) {
            return { success: false, message: 'Code expired' };
        }

        if (enteredOTP !== otpInfo.code) {
            otpInfo.attempts++;
            if (otpInfo.attempts >= 3) {
                delete this.otpData[badgeId];
                return { success: false, message: 'Too many attempts', blocked: true };
            }
            return { success: false, message: `Incorrect code. ${3 - otpInfo.attempts} attempts remaining` };
        }

        delete this.otpData[badgeId];
        return { success: true };
    }
} 