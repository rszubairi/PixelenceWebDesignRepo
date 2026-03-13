// Simple API client for mobile app
// This provides the interface that the mobile app expects

export const api = {
    auth: {
        login: async (email: string, password: string) => {
            // This is a placeholder implementation
            // In a real application, this would call your Convex backend
            try {
                // For now, return a mock user object
                // In a real implementation, this would make an HTTP request to your Convex backend
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                if (!response.ok) {
                    throw new Error('Login failed. Please check your credentials.');
                }

                const user = await response.json();
                return user;
            } catch (error) {
                throw new Error('Login failed. Please check your credentials.');
            }
        }
    },
    // Add other API endpoints as needed
    users: {
        getCurrent: async () => {
            const response = await fetch('/api/users/current');
            return await response.json();
        }
    },
    appointments: {
        list: async () => {
            const response = await fetch('/api/appointments');
            return await response.json();
        },
        get: async (id: string) => {
            const response = await fetch(`/api/appointments/${id}`);
            return await response.json();
        }
    },
    reports: {
        list: async () => {
            const response = await fetch('/api/reports');
            return await response.json();
        },
        get: async (id: string) => {
            const response = await fetch(`/api/reports/${id}`);
            return await response.json();
        }
    }
};

export default api;
