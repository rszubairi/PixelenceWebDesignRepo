import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";

// Pixel-perfect SVG icons — consistent rendering across all OS/browsers
const Icons: Record<string, JSX.Element> = {
  dashboard:  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0"><path d="M2 4a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm9 0a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2h-3a2 2 0 01-2-2V4zM2 11a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2H4a2 2 0 01-2-2v-3zm9 0a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2h-3a2 2 0 01-2-2v-3z"/></svg>,
  documents:  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/></svg>,
  change:     <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0"><path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z"/></svg>,
  training:   <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z"/></svg>,
  trace:      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0"><path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd"/></svg>,
  risk:       <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>,
  dhf:        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0"><path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z"/><path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>,
  capa:       <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/></svg>,
  suppliers:  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0"><path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z"/><path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd"/></svg>,
  complaints: <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/></svg>,
  audits:     <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>,
  auditTrail: <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/></svg>,
  ai:         <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/></svg>,
  reporting:  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>,
};

const NAV = [
  { label: "Dashboard",        href: "/dashboard",       icon: Icons.dashboard  },
  { label: "Documents",        href: "/documents",       icon: Icons.documents  },
  { label: "Change Requests",  href: "/change-requests", icon: Icons.change     },
  { label: "Training",         href: "/training",        icon: Icons.training   },
  { label: "Traceability",     href: "/traceability",    icon: Icons.trace      },
  { label: "Risk Register",    href: "/risk",            icon: Icons.risk       },
  { label: "Design History",   href: "/dhf",             icon: Icons.dhf        },
  { label: "CAPA",             href: "/capa",            icon: Icons.capa       },
  { label: "Suppliers",        href: "/suppliers",       icon: Icons.suppliers  },
  { label: "Complaints / PMS", href: "/complaints",      icon: Icons.complaints },
  { label: "Audits",           href: "/audits",          icon: Icons.audits     },
  { label: "Audit Trail",      href: "/audit-trail",     icon: Icons.auditTrail },
  { label: "AI Copilot",       href: "/ai-copilot",      icon: Icons.ai         },
  { label: "Reporting",        href: "/reporting",       icon: Icons.reporting  },
];

const ROLE_LABEL: Record<string, string> = {
  "qms-manager":  "QMS Manager",
  "qms-director": "QMS Director",
  "qms-auditor":  "QMS Auditor",
  "qms-staff":    "QMS Staff",
  "super-admin":  "Super Admin",
};

export default function Sidebar() {
  const { pathname } = useRouter();
  const { user, logout } = useAuth();

  return (
    <aside className="w-56 flex-shrink-0 bg-[#1e3a8a] min-h-screen flex flex-col">
      {/* Brand */}
      <div className="px-4 pt-5 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            Q
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Pixelence QMS</p>
            <p className="text-blue-300 text-[10px] mt-0.5">ISO 13485 · 21 CFR 820</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-px overflow-y-auto">
        {NAV.map(({ label, href, icon }) => {
          const active = pathname === href || (href.length > 1 && pathname.startsWith(href + "/"));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-blue-200 hover:bg-blue-800/60 hover:text-white"
              }`}
            >
              <span className={active ? "text-white" : "text-blue-400"}>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      {user && (
        <div className="px-3 py-3 border-t border-white/10">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium leading-tight truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-blue-300 text-[10px] truncate">{ROLE_LABEL[user.role] ?? user.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-[11px] text-blue-300 hover:text-white transition-colors"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v8a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 1.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L10 6.586V1a1 1 0 112 0v5.586l1.293-1.293z" clipRule="evenodd"/>
            </svg>
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
