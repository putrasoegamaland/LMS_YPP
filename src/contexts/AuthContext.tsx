'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@/types';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isLoggedIn: boolean;
    isStudent: boolean;
    isTeacher: boolean;
    login: (email: string, password: string, role: 'student' | 'teacher') => Promise<boolean>;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user accounts for realistic testing
// Students: username/password
// - budi.santoso@sekolah.sch.id / siswa123
// - siti.nurhaliza@sekolah.sch.id / siswa123
// Teachers:
// - pak.ahmad@sekolah.sch.id / guru123
// - ibu.sari@sekolah.sch.id / guru123

interface MockUser extends User {
    password: string;
}

const MOCK_USERS: MockUser[] = [
    // Teachers
    {
        id: 'teacher-ahmad',
        name: 'Pak Ahmad Wijaya',
        email: 'pak.ahmad@sekolah.sch.id',
        password: 'guru123',
        role: 'teacher',
        avatar: '👨‍🏫',
        createdAt: '2024-08-01T00:00:00.000Z',
    },
    {
        id: 'teacher-sari',
        name: 'Ibu Sari Dewi',
        email: 'ibu.sari@sekolah.sch.id',
        password: 'guru123',
        role: 'teacher',
        avatar: '👩‍🏫',
        createdAt: '2024-08-01T00:00:00.000Z',
    },
    // Students
    {
        id: 'student-budi',
        name: 'Budi Santoso',
        email: 'budi.santoso@sekolah.sch.id',
        password: 'siswa123',
        role: 'student',
        avatar: '👦',
        classId: 'class-9a',
        className: 'Kelas 9A',
        createdAt: '2024-08-15T00:00:00.000Z',
    },
    {
        id: 'student-siti',
        name: 'Siti Nurhaliza',
        email: 'siti.nurhaliza@sekolah.sch.id',
        password: 'siswa123',
        role: 'student',
        avatar: '👧',
        classId: 'class-9a',
        className: 'Kelas 9A',
        createdAt: '2024-08-15T00:00:00.000Z',
    },
];

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load user from localStorage on mount
    useEffect(() => {
        const savedUser = localStorage.getItem('lms_ypp_user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                console.error('Failed to parse saved user:', e);
                localStorage.removeItem('lms_ypp_user');
            }
        }
        setIsLoading(false);
    }, []);

    // Save user to localStorage when it changes
    useEffect(() => {
        if (user) {
            localStorage.setItem('lms_ypp_user', JSON.stringify(user));
        }
    }, [user]);

    const login = async (email: string, password: string, role: 'student' | 'teacher'): Promise<boolean> => {
        setIsLoading(true);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check mock users with password validation
        const mockUser = MOCK_USERS.find(
            u => u.email.toLowerCase() === email.toLowerCase() &&
                u.password === password &&
                u.role === role
        );

        if (mockUser) {
            // Remove password before setting user
            const { password: _, ...userWithoutPassword } = mockUser;
            setUser(userWithoutPassword);
            setIsLoading(false);
            return true;
        }

        // For new registrations: allow any login with valid email format
        if (email.includes('@') && password.length >= 6) {
            const newUser: User = {
                id: `${role}-${Date.now()}`,
                name: role === 'student' ? 'Siswa Baru' : 'Guru Baru',
                email: email.toLowerCase(),
                role: role,
                avatar: role === 'student' ? '🦁' : '👨‍🏫',
                classId: role === 'student' ? 'class-9a' : undefined,
                className: role === 'student' ? 'Kelas 9A' : undefined,
                createdAt: new Date().toISOString(),
            };
            setUser(newUser);
            setIsLoading(false);
            return true;
        }

        setIsLoading(false);
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('lms_ypp_user');
    };

    const updateUser = (updates: Partial<User>) => {
        if (user) {
            setUser({ ...user, ...updates });
        }
    };

    const value: AuthContextType = {
        user,
        isLoading,
        isLoggedIn: !!user,
        isStudent: user?.role === 'student',
        isTeacher: user?.role === 'teacher',
        login,
        logout,
        updateUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
