'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/admin/dashboard';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(redirect);
        router.refresh();
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-[#CF2A27]/10 text-[#CF2A27] px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-[#1A1A1A] mb-2">
          Username
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-[#E5E5E5] focus:border-[#FFD100] focus:ring-1 focus:ring-[#FFD100] outline-none"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-[#1A1A1A] mb-2">
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-[#E5E5E5] focus:border-[#FFD100] focus:ring-1 focus:ring-[#FFD100] outline-none"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#1A1A1A] text-white py-3 rounded-lg font-semibold hover:bg-[#1A1A1A]/90 transition-colors disabled:opacity-50"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#FFD100] rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-[#1A1A1A] font-bold text-2xl">TF</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Admin Dashboard</h1>
          <p className="text-[#4A4A4A] mt-1">Sign in to access analytics</p>
        </div>

        <Suspense fallback={<div className="h-48 animate-pulse bg-[#F8F8F8] rounded-lg" />}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-[#4A4A4A] text-xs mt-8">
          Internal use only. Unauthorized access prohibited.
        </p>
      </div>
    </div>
  );
}
