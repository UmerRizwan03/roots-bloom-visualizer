import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

// Define the shape of the context state
interface AuthState {
  currentMode: 'view' | 'edit' | 'admin';
  user: User | null;
  session: Session | null; // Store session as well
  isFamilyCodeVerified: boolean;
  isLoadingAuth: boolean;
  familyCodeError: string | null;
  adminLoginError: string | null;
  verifyFamilyCode: (code: string) => Promise<boolean>;
  setMode: (mode: 'view' | 'edit') => void;
  adminLogin: (email, password) => Promise<void>;
  adminLogout: () => Promise<void>;
  clearFamilyCodeVerification: () => void;
}

// Create the context with an undefined initial value to prevent direct usage without a Provider
const AuthContext = createContext<AuthState | undefined>(undefined);

// Environment variables - assume they are set in .env
const VITE_FAMILY_CODE = import.meta.env.VITE_FAMILY_CODE;
const VITE_ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentMode, setCurrentMode] = useState<'view' | 'edit' | 'admin'>('view');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isFamilyCodeVerified, setIsFamilyCodeVerified] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('isFamilyCodeVerified') === 'true';
    }
    return false;
  });
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [familyCodeError, setFamilyCodeError] = useState<string | null>(null);
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);

  // Check initial auth state and listen for changes
  useEffect(() => {
    setIsLoadingAuth(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user && session.user.email === VITE_ADMIN_EMAIL) {
        setCurrentMode('admin');
      } else if (isFamilyCodeVerified) {
        // If not admin but family code was previously verified, set to edit mode
        setCurrentMode('edit');
      } else {
        setCurrentMode('view');
      }
      setIsLoadingAuth(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user && session.user.email === VITE_ADMIN_EMAIL) {
          setCurrentMode('admin');
          setIsFamilyCodeVerified(true); // Admins automatically bypass family code
          if (typeof window !== 'undefined') {
            localStorage.setItem('isFamilyCodeVerified', 'true'); // Also set this for consistency
          }
        } else {
          // If user logs out or changes, and is not the admin
          // Re-evaluate mode based on family code verification
          if (isFamilyCodeVerified && currentMode !== 'admin') {
             // If family code is verified and we are not demoting an admin, stay/go to edit mode
            setCurrentMode('edit');
          } else if (currentMode === 'admin') { // Admin logged out
            clearFamilyCodeVerification(); // Clear verification when admin logs out
            setCurrentMode('view');
          } else {
            // For non-admin, if family code isn't verified, go to view
            setCurrentMode(isFamilyCodeVerified ? 'edit' : 'view');
          }
        }
        setIsLoadingAuth(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [isFamilyCodeVerified]); // Add isFamilyCodeVerified to dependencies

  const verifyFamilyCode = useCallback(async (code: string) => {
    setFamilyCodeError(null);
    if (code === VITE_FAMILY_CODE) {
      setIsFamilyCodeVerified(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('isFamilyCodeVerified', 'true');
      }
      // If not admin, set mode to edit. Admin mode is handled by auth state change.
      if (currentMode !== 'admin') {
        setCurrentMode('edit');
      }
      return true;
    } else {
      setFamilyCodeError('Invalid Family Code.');
      setIsFamilyCodeVerified(false);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('isFamilyCodeVerified');
      }
      // If code is wrong, and user is not admin, revert to view mode
      if (currentMode !== 'admin') {
        setCurrentMode('view');
      }
      return false;
    }
  }, [currentMode]);

  const setMode = useCallback((newMode: 'view' | 'edit') => {
    if (currentMode === 'admin') return; // Admin mode is sticky until logout

    if (newMode === 'edit') {
      if (isFamilyCodeVerified) {
        setCurrentMode('edit');
      } else {
        // Optionally, trigger family code modal here or let UI handle it
        console.warn("Attempted to switch to edit mode without family code verification.");
        setCurrentMode('view'); // Fallback to view if not verified
      }
    } else {
      setCurrentMode('view');
      // Optionally, clear family code verification when explicitly switching to view mode
      // clearFamilyCodeVerification(); // Decided against this to allow easy toggle back if desired
    }
  }, [isFamilyCodeVerified, currentMode]);

  const adminLogin = useCallback(async (email, password) => {
    setAdminLoginError(null);
    setIsLoadingAuth(true);
    try {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user && data.user.email !== VITE_ADMIN_EMAIL) {
        await supabase.auth.signOut(); // Sign out if not the designated admin
        throw new Error('Login successful, but you are not authorized as an admin.');
      }
      // onAuthStateChange will handle setting user, session, and mode
    } catch (error: any) {
      console.error('Admin login error:', error);
      setAdminLoginError(error.message || 'Failed to login as admin.');
      setUser(null);
      setSession(null);
      setCurrentMode('view'); // Revert to view mode on failed admin login
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  const adminLogout = useCallback(async () => {
    setIsLoadingAuth(true);
    setAdminLoginError(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Admin logout error:', error);
      setAdminLoginError(error.message || 'Failed to logout.');
    }
    // onAuthStateChange will reset user, session.
    // Explicitly clear family code verification and set mode to view for logged out admin
    clearFamilyCodeVerification();
    setCurrentMode('view');
    setIsLoadingAuth(false);
  }, []);

  const clearFamilyCodeVerification = useCallback(() => {
    setIsFamilyCodeVerified(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isFamilyCodeVerified');
    }
    // If not admin, revert to view mode when family code is cleared
    if (currentMode !== 'admin') {
      setCurrentMode('view');
    }
  }, [currentMode]);

  return (
    <AuthContext.Provider
      value={{
        currentMode,
        user,
        session,
        isFamilyCodeVerified,
        isLoadingAuth,
        familyCodeError,
        adminLoginError,
        verifyFamilyCode,
        setMode,
        adminLogin,
        adminLogout,
        clearFamilyCodeVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Update src/App.tsx to include AuthProvider
// This will be done in a separate subtask to keep this one focused.
