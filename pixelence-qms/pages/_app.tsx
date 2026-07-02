import type { AppProps } from "next/app";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { AuthProvider } from "@/contexts/AuthContext";
import "@/styles/globals.css";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://placeholder.convex.cloud"
);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ConvexProvider>
  );
}
