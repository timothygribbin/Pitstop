'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../../backend/src/utils/firebaseclient';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  // Store the form state in react state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Show password toggle 
  const [showPassword, setShowPassword] = useState(false);
  // Error message if there is one
  const [error, setError] = useState('');
  // This will run when the login form is submitted
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Ensure email and password have been filled out 
    if (!email || !password) {
      setError('Please fill out both fields.');
      return;
    }

    try {
    // Attempt to sign in with the firebase which will return with a user session  
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Redirect to the home page once signed in
      router.push('/');
    } catch (err: any) {
      console.error('Login error:', err.message);
      setError('Invalid email or password.');
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 px-4">
      {/* Card wrapper */}
      <div className="w-full max-w-md bg-neutral-800 p-8 rounded-2xl shadow-lg">
        {/* Title */}
        <h1 className="text-3xl font-bold text-amber-200 mb-6 text-center">Sign In to PITSTOP</h1>
        {/* Form that will trigger handle login on submit*/}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email input */}
          <div>
            <label htmlFor="email" className="block text-sm text-amber-100 mb-1">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-zinc-800 text-white border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="you@example.com"
            />
          </div>
          {/* Password input + show/hide toggle */}
          <div className="relative">
            <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full px-4 py-2 pr-12 rounded-md bg-zinc-800 text-white border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="••••••••"
            />
            {/* Button that toggles password visibility */}
            <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-amber-300 hover:underline"
            >
                {showPassword ? 'Hide' : 'Show'}
            </button>
            </div>
            {/* Error message, only shown if error is non empty */}
          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
           {/* Submit button */}
          <button type="submit" className="w-full bg-amber-400 hover:bg-amber-300 text-black py-2 px-4 rounded-md font-semibold transition-colors">
            Sign In
          </button>
        </form>
        {/* Link to signup page */}
        <p className="text-sm text-amber-200 mt-4 text-center">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-amber-300 hover:underline">
            Sign up here
          </Link>
        </p>
      </div>
    </main>
  );
}