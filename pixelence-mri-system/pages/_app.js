import '../styles/globals.css'
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { AuthProvider } from '../contexts/AuthContext';
import { useState } from 'react';

export default function App({ Component, pageProps }) {
  const [convex] = useState(() =>
    typeof window !== 'undefined'
      ? new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL)
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
