import '../styles/globals.css'
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { AuthProvider } from '../contexts/AuthContext';

// IMPORTANT: Set NEXT_PUBLIC_CONVEX_URL in Amplify Console environment variables
// Get your Convex deployment URL from the Convex dashboard
// 
// For build/deploy to work, you MUST set this environment variable in:
// AWS Amplify Console → Your App → App settings → Environment variables

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://mock-deployment.convex.cloud';

// Singleton pattern for Convex client
let convexClient = null;

function getConvexClient() {
  if (!convexClient) {
    convexClient = new ConvexReactClient(CONVEX_URL, {
      unsavedChangesWarning: false,
    });
  }
  return convexClient;
}

export default function App({ Component, pageProps }) {
  return (
    <ConvexProvider client={getConvexClient()}>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ConvexProvider>
  );
}