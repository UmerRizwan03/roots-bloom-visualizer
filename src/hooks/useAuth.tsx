import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient'; // Adjusted path

// Replace with your actual admin email
const ADMIN_EMAIL = 'memelove@techie.com'; // TODO: Move to environment variable

interface AuthState {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
}

export const useAuth = (): AuthState => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: sessionData, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error fetching session:', error);
          setLoading(false);
          return;
        }

        setSession(sessionData.session);
        setUser(sessionData.session?.user ?? null);
        setIsAdmin(sessionData.session?.user?.email === ADMIN_EMAIL);
      } catch (e) {
        console.error('Exception fetching session:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsAdmin(newSession?.user?.email === ADMIN_EMAIL);
      // Set loading to false once auth state is confirmed,
      // even if it was already false from getSession.
      // This handles cases like logout then login.
      if (loading) setLoading(false); 
    });

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [loading]); // Added loading to dependency array to ensure setLoading(false) is respected after initial load

  return { session, user, isAdmin, loading };
};
