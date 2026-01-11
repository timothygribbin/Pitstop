'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
// Unfinished and not used at the moment
export default function Feed() {
 return (
  <main className="min-h-screen bg-neutral-900 text-white">
   {/* Navigation Bar */}
   <nav className="flex justify-between items-center px-6 py-4 bg-neutral-800 shadow-md">
    <Link href="/" className="text-xl font-bold text-amber-300">PITSTOP</Link>
    <div className="flex items-center gap-6">
     <Link href="/trip" className="text-amber-200 hover:text-amber-100">Make a Trip</Link>
     <Link href="/feed" className="text-amber-200 hover:text-amber-100">Feed</Link>
     <Link href="/profile" className="flex items-center gap-2 text-amber-200 hover:text-amber-100">
      <div className="w-8 h-8 relative rounded-full overflow-hidden border-2 border-amber-400">
       <Image src="/default-profile.png" alt="Profile" layout="fill" objectFit="cover" />
      </div>
      <span className="hidden sm:inline">Profile</span>
     </Link>
    </div>
   </nav>

   <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
    <h1 className="text-3xl font-bold text-amber-200 mb-6 text-center">Trip Feed</h1>

    {/* Trip Post Example */}
    {[1, 2].map((tripId) => (
     <div key={tripId} className="bg-neutral-800 p-6 rounded-xl shadow space-y-4">
      <div className="flex items-center gap-4">
       <div className="w-12 h-12 relative rounded-full overflow-hidden border-2 border-amber-400">
        <Image src="/default-profile.png" alt="User" layout="fill" objectFit="cover" />
       </div>
       <div>
        <p className="text-amber-200 font-semibold">TJ Gribbin</p>
        <p className="text-amber-100 text-sm">Posted on March 24, 2025</p>
       </div>
      </div>

      <div>
       <h2 className="text-xl font-semibold text-amber-200">Spring Break to Nashville</h2>
       <p className="text-amber-100">Driving from NYC to Nashville, planning some cool stops on the way. Hit me up if you want to join!</p>
      </div>

      <div className="flex items-center justify-between">
       <div className="flex items-center gap-6">
        <button className="hover:text-amber-300 transition">❤️ 23</button>
        <button className="hover:text-amber-300 transition">💬 5</button>
       </div>
       <Link href="/trip" className="text-sm text-amber-300 hover:underline">View Trip</Link>
      </div>
     </div>
    ))}
   </div>
  </main>
 );
}