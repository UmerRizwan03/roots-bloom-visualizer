import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mail, Lock, UserPlus, LogIn } from 'lucide-react'; // Using LogIn for generic login icon

const SignUpForm: React.FC<{ onSignUpSuccess?: () => void }> = ({ onSignUpSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
    } else {
      setMessage("Sign up successful! Please check your email to confirm your account.");
      // If you want to automatically log in or redirect after sign up (and email confirmation is disabled/handled)
      // if (onSignUpSuccess) onSignUpSuccess();
    }
    setLoading(false);
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin, // Or a specific callback page
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // Supabase handles redirection for OAuth
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-slate-800 rounded-lg shadow-xl">
      <h2 className="text-2xl font-semibold text-center text-gray-800 dark:text-white mb-6">Create Account</h2>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {message && (
        <Alert variant="default" className="mb-4">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <Label htmlFor="email-signup" className="text-gray-700 dark:text-gray-300">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="email-signup"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="pl-10"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="password-signup" className="text-gray-700 dark:text-gray-300">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="password-signup"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••• (min. 6 characters)"
              required
              className="pl-10"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="confirm-password-signup" className="text-gray-700 dark:text-gray-300">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="confirm-password-signup"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="pl-10"
            />
          </div>
        </div>
        <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
          <UserPlus className="mr-2 h-4 w-4" />
          {loading ? 'Creating Account...' : 'Create Account with Email'}
        </Button>
      </form>
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400">
            Or sign up with
          </span>
        </div>
      </div>
      <Button
        variant="outline"
        onClick={handleGoogleSignUp}
        disabled={loading}
        className="w-full"
      >
        <LogIn className="mr-2 h-4 w-4" /> {/* Using LogIn as a generic icon, replace if a Google icon is available */}
        Sign up with Google
      </Button>
    </div>
  );
};

export default SignUpForm;
