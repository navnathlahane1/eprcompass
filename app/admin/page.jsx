
"use client";
import { supabase } from '../../lib/supabaseClient';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function mapAuthErrorMessage(message) {
  const normalized = String(message || '').toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    return 'Incorrect email or password. If this is your first login, create the user in Supabase Authentication first.';
  }

  if (normalized.includes('email not confirmed')) {
    return 'Your email is not confirmed yet. Please check your inbox for the confirmation link.';
  }

  return message || 'Unable to login right now.';
}

function persistAccessTokenCookie(accessToken, expiresInSeconds) {
  if (!accessToken || typeof document === 'undefined') return;

  const maxAge = Number(expiresInSeconds || 3600);
  document.cookie = `sb-access-token=${encodeURIComponent(accessToken)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}


export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  // Check if already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          persistAccessTokenCookie(session.access_token, session.expires_in || 3600);
          setIsLoggedIn(true);
          router.push('/admin/dashboard');
        }
      } catch (err) {
        console.error('Auth check error:', err);
      }
    };
    checkAuthStatus();
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ 
        email: email.trim().toLowerCase(), 
        password
      });

      if (authError) {
        setError(mapAuthErrorMessage(authError.message));
      } else if (data?.user || data?.session?.user) {
        persistAccessTokenCookie(data?.session?.access_token, data?.session?.expires_in || 3600);
        setIsLoggedIn(true);
        router.push('/admin/dashboard');
      } else {
        setError('Unknown error. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please check your credentials and try again.');
    }
    setLoading(false);
  };

  if (isLoggedIn) return <div className="flex items-center justify-center min-h-screen">Redirecting...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="w-full max-w-md">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mb-6 text-sm">Access restricted area. Login required.</p>
          
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full mb-4 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full mb-4 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          
          {error && (
            <div className="bg-rose-950/40 border border-rose-700/50 text-rose-300 px-4 py-3 rounded-lg mb-4 text-sm">
              ⚠️ {error}
            </div>
          )}
          
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-xs text-gray-600">
            <p className="font-semibold mb-1">First time?</p>
            <p>Create an admin user in your Supabase dashboard under Authentication → Users.</p>
          </div>
        </form>
      </div>
    </div>
  );
}
