import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";

const NAV = [
  { label: "Dashboard",       href: "/dashboard",              icon: "⊞" },
  { label: "Documents",       href: "/documents",              icon: "📄" },
  { label: "Change Requests", href: "/change-requests",        icon: "↺" },
  { label: "Training",        href: "/training",               icon: "🎓" },
  { label: "Traceability",    href: "/traceability",           icon: "🔗" },
  { label: "Risk Register",   href: "/risk",                   icon: "⚠" },
  { label: "Design History",  href: "/dhf",                    icon: "📐" },
  { label: "CAPA",            href: "/capa",                   icon: "🔧" },
  { label: "Suppliers",       href: "/suppliers",              icon: "🏭" },
  { label: "Complaints / PMS",href: "/complaints",             icon: "📣" },
  { label: "Audits",          href: "/audits",                 icon: "🔍" },
  { label: "Audit Trail",     href: "/audit-trail",            icon: "📋" },
  { label: "AI Copilot",      href: "/ai-copilot",             icon: "🤖" },
  { label: "Reporting",       href: "/reporting",              icon: "📊" },
];

export default function Sidebar() {
  const { pathname } = useRouter();
  const { user, logout } = useAuth();

  return (
    <aside className="w-60 flex-shrink-0 bg-brand-900 min-h-screen flex flex-col">
      <div className="px-5 py-5 border-b border-brand-700">
        <p className="text-white font-bold text-base leading-tight">Pixelence QMS</p>
        <p className="text-brand-100 text-xs mt-0.5">ISO 13485 · 21 CFR 820</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ label, href, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-brand-600 text-white font-medium"
                  : "text-brand-100 hover:bg-brand-700 hover:text-white"
              }`}
            >
              <span className="text-base w-5 text-center">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="px-4 py-4 border-t border-brand-700">
          <p className="text-brand-100 text-xs font-medium truncate">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-brand-300 text-xs truncate">{user.role}</p>
          <button
            onClick={logout}
            className="mt-2 text-xs text-brand-300 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
