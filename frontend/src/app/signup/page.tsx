'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../../../../backend/src/utils/firebaseclient';
import { useRouter } from 'next/navigation';


export default function Signup() {
  const router = useRouter();
    // Controlled input state for form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Toggles password visibility
  const [showPassword, setShowPassword] = useState(false);
  // Error states
  const [error, setError] = useState('');
  // Successful signup pop up state
  const [successPopup, setSuccessPopup] = useState(false);
  // Form submit handler
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    // Clear the previos errors
    setError('');
    // Ensure that email and password are both filled out
    if (!email || !password) {
      setError('Please fill out both fields.');
      return;
    }
    // Create the account in the firebase auth system
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Save the user info in the SQL DB as well, needs some work, this is probably prone to breaking
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
        }),
      });
      // If the backend sign up fails log it, may have to check if firebase account was made 
      if (!response.ok) {
        console.error('Failed to save user:', await response.text());
      }
      // Sign them out and send them to the homepage, will add email verification at some point here before logging back in.
      await signOut(auth);
      // Show success popup
      setSuccessPopup(true);
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: any) {
      console.error('Signup error:', err.message);
      setError('Error creating account. Please try again.');
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 px-4 relative">
      {/* Success Popup */}
      {successPopup && (
        <div className="absolute top-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce z-50">
           Account created successfully! Please log in.
        </div>
      )}
      {/* Card container */}
      <div className="w-full max-w-md bg-neutral-800 p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-amber-200 mb-6 text-center">Create Account</h1>
        <form onSubmit={handleSignup} className="space-y-4">
          {/* Email */}
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

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm text-amber-100 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 pr-10 rounded-md bg-zinc-800 text-white border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-amber-300 hover:text-amber-400"
                >
                {showPassword ? 'Hide' : 'Show'}
            </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          {/* Submit */}
          <button type="submit" className="w-full bg-amber-400 hover:bg-amber-300 text-black py-2 px-4 rounded-md font-semibold transition-colors">
            Sign Up
          </button>
        </form>

        <p className="text-sm text-amber-200 mt-4 text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-amber-300 hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </main>
  );
}