import '../styles/globals.css'
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { AuthProvider } from '../contexts/AuthContext';

// Provide a fallback URL during build time to allow builds to complete
// In production, the actual URL will be provided via environment variables
const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL || 'https://placeholder.convex.cloud'
);

export default function App({ Component, pageProps }) {
  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ConvexProvider>
  );
}
