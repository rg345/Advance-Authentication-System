// Security and risk assessment
class Security {
    constructor() {
        this.authLogs = JSON.parse(localStorage.getItem('authLogs')) || [];
        this.mlSecurity = new MLSecurity();
    }

    logAuthEvent(badgeId, success, message, riskLevel = 'low') {
        const loginData = {
            timestamp: new Date().toISOString(),
            badgeId,
            success,
            message,
            ipAddress: '192.168.1.1', // In production, get real IP
            riskLevel,
            userAgent: navigator.userAgent,
            timeOfDay: new Date().getHours()
        };

        // Train ML model with new data
        this.mlSecurity.trainModel(loginData);
        
        this.authLogs.unshift(loginData);
        if (this.authLogs.length > 100) {
            this.authLogs = this.authLogs.slice(0, 100);
        }
        
        localStorage.setItem('authLogs', JSON.stringify(this.authLogs));
    }

    assessLoginRisk(badgeId, loginTime) {
        const loginAttempt = {
            timestamp: loginTime.toISOString(),
            badgeId,
            ipAddress: '192.168.1.1', // In production, get real IP
            userAgent: navigator.userAgent
        };

        return this.mlSecurity.predictRiskLevel(loginAttempt);
    }
} 