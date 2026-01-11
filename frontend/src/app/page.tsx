'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../backend/src/utils/firebaseclient';
import { useRouter } from 'next/navigation';
// Landing page
export default function Home() {
    // State for loading and current user
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();
    // Auth listener that changes when the user changes (login or out)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
        setIsLoading(false);
    });
    return () => unsubscribe();
}, []);
    // If the page is loading show a loading screen
    if (isLoading) {
    return (
    <main className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
        <p className="text-amber-300 text-lg">Loading...</p>
    </main>
    );
}
// 
return (
    // Landing page header
    <main className="font-sans bg-neutral-900 text-white min-h-screen">
    <section className="flex flex-col justify-center items-center bg-zinc-800 text-center py-20 px-4">
    <h1 className="text-5xl font-extrabold text-amber-200 mb-4">PITSTOP</h1>
    <p className="text-2xl text-amber-100 mb-6">Your Ultimate Road Trip Planner</p>
    {user ? (
        <Link href="/create-trip">
        <button className="bg-amber-400 text-black px-8 py-3 rounded-full text-lg shadow hover:bg-amber-300 transition-colors">
        Create Trip
        </button>
        </Link>
    ) : (
        <Link href="/login">
        <button className="bg-amber-400 text-black px-8 py-3 rounded-full text-lg shadow hover:bg-amber-300 transition-colors">
        Get Started
        </button>
        </Link>
    )}
    </section>

   {/* Features Section */}
    <section id="features" className="py-16 px-4 bg-neutral-900">
    <h2 className="text-3xl font-bold text-center text-amber-200 mb-10">What We Do</h2>
    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
        ["Plan Your Road Trips Better", "Detail every aspect of your journey with ease."],
        ["Invite Friends", "Collaborate with your crew and plan together."],
        ["Vote on Stops & Music", "Everyone can contribute ideas for stops and tunes."],
        ["Track Expenses", "Stay on budget with our expense tracking tools."],
        ["Suggest Stops", "Discover hidden gems along your route."],
        ["And More...", "We continuously add new features to enhance your trips."]
        ].map(([title, desc], idx) => (
        <div key={idx} className="p-6 bg-neutral-800 rounded-2xl shadow hover:shadow-lg transition-all">
        <h3 className="text-xl font-semibold text-amber-200 mb-2">{title}</h3>
        <p className="text-amber-100">{desc}</p>
        </div>
        ))}
    </div>
    </section>

    <section className="bg-zinc-800 py-16 px-4 text-center">
    <h2 className="text-3xl font-bold text-amber-200 mb-4">Ready to hit the road?</h2>
    <p className="text-xl text-amber-100 mb-8">Join PITSTOP and start planning your next adventure.</p>
    <Link href="/signup">
        <button className="bg-amber-400 text-black px-8 py-3 rounded-full text-lg shadow hover:bg-amber-300 transition-colors">
        Join Now
        </button>
    </Link>
    </section>

    <footer className="bg-neutral-800 py-6 text-center">
    <p className="text-amber-300 text-sm">
    &copy; {new Date().getFullYear()} PITSTOP. All rights reserved.
    </p>
    </footer>
    </main>
    );
}