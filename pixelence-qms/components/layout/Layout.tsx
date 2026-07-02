import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth, QmsRole } from "@/contexts/AuthContext";
import Sidebar from "./Sidebar";

interface Props {
  children: React.ReactNode;
  allowedRoles?: QmsRole[];
  title?: string;
}

export default function Layout({ children, allowedRoles, title }: Props) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, allowedRoles, router]);

  if (isLoading || !user) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {title && (
          <header className="bg-white border-b border-gray-200 px-8 py-4">
            <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
          </header>
        )}
        <div className="flex-1 p-8 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
