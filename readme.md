# Secure Police Authentication System

A modern, secure, and user-friendly authentication system for police personnel, featuring risk-based session management, activity logging, and a responsive interface.

---

## 🗂️ Project Structure

dps_project/
├── index.html # Main HTML structure for the app
├── styles.css # Responsive and modern CSS styles
├── app.js # Main frontend controller for UI and session handling
├── auth.js # Handles user registration and authentication
├── userProfile.js # Manages user-specific data and risk profiles
├── security.js # Logs events and handles risk assessment
└── readme.md # Project documentation

---

## 🚀 Features

- **User Registration & Login**  
  Secure registration and login using badge ID and strong password requirements.

- **Password Strength Meter**  
  Real-time feedback on password strength to encourage secure credentials.

- **Risk-Based Session Management**  
  Session timeout adapts based on login risk (e.g., failed attempts, unusual times).

- **Authentication Logs**  
  Recent login attempts and activities are displayed for user awareness.

- **Security Insights**  
  Real-time risk assessment and security status shown on the dashboard.

- **Responsive UI**  
  Clean, modern, and accessible interface for all users.

---

## 🖥️ Frontend Overview

### `index.html`

- Contains the structure for registration, login, dashboard, and alerts.
- Loads all JS modules and the stylesheet.

### `styles.css`

- Provides a modern, clean look.
- Responsive design with clear feedback for errors, warnings, and successes.
- Color-coded risk indicators and password strength feedback.

### `app.js`

- Handles UI logic, panel switching, alerts, and session management.
- Integrates authentication, user profile, and security modules.
- Displays authentication logs and manages session timeout.

### `auth.js`

- Handles user registration and login.
- Implements a simple password hashing function (for demo purposes).
- Checks password strength and stores user data in `localStorage`.

### `userProfile.js`

- Manages user-specific data such as login times, failed attempts, and risk scores.
- Updates profile on successful or failed login attempts.

### `security.js`

- Logs authentication events with timestamps, device info, and risk levels.
- Assesses risk based on login patterns and failed attempts.
- Provides recommendations for session timeout and additional verification.

---

## 🛡️ Security Highlights

- **Password Policy:**  
  Minimum 8 characters, with uppercase, lowercase, numbers, and special characters.

- **Risk Assessment:**

  - High risk: Multiple failed attempts or unusual login patterns.
  - Medium risk: Suspicious activity detected.
  - Low risk: Normal login behavior.

- **Session Timeout:**

  - Dynamically adjusted based on risk level.
  - User activity (mouse/keyboard) can extend session within safe limits.

- **Local Storage:**
  - All user data and logs are stored in the browser's `localStorage` for demo purposes.
  - **Note:** For production, use a secure backend and never store sensitive data in local storage.

---

## 📝 Usage

1. **Open `index.html` in your browser.**
2. **Register** with a unique badge ID and a strong password.
3. **Login** using your credentials.
4. **View your dashboard** for security status and recent authentication logs.
5. **Logout** or let the session timeout for automatic logout.

---

## ⚠️ Disclaimer

This project is a demonstration of frontend authentication and risk-based session management.  
**Do not use as-is for production or real-world sensitive applications.**  
For real deployments, implement a secure backend, encrypted storage, and robust authentication protocols.

---

## 📚 License

MIT License

---

## 👨‍💻 Authors

- Rohit Gunwal

---

## 📬 Feedback

For suggestions or issues, please open an issue or contact the maintainer.
 