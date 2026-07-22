import '../styles/globals.css'
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { AuthProvider } from '../contexts/AuthContext';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl && typeof window !== 'undefined') {
  console.warn("⚠️ NEXT_PUBLIC_CONVEX_URL is missing. Please check your Vercel environment variables.");
}

const convex = new ConvexReactClient(convexUrl || 'https://placeholder.convex.cloud');

export default function App({ Component, pageProps }) {
  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ConvexProvider>
  );
}
