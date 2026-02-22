import '../styles/globals.css'
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { AuthProvider } from '../contexts/AuthContext';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export default function App({ Component, pageProps }) {
  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ConvexProvider>
  );
}
