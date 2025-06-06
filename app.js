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
        authLogs: document.getElementById('authLogs')
    };

    // Panel switching functions
    function showLoginPanel() {
        console.log('Showing login panel'); // Debug log
        if (elements.registerPanel && elements.loginPanel) {
            elements.registerPanel.style.display = 'none';
            elements.loginPanel.style.display = 'block';
            elements.dashboard.style.display = 'none';
            elements.alertBox.style.display = 'none';
        } else {
            console.error('Panel elements not found');
        }
    }

    function showRegisterPanel() {
        console.log('Showing register panel'); // Debug log
        if (elements.registerPanel && elements.loginPanel) {
            elements.registerPanel.style.display = 'block';
            elements.loginPanel.style.display = 'none';
            elements.dashboard.style.display = 'none';
            elements.alertBox.style.display = 'none';
        } else {
            console.error('Panel elements not found');
        }
    }

    function showDashboard() {
        elements.registerPanel.style.display = 'none';
        elements.loginPanel.style.display = 'none';
        elements.dashboard.style.display = 'block';
    }

    // Event listeners for panel switching
    elements.showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Switching to login panel'); // Debug log
        showLoginPanel();
    });

    elements.showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Switching to register panel'); // Debug log
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
        console.log('Register button clicked'); // Debug log
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
        console.log('Registration result:', result); // Debug log

        if (result.success) {
            userProfile.initializeProfile(badgeId);
            security.logAuthEvent(badgeId, true, 'Registration successful');
            showAlert(result.message, 'success');
            
            // Clear fields
            elements.newUsername.value = '';
            elements.newPassword.value = '';
            elements.confirmPassword.value = '';
            elements.passwordStrength.textContent = '';
            
            // Add delay before switching panels
            setTimeout(() => {
                showLoginPanel();
            }, 1000);
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
            const loginTime = new Date();
            const riskAssessment = security.assessLoginRisk(badgeId, loginTime, userProfile.userProfiles[badgeId]);
            
            security.logAuthEvent(badgeId, true, 'Successful login', riskAssessment.risk);
            userProfile.updateOnSuccess(badgeId, loginTime, riskAssessment);
            
            elements.userBadge.textContent = badgeId;
            elements.username.value = '';
            elements.password.value = '';
            
            showDashboard();
            displayAuthLogs();
            startLogoutTimer(riskAssessment.recommendedTimeout);
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

    // Make sure initialization is correct at the end of your DOMContentLoaded event
    // Initialize the application by showing login panel
    function initApp() {
        console.log('Initializing application'); // Debug log
        // Show login panel by default
        elements.registerPanel.style.display = 'none';
        elements.loginPanel.style.display = 'block';
        elements.dashboard.style.display = 'none';
        elements.alertBox.style.display = 'none';
    }

    // Call initialization
    initApp();
}); 