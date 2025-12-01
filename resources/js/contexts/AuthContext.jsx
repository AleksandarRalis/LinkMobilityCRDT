import { createContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

export const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch user on mount (cookie is sent automatically)
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await authApi.me();
                setUser(response.data.user);
            } catch (error) {
                // Not authenticated or token expired
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, []);

    const login = async (email, password) => {
        const response = await authApi.login({ email, password });
        setUser(response.data.user);
        sessionStorage.setItem('was_authenticated', 'true');
        return response.data;
    };

    const register = async (name, email, password, passwordConfirmation) => {
        const response = await authApi.register({
            name,
            email,
            password,
            password_confirmation: passwordConfirmation,
        });
        setUser(response.data.user);
        sessionStorage.setItem('was_authenticated', 'true');
        return response.data;
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } catch (error) {
            // Ignore logout errors
        } finally {
            setUser(null);
            sessionStorage.removeItem('was_authenticated');
        }
    };

    const value = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

