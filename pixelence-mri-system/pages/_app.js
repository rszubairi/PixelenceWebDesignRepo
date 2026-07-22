import '../styles/globals.css'
import { useState } from 'react';
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { AuthProvider } from '../contexts/AuthContext';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl && typeof window !== 'undefined') {
  console.warn("⚠️ NEXT_PUBLIC_CONVEX_URL is missing. Please check your Vercel environment variables.");
}

export default function App({ Component, pageProps }) {
  const [convex] = useState(() =>
    typeof window !== 'undefined'
      ? new ConvexReactClient(convexUrl || 'https://placeholder.convex.cloud')
      : null
  );

  if (!convex) return null;

  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ConvexProvider>
  );
}
