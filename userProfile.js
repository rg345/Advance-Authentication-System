// User profile management
class UserProfile {
    constructor() {
        this.userProfiles = JSON.parse(localStorage.getItem('userProfiles')) || {};
    }

    initializeProfile(badgeId) {
        this.userProfiles[badgeId] = {
            usualLoginTimes: [],
            loginDays: [],
            failedAttempts: 0,
            lastLoginTime: null,
            consecutiveFailures: 0,
            successfulLogins: 0,
            riskScore: 0,
            knownDevices: [navigator.userAgent],
            loginLocations: ['192.168.1.1']
        };
        this.saveProfiles();
    }

    updateOnSuccess(badgeId, loginTime, riskAssessment) {
        if (!this.userProfiles[badgeId]) {
            this.initializeProfile(badgeId);
        }

        const profile = this.userProfiles[badgeId];
        // Update profile logic...
        this.saveProfiles();
    }

    updateOnFailure(badgeId) {
        if (!this.userProfiles[badgeId]) {
            this.initializeProfile(badgeId);
        }

        const profile = this.userProfiles[badgeId];
        profile.failedAttempts++;
        profile.consecutiveFailures++;
        profile.riskScore = Math.min(100, profile.riskScore + 15);
        
        this.saveProfiles();
    }

    saveProfiles() {
        localStorage.setItem('userProfiles', JSON.stringify(this.userProfiles));
    }
} 