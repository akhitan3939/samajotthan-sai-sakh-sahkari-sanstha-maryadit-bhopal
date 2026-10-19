import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, UserRole } from '../types';

interface AuthContextType {
  currentUser: AuthUser;
  switchRole: (role: UserRole, enteredPin: string) => boolean;
  logout: () => void;
  availableRoles: { role: UserRole; title: string; desc: string; defaultPin: string }[];
  isAuthorized: (requiredRole: UserRole) => boolean;
}

const ROLE_CONFIGS: Record<UserRole, { title: string; email: string; defaultPin: string; desc: string }> = {
  admin: {
    title: 'प्रबंधक / मुख्य कार्यपालन अधिकारी (Admin)',
    email: 'sssssmbhopal@gmail.com',
    defaultPin: '1234',
    desc: 'समस्त नियंत्रण: ऋण स्वीकृति, ब्याज एवं पेनल्टी फॉर्मूला, ऋण सम्पादन, डेटा बैकअप',
  },
  cashier: {
    title: 'रोकड़िया / लेखापाल (Cashier)',
    email: 'cashier.ssssm@gmail.com',
    defaultPin: '2345',
    desc: 'किश्त वसूली (EMI Collection), रसीद प्रिंट, दैनिक संग्रह व सदस्य खाता विवरण',
  },
  recovery: {
    title: 'वसूली अधिकारी (Recovery Officer)',
    email: 'recovery.ssssm@gmail.com',
    defaultPin: '3456',
    desc: 'डिफाल्टर ट्रैकिंग, ज़मानतदार जांच, तगादा सूचना पत्र एवं ईमेल/व्हाट्सएप अलर्ट',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    return (localStorage.getItem('ssssm_active_role') as UserRole) || 'admin';
  });

  const currentUser: AuthUser = {
    role: currentRole,
    name: ROLE_CONFIGS[currentRole].title,
    hindiTitle: ROLE_CONFIGS[currentRole].title,
    email: ROLE_CONFIGS[currentRole].email,
  };

  useEffect(() => {
    localStorage.setItem('ssssm_active_role', currentRole);
  }, [currentRole]);

  const switchRole = (role: UserRole, enteredPin: string): boolean => {
    if (ROLE_CONFIGS[role].defaultPin === enteredPin) {
      setCurrentRole(role);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentRole('cashier'); // default safe role
  };

  const isAuthorized = (requiredRole: UserRole): boolean => {
    if (currentRole === 'admin') return true;
    if (currentRole === 'cashier' && requiredRole === 'cashier') return true;
    if (currentRole === 'recovery' && (requiredRole === 'recovery' || requiredRole === 'cashier')) return true;
    return currentRole === requiredRole;
  };

  const availableRoles = [
    { role: 'admin' as UserRole, title: ROLE_CONFIGS.admin.title, desc: ROLE_CONFIGS.admin.desc, defaultPin: ROLE_CONFIGS.admin.defaultPin },
    { role: 'cashier' as UserRole, title: ROLE_CONFIGS.cashier.title, desc: ROLE_CONFIGS.cashier.desc, defaultPin: ROLE_CONFIGS.cashier.defaultPin },
    { role: 'recovery' as UserRole, title: ROLE_CONFIGS.recovery.title, desc: ROLE_CONFIGS.recovery.desc, defaultPin: ROLE_CONFIGS.recovery.defaultPin },
  ];

  return (
    <AuthContext.Provider value={{ currentUser, switchRole, logout, availableRoles, isAuthorized }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
