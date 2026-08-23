
/**
 * auth.js - Authentication Utilities
 */

export const auth = {
    // Save login data
    login: (token, role, username) => {
        localStorage.setItem("token", token);
        localStorage.setItem("role", role);
        localStorage.setItem("username", username);
        console.log(`[AUTH] Session started for ${username} as ${role}`);
    },

    // Wipe session
    logout: () => {
        localStorage.clear();
        console.log("[AUTH] User logged out.");
    },

    // Role check helper
    hasRole: (allowedRoles) => {
        const userRole = localStorage.getItem("role");
        return allowedRoles.includes(userRole);
    },

    isAuthenticated: () => {
        return !!localStorage.getItem("token");
    }
};
