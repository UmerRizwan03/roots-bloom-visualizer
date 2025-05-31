import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, KeyRound } from 'lucide-react'; // Icons

const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { adminLogin, adminLoginError, isLoadingAuth, user, currentMode } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already logged in as admin, redirect to home or admin dashboard
    if (user && currentMode === 'admin') {
      navigate('/'); // Or to a dedicated admin dashboard if it exists
    }
  }, [user, currentMode, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      // Basic validation, AuthContext might have more specific errors
      alert("Please enter both email and password.");
      return;
    }
    await adminLogin(email, password);
    // Navigation on success is handled by the useEffect hook in AuthContext or here
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-gray-50 to-slate-200 dark:from-slate-900 dark:via-gray-800 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md shadow-xl dark:bg-slate-800">
        <CardHeader className="text-center">
          <KeyRound className="mx-auto h-12 w-12 text-emerald-600 dark:text-emerald-400 mb-4" />
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <CardDescription>Access the admin panel to manage the application.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoadingAuth}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoadingAuth}
              />
            </div>
            {adminLoginError && (
              <Alert variant="destructive">
                <AlertDescription>{adminLoginError}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isLoadingAuth}>
              {isLoadingAuth ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Login
            </Button>
          </form>
          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">
              &larr; Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLoginPage;
