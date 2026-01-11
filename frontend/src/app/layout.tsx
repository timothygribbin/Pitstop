import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import React from 'react';
import Navbar from '../components/navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'PITSTOP',
    description: 'Plan and explore road trips with friends',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
return (
    <html lang="en">
        <body className={`${inter.className} bg-neutral-900 text-white`}>
        <Navbar />
        <main>{children}</main>
        </body>
    </html>
    );
}