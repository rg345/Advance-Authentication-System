// Main application logic
document.addEventListener('DOMContentLoaded', () => {
    const auth = new Auth();
    const userProfile = new UserProfile();
    const security = new Security();

    // Initialize DOM elements
    const elements = {
        registerPanel: document.getElementById('registerPanel'),
        loginPanel: document.getElementById('loginPanel'),
        dashboard: document.getElementById('dashboard'),
        showLoginLink: document.getElementById('showLoginLink'),
        showRegisterLink: document.getElementById('showRegisterLink'),
        alertBox: document.getElementById('alertBox'),
        // Form elements
        newUsername: document.getElementById('newUsername'),
        newPassword: document.getElementById('newPassword'),
        confirmPassword: document.getElementById('confirmPassword'),
        username: document.getElementById('username'),
        password: document.getElementById('password'),
        passwordStrength: document.getElementById('passwordStrength'),
        userBadge: document.getElementById('userBadge'),
        timer: document.getElementById('timer'),
        authLogs: document.getElementById('authLogs'),
        // Add new OTP elements
        otpPanel: document.getElementById('otpPanel'),
        otpInput: document.getElementById('otpInput'),
        otpDestination: document.getElementById('otpDestination'),
        verifyOtpBtn: document.getElementById('verifyOtpBtn'),
        resendOtpBtn: document.getElementById('resendOtpBtn'),
        otpTimer: document.getElementById('otpTimer'),
        resendCountdown: document.getElementById('resendCountdown'),
        backToLoginBtn: document.getElementById('backToLoginBtn'),
        // Add email/phone elements
        emailField: document.getElementById('emailField'),
        phoneField: document.getElementById('phoneField'),
        emailInput: document.getElementById('email'),
        phoneInput: document.getElementById('phone'),
    };

    // Add these variables at the top level of your DOMContentLoaded callback
    let currentUser = null;
    let otpData = {};
    let otpTimerInterval;
    let resendCountdownInterval;

    // Panel switching functions
    function showLoginPanel() {
        elements.registerPanel.style.display = 'none';
        elements.loginPanel.style.display = 'block';
        elements.otpPanel.style.display = 'none';
        elements.dashboard.style.display = 'none';
        elements.alertBox.style.display = 'none';
    }

    function showRegisterPanel() {
        elements.registerPanel.style.display = 'block';
        elements.loginPanel.style.display = 'none';
        elements.dashboard.style.display = 'none';
        elements.alertBox.style.display = 'none';
    }

    function showDashboard() {
        elements.registerPanel.style.display = 'none';
        elements.loginPanel.style.display = 'none';
        elements.dashboard.style.display = 'block';
    }

    // Event listeners for panel switching
    elements.showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginPanel();
    });

    elements.showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterPanel();
    });

    // Show alert function
    function showAlert(message, type = 'error') {
        elements.alertBox.textContent = message;
        elements.alertBox.style.display = 'block';
        
        if (type === 'success') {
            elements.alertBox.style.backgroundColor = '#d4edda';
            elements.alertBox.style.color = '#155724';
        } else {
            elements.alertBox.style.backgroundColor = '#f8d7da';
            elements.alertBox.style.color = '#721c24';
        }
        
        setTimeout(() => {
            elements.alertBox.style.display = 'none';
        }, 5000);
    }

    // Password strength checker
    elements.newPassword.addEventListener('input', function() {
        const password = this.value;
        const strength = auth.checkPasswordStrength(password);
        
        if (strength === 'weak') {
            elements.passwordStrength.textContent = 'Weak password (Use at least 8 characters with numbers, symbols, and capital letters)';
            elements.passwordStrength.className = 'password-strength weak';
        } else if (strength === 'medium') {
            elements.passwordStrength.textContent = 'Medium strength (Add more variety of characters)';
            elements.passwordStrength.className = 'password-strength medium';
        } else {
            elements.passwordStrength.textContent = 'Strong password';
            elements.passwordStrength.className = 'password-strength strong';
        }
    });

    // Register handler
    document.getElementById('registerBtn').addEventListener('click', () => {
        const badgeId = elements.newUsername.value.trim();
        const password = elements.newPassword.value;
        const confirmPassword = elements.confirmPassword.value;

        if (!badgeId || !password || !confirmPassword) {
            showAlert('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            showAlert('Passwords do not match');
            return;
        }

        if (auth.checkPasswordStrength(password) === 'weak') {
            showAlert('Please use a stronger password');
            return;
        }

        const result = auth.registerUser(badgeId, password);
        if (result.success) {
            userProfile.initializeProfile(badgeId);
            security.logAuthEvent(badgeId, true, 'Registration successful');
            showAlert(result.message, 'success');
            
            // Clear fields
            elements.newUsername.value = '';
            elements.newPassword.value = '';
            elements.confirmPassword.value = '';
            elements.passwordStrength.textContent = '';
            
            showLoginPanel();
        } else {
            showAlert(result.message);
        }
    });

    // Login handler
    document.getElementById('loginBtn').addEventListener('click', () => {
        const badgeId = elements.username.value.trim();
        const password = elements.password.value;

        if (!badgeId || !password) {
            showAlert('Please fill in all fields');
            return;
        }

        if (!auth.users[badgeId] || auth.users[badgeId].password !== auth.hashPassword(password)) {
            security.logAuthEvent(badgeId, false, 'Failed login attempt');
            if (auth.users[badgeId]) {
                userProfile.updateOnFailure(badgeId);
            }
            showAlert('Invalid badge ID or password');
            return;
        }

        currentUser = badgeId;
        sendOTP(badgeId);
    });

    // Logout handler
    document.getElementById('logoutBtn').addEventListener('click', () => {
        clearInterval(window.logoutTimer);
        security.logAuthEvent(elements.userBadge.textContent, true, 'User logged out');
        displayAuthLogs();
        showLoginPanel();
    });

    // Session timer
    let timeLeft = 300;
    function startLogoutTimer(timeout = 300) {
        timeLeft = timeout;
        elements.timer.textContent = timeLeft;
        
        clearInterval(window.logoutTimer);
        window.logoutTimer = setInterval(() => {
            timeLeft--;
            elements.timer.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                document.getElementById('logoutBtn').click();
            }
        }, 1000);
    }

    // Activity detection
    document.addEventListener('mousemove', resetInactivityTimer);
    document.addEventListener('keypress', resetInactivityTimer);
    document.addEventListener('click', resetInactivityTimer);

    function resetInactivityTimer() {
        if (elements.dashboard.style.display === 'block' && timeLeft < (timeLeft * 0.8)) {
            const riskLevel = document.getElementById('riskLevel').textContent.toLowerCase();
            const currentRisk = riskLevel.includes('low') ? 'low' : 
                              riskLevel.includes('medium') ? 'medium' : 'high';
            
            const maxTime = currentRisk === 'low' ? 360 : currentRisk === 'medium' ? 240 : 120;
            timeLeft = Math.min(timeLeft + 30, maxTime);
            elements.timer.textContent = timeLeft;
        }
    }

    // Add this function after the resetInactivityTimer function and before the initialization
    function displayAuthLogs() {
        const userLogs = security.authLogs.filter(log => log.badgeId === elements.userBadge.textContent);
        const recentLogs = userLogs.slice(0, 5); // Get 5 most recent logs
        
        elements.authLogs.innerHTML = ''; // Clear existing logs
        
        if (recentLogs.length === 0) {
            elements.authLogs.innerHTML = '<p>No recent activity</p>';
            return;
        }
        
        recentLogs.forEach(log => {
            const logEntry = document.createElement('div');
            
            // Set class based on log type
            if (!log.success) {
                logEntry.className = 'log-entry failure';
            } else if (log.riskLevel === 'high') {
                logEntry.className = 'log-entry warning';
            } else {
                logEntry.className = 'log-entry success';
            }
            
            const date = new Date(log.timestamp);
            const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
            
            logEntry.textContent = `${formattedDate} - ${log.message}`;
            elements.authLogs.appendChild(logEntry);
        });
    }

    // Add this function to display security insights
    function updateSecurityInsights(badgeId, riskAssessment) {
        const securityMessage = document.getElementById('securityMessage');
        const riskLevel = document.getElementById('riskLevel');
        
        // Update risk indicator
        riskLevel.textContent = `${riskAssessment.risk.charAt(0).toUpperCase() + riskAssessment.risk.slice(1)} Risk`;
        riskLevel.className = `risk-indicator risk-${riskAssessment.risk}`;
        
        // Create insights message
        let message = `${riskAssessment.reason}. `;
        if (riskAssessment.insights && riskAssessment.insights.length > 0) {
            message += 'Detected patterns: ' + riskAssessment.insights.join(', ') + '. ';
        }
        message += `Session timeout set to ${Math.floor(riskAssessment.recommendedTimeout / 60)} minutes.`;
        
        securityMessage.textContent = message;
    }

    // Add these new functions
    function initiateOTPVerification(badgeId) {
        const otpInfo = auth.sendOTP(badgeId);
        elements.otpDestination.textContent = `${otpInfo.verificationMethod} (${otpInfo.contactInfo})`;
        
        elements.loginPanel.style.display = 'none';
        elements.otpPanel.style.display = 'block';
        elements.dashboard.style.display = 'none';
        
        startOTPTimer();
        startResendCountdown();
    }

    function startOTPTimer() {
        clearInterval(otpTimerInterval);
        let timeLeft = 180; // 3 minutes
        
        const otpTimerSpan = document.getElementById('otpTimer');
        otpTimerSpan.textContent = timeLeft;
        
        otpTimerInterval = setInterval(() => {
            timeLeft--;
            otpTimerSpan.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(otpTimerInterval);
                showAlert('Verification code expired. Please request a new one.');
            }
        }, 1000);
    }

    function startResendCountdown() {
        clearInterval(resendCountdownInterval);
        let timeLeft = 60; // 1 minute
        
        const resendBtn = document.getElementById('resendOtpBtn');
        const countdownSpan = document.getElementById('resendCountdown');
        
        resendBtn.disabled = true;
        countdownSpan.textContent = `(available in ${timeLeft}s)`;
        
        resendCountdownInterval = setInterval(() => {
            timeLeft--;
            countdownSpan.textContent = `(available in ${timeLeft}s)`;
            
            if (timeLeft <= 0) {
                clearInterval(resendCountdownInterval);
                resendBtn.disabled = false;
                countdownSpan.textContent = '';
            }
        }, 1000);
    }

    // Verify OTP handler
    document.getElementById('verifyOtpBtn').addEventListener('click', () => {
        const enteredOTP = elements.otpInput.value.trim();
        
        if (!currentUser || !otpData[currentUser]) {
            showAlert('Authentication error. Please try again');
            showLoginPanel();
            return;
        }
        
        if (!enteredOTP) {
            showAlert('Please enter the verification code');
            return;
        }
        
        const otpInfo = otpData[currentUser];
        
        if (Date.now() > otpInfo.expiry) {
            showAlert('Verification code has expired. Please request a new one');
            return;
        }
        
        if (enteredOTP !== otpInfo.code) {
            otpInfo.attempts++;
            if (otpInfo.attempts >= 3) {
                security.logAuthEvent(currentUser, false, 'Multiple failed OTP attempts', 'high');
                userProfile.updateOnFailure(currentUser);
                showAlert('Too many incorrect attempts. Please try again later');
                setTimeout(showLoginPanel, 2000);
            } else {
                security.logAuthEvent(currentUser, false, 'Failed OTP verification attempt', 'medium');
                showAlert(`Incorrect code. ${3 - otpInfo.attempts} attempts remaining`);
            }
            return;
        }
        
        clearInterval(otpTimerInterval);
        clearInterval(resendCountdownInterval);
        
        const loginTime = new Date();
        const riskAssessment = security.assessLoginRisk(currentUser, loginTime);
        
        security.logAuthEvent(currentUser, true, 'Successful login with 2FA', riskAssessment.risk);
        userProfile.updateOnSuccess(currentUser, loginTime, riskAssessment);
        
        delete otpData[currentUser];
        elements.otpInput.value = '';
        elements.userBadge.textContent = currentUser;
        elements.username.value = '';
        elements.password.value = '';
        
        elements.otpPanel.style.display = 'none';
        showDashboard();
        displayAuthLogs();
        startLogoutTimer(riskAssessment.recommendedTimeout);
    });

    document.getElementById('resendOtpBtn').addEventListener('click', () => {
        if (currentUser) {
            sendOTP(currentUser);
            showAlert('A new verification code has been sent', 'success');
        }
    });

    document.getElementById('backToLoginBtn').addEventListener('click', (e) => {
        e.preventDefault();
        clearInterval(otpTimerInterval);
        clearInterval(resendCountdownInterval);
        currentUser = null;
        elements.otpInput.value = '';
        showLoginPanel();
    });

    // Update the initApp function at the end of your DOMContentLoaded event listener
    function initApp() {
        // Clear any existing sessions
        currentUser = null;
        clearInterval(otpTimerInterval);
        clearInterval(resendCountdownInterval);
        
        // Reset form fields
        elements.username.value = '';
        elements.password.value = '';
        elements.otpInput.value = '';
        
        // Set initial display states explicitly
        elements.registerPanel.style.display = 'none';  // Hide register panel
        elements.loginPanel.style.display = 'block';    // Show login panel
        elements.otpPanel.style.display = 'none';       // Hide OTP panel
        elements.dashboard.style.display = 'none';      // Hide dashboard
        elements.alertBox.style.display = 'none';       // Hide alert box
    }

    // Initialize the application
    initApp();

    // Add these functions after your existing functions

    function generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    function maskEmail(email) {
        const [username, domain] = email.split('@');
        const maskedUsername = username[0] + '*'.repeat(username.length - 2) + username[username.length - 1];
        return `${maskedUsername}@${domain}`;
    }

    function maskPhone(phone) {
        return '*'.repeat(phone.length - 4) + phone.slice(-4);
    }

    function sendOTP(badgeId) {
        const user = auth.users[badgeId];
        const otp = generateOTP();
        const expiryTime = new Date();
        expiryTime.setMinutes(expiryTime.getMinutes() + 3);

        otpData[badgeId] = {
            code: otp,
            expiry: expiryTime.getTime(),
            attempts: 0
        };

        // Show where OTP was sent
        let maskedDestination;
        if (user.verificationMethod === 'email') {
            maskedDestination = maskEmail(user.contactInfo);
            elements.otpDestination.textContent = `email (${maskedDestination})`;
        } else {
            maskedDestination = maskPhone(user.contactInfo);
            elements.otpDestination.textContent = `phone (${maskedDestination})`;
        }

        console.log(`OTP for ${badgeId}: ${otp}`); // For demonstration
        security.logAuthEvent(badgeId, true, 'OTP requested', 'low');

        elements.loginPanel.style.display = 'none';
        elements.otpPanel.style.display = 'block';

        startOTPTimer();
        startResendCountdown();
    }

    function startOTPTimer() {
        clearInterval(otpTimerInterval);
        let timeLeft = 180; // 3 minutes
        elements.otpTimer.textContent = timeLeft;
        
        otpTimerInterval = setInterval(() => {
            timeLeft--;
            elements.otpTimer.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(otpTimerInterval);
                if (currentUser && otpData[currentUser]) {
                    otpData[currentUser].expiry = 0;
                }
                showAlert('Verification code expired. Please request a new one.');
            }
        }, 1000);
    }

    function startResendCountdown() {
        clearInterval(resendCountdownInterval);
        let timeLeft = 60;
        elements.resendOtpBtn.disabled = true;
        elements.resendCountdown.textContent = `(available in ${timeLeft}s)`;
        
        resendCountdownInterval = setInterval(() => {
            timeLeft--;
            elements.resendCountdown.textContent = `(available in ${timeLeft}s)`;
            
            if (timeLeft <= 0) {
                clearInterval(resendCountdownInterval);
                elements.resendOtpBtn.disabled = false;
                elements.resendCountdown.textContent = '';
            }
        }, 1000);
    }
}); 