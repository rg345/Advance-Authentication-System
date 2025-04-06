// Security and risk assessment
class Security {
    constructor() {
        this.authLogs = JSON.parse(localStorage.getItem('authLogs')) || [];
        this.mlSecurity = new MLSecurity();
    }

    logAuthEvent(badgeId, success, message, riskLevel = 'low') {
        const event = {
            timestamp: new Date().toISOString(),
            badgeId,
            success,
            message,
            ipAddress: '192.168.1.1',
            riskLevel,
            userAgent: navigator.userAgent,
            timeOfDay: new Date().getHours()
        };
        
        this.authLogs.unshift(event);
        if (this.authLogs.length > 100) {
            this.authLogs = this.authLogs.slice(0, 100);
        }
        
        localStorage.setItem('authLogs', JSON.stringify(this.authLogs));
    }

    assessLoginRisk(badgeId, loginTime) {
        return {
            risk: 'low',
            reason: 'Normal login pattern',
            recommendedTimeout: 300,
            insights: []
        };
    }
} 