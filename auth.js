// Authentication related functions
class Auth {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || {};
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
} 