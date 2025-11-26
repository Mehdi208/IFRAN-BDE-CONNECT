import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Pour le mode développement sans Firebase, on regarde le localStorage
  const [isLocalAdmin, setIsLocalAdmin] = useState(localStorage.getItem('isAuthenticated') === 'true');

  useEffect(() => {
    if (auth) {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
        });
        return unsubscribe;
    } else {
        // Mode Mock
        setLoading(false);
    }
  }, []);

  const logout = async () => {
    if (auth) {
        await firebaseSignOut(auth);
    }
    localStorage.removeItem('isAuthenticated');
    setIsLocalAdmin(false);
    setUser(null);
  };

  const isAdmin = !!user || isLocalAdmin;

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};