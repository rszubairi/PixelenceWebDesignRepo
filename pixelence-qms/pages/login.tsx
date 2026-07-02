import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import Head from "next/head";

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) router.replace("/dashboard");
  }, [user, isLoading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head><title>Sign in — Pixelence QMS</title></Head>
      <div className="min-h-screen flex bg-gray-50">
        {/* Left panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#1e3a8a] flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold text-lg">Q</div>
            <span className="text-white font-semibold text-lg">Pixelence QMS</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white leading-snug mb-4">
              Quality Management<br />for Medical Devices
            </h2>
            <div className="space-y-3">
              {[
                "ISO 13485:2016 compliant document control",
                "FDA 21 CFR Part 820 CAPA & audit management",
                "21 CFR Part 11 electronic signatures",
                "ISO 14971 risk register & FMEA",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <p className="text-blue-200 text-sm">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-blue-400 text-xs">
            Electronic records subject to FDA 21 CFR Part 11 &amp; EU Annex 11
          </p>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center text-white font-bold text-sm">Q</div>
              <span className="font-semibold text-gray-900">Pixelence QMS</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
            <p className="text-sm text-gray-500 mb-8">Sign in to your QMS portal</p>

            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="form-label">Email address</label>
                <input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !email || !password}
                className="btn-primary w-full mt-2 py-2.5"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Signing in…
                  </span>
                ) : "Sign in"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
