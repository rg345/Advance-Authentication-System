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
        securityMessage: document.getElementById('securityMessage'),
        riskLevel: document.getElementById('riskLevel'),
        otpPanel: document.getElementById('otpPanel'),
        otpDestination: document.getElementById('otpDestination'),
        otpTimer: document.getElementById('otpTimer'),
        otpInput: document.getElementById('otpInput'),
        resendCountdown: document.getElementById('resendCountdown'),
        resendOtpBtn: document.getElementById('resendOtpBtn'),
        verifyOtpBtn: document.getElementById('verifyOtpBtn'),
        backToLoginBtn: document.getElementById('backToLoginBtn')
    };

    // Add these variables at the top of your DOMContentLoaded callback
    let currentUser = null;
    let otpTimerInterval;
    let resendCountdownInterval;

    // Panel switching functions
    function showLoginPanel() {
        elements.registerPanel.style.display = 'none';
        elements.loginPanel.style.display = 'block';
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

        // For demo purposes, using default email
        const result = auth.registerUser(badgeId, password, 'email', `${badgeId}@police.gov`);
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

        const result = auth.login(badgeId, password);
        if (result.success) {
            currentUser = badgeId;
            initiateOTPVerification(badgeId);
        } else {
            security.logAuthEvent(badgeId, false, 'Failed login attempt');
            if (auth.users[badgeId]) {
                userProfile.updateOnFailure(badgeId);
            }
            showAlert('Invalid badge ID or password');
        }
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
        
        if (!currentUser) {
            showAlert('Session expired. Please login again');
            showLoginPanel();
            return;
        }
        
        if (!enteredOTP) {
            showAlert('Please enter the verification code');
            return;
        }
        
        const result = auth.verifyOTP(currentUser, enteredOTP);
        if (result.success) {
            clearInterval(otpTimerInterval);
            clearInterval(resendCountdownInterval);
            
            const loginTime = new Date();
            const riskAssessment = security.assessLoginRisk(currentUser, loginTime);
            
            security.logAuthEvent(currentUser, true, 'Successful login with 2FA', riskAssessment.risk);
            userProfile.updateOnSuccess(currentUser, loginTime, riskAssessment);
            
            elements.userBadge.textContent = currentUser;
            elements.username.value = '';
            elements.password.value = '';
            elements.otpInput.value = '';
            
            elements.otpPanel.style.display = 'none';
            showDashboard();
            updateSecurityInsights(currentUser, riskAssessment);
            displayAuthLogs();
            startLogoutTimer(riskAssessment.recommendedTimeout);
        } else {
            if (result.blocked) {
                showAlert(result.message);
                setTimeout(() => {
                    showLoginPanel();
                }, 2000);
            } else {
                showAlert(result.message);
            }
        }
    });

    document.getElementById('resendOtpBtn').addEventListener('click', () => {
        if (currentUser) {
            initiateOTPVerification(currentUser);
            showAlert('A new verification code has been sent', 'success');
        }
    });

    document.getElementById('backToLoginBtn').addEventListener('click', (e) => {
        e.preventDefault();
        clearInterval(otpTimerInterval);
        clearInterval(resendCountdownInterval);
        currentUser = null;
        document.getElementById('otpInput').value = '';
        showLoginPanel();
    });

    // Initialize the application by showing login panel
    showLoginPanel();
}); 