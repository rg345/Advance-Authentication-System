class MLSecurity {
    constructor() {
        this.modelData = {
            timeWeights: new Array(24).fill(0), // 24 hours
            dayWeights: new Array(7).fill(0),   // 7 days of week
            deviceWeights: new Map(),
            locationWeights: new Map()
        };
        this.loadModel();
    }

    // Load existing model data from localStorage
    loadModel() {
        const savedModel = localStorage.getItem('mlModel');
        if (savedModel) {
            this.modelData = JSON.parse(savedModel);
        }
    }

    // Save model data to localStorage
    saveModel() {
        localStorage.setItem('mlModel', JSON.stringify(this.modelData));
    }

    // Train model with new login data
    trainModel(loginData) {
        const hour = new Date(loginData.timestamp).getHours();
        const day = new Date(loginData.timestamp).getDay();

        // Update time weights
        this.modelData.timeWeights[hour] += loginData.success ? 1 : -0.5;

        // Update day weights
        this.modelData.dayWeights[day] += loginData.success ? 1 : -0.5;

        // Update device weights
        const deviceWeight = this.modelData.deviceWeights.get(loginData.userAgent) || 0;
        this.modelData.deviceWeights.set(
            loginData.userAgent,
            loginData.success ? deviceWeight + 1 : deviceWeight - 0.5
        );

        // Update location weights
        const locationWeight = this.modelData.locationWeights.get(loginData.ipAddress) || 0;
        this.modelData.locationWeights.set(
            loginData.ipAddress,
            loginData.success ? locationWeight + 1 : locationWeight - 0.5
        );

        this.saveModel();
    }

    // Calculate anomaly score for a login attempt
    calculateAnomalyScore(loginAttempt) {
        const hour = new Date(loginAttempt.timestamp).getHours();
        const day = new Date(loginAttempt.timestamp).getDay();

        // Get weights for current login attributes
        const timeWeight = this.modelData.timeWeights[hour];
        const dayWeight = this.modelData.dayWeights[day];
        const deviceWeight = this.modelData.deviceWeights.get(loginAttempt.userAgent) || -1;
        const locationWeight = this.modelData.locationWeights.get(loginAttempt.ipAddress) || -1;

        // Calculate composite score
        const score = (
            (timeWeight + 2) * 0.3 +
            (dayWeight + 2) * 0.2 +
            (deviceWeight + 2) * 0.3 +
            (locationWeight + 2) * 0.2
        ) / 4;

        return score;
    }

    // Predict risk level based on anomaly score
    predictRiskLevel(loginAttempt) {
        const anomalyScore = this.calculateAnomalyScore(loginAttempt);
        
        // Get user's historical data
        const userProfile = this.getUserProfile(loginAttempt.badgeId);
        
        // Calculate final risk score considering historical behavior
        const finalScore = (anomalyScore * 0.7) + (userProfile.riskScore * 0.3);

        // Determine risk level and timeout
        let risk, reason, recommendedTimeout;

        if (finalScore > 0.8) {
            risk = 'low';
            recommendedTimeout = 360; // 6 minutes
            reason = 'Login pattern matches historical behavior';
        } else if (finalScore > 0.5) {
            risk = 'medium';
            recommendedTimeout = 240; // 4 minutes
            reason = 'Some unusual patterns detected';
        } else {
            risk = 'high';
            recommendedTimeout = 120; // 2 minutes
            reason = 'Significant deviation from normal behavior';
        }

        return {
            risk,
            reason,
            recommendedTimeout,
            anomalyScore: finalScore,
            insights: this.generateInsights(loginAttempt, finalScore)
        };
    }

    // Generate detailed insights about the login attempt
    generateInsights(loginAttempt, anomalyScore) {
        const hour = new Date(loginAttempt.timestamp).getHours();
        const day = new Date(loginAttempt.timestamp).getDay();
        const insights = [];

        // Time-based insights
        if (this.modelData.timeWeights[hour] < 0) {
            insights.push(`Unusual login time (${hour}:00)`);
        }

        // Day-based insights
        if (this.modelData.dayWeights[day] < 0) {
            insights.push(`Uncommon login day (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][day]})`);
        }

        // Device-based insights
        const deviceWeight = this.modelData.deviceWeights.get(loginAttempt.userAgent) || 0;
        if (deviceWeight < 0) {
            insights.push('New or unusual device detected');
        }

        // Location-based insights
        const locationWeight = this.modelData.locationWeights.get(loginAttempt.ipAddress) || 0;
        if (locationWeight < 0) {
            insights.push('Login from new location');
        }

        return insights;
    }

    // Get user profile with historical data
    getUserProfile(badgeId) {
        const profiles = JSON.parse(localStorage.getItem('userProfiles')) || {};
        return profiles[badgeId] || { riskScore: 0.5 }; // Default medium risk for new users
    }
} 