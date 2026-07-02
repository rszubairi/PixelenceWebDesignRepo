import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Layout from "@/components/layout/Layout";

interface KpiCardProps {
  label: string;
  value?: number;
  sub?: string;
  color: "red" | "orange" | "yellow" | "blue" | "gray";
}

function KpiCard({ label, value, sub, color }: KpiCardProps) {
  const s = {
    red:    "border-red-200 bg-red-50",
    orange: "border-orange-200 bg-orange-50",
    yellow: "border-yellow-200 bg-yellow-50",
    blue:   "border-blue-200 bg-blue-50",
    gray:   "border-gray-200 bg-white",
  }[color];
  const dot = {
    red: "bg-red-500", orange: "bg-orange-500", yellow: "bg-yellow-500",
    blue: "bg-blue-500", gray: "bg-gray-400",
  }[color];
  const num = {
    red: "text-red-700", orange: "text-orange-700", yellow: "text-yellow-700",
    blue: "text-blue-700", gray: "text-gray-900",
  }[color];

  return (
    <div className={`rounded-lg border ${s} p-5`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      </div>
      {value === undefined ? (
        <div className="h-9 w-12 rounded bg-gray-200 animate-pulse" />
      ) : (
        <p className={`text-3xl font-bold ${num}`}>{value}</p>
      )}
      {sub && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const capaSummary = useQuery(api.qms.capa.getSummaryStats);
  const pmsSummary  = useQuery(api.qms.pms.getSummaryStats);
  const riskSummary = useQuery(api.qms.risk.getSummaryStats);
  const auditLogs   = useQuery(api.qms.auditTrail.list, { limit: 8 });

  return (
    <Layout title="QMS Dashboard">
      <div className="space-y-8 max-w-6xl">

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Open CAPAs"
            value={capaSummary?.open}
            sub={capaSummary ? `${capaSummary.overdue ?? 0} overdue` : undefined}
            color={capaSummary?.overdue ? "red" : "orange"}
          />
          <KpiCard
            label="Open Complaints"
            value={pmsSummary?.open}
            sub={pmsSummary ? `${pmsSummary.mdrReportable ?? 0} MDR-reportable` : undefined}
            color={pmsSummary?.mdrReportable ? "red" : "yellow"}
          />
          <KpiCard
            label="High-RPN Risks"
            value={riskSummary?.highRpn}
            sub={riskSummary ? `${riskSummary.open ?? 0} total open` : undefined}
            color={riskSummary?.highRpn ? "orange" : "blue"}
          />
          <KpiCard
            label="Adverse Events"
            value={pmsSummary?.adverseEvents}
            color={pmsSummary?.adverseEvents ? "red" : "gray"}
          />
        </div>

        {/* Recent audit trail */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">Recent Activity</h2>
            <a href="/audit-trail" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              View full log →
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="table-th">Timestamp</th>
                  <th className="table-th">Action</th>
                  <th className="table-th">Module</th>
                  <th className="table-th">Record</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {auditLogs?.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-td text-gray-400 tabular-nums text-xs">
                      {new Date(log.timestamp).toLocaleString("en-GB", {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="table-td">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="table-td text-gray-500 text-xs font-mono">{log.tableName}</td>
                    <td className="table-td text-gray-400 font-mono text-xs">{String(log.recordId).slice(-10)}</td>
                  </tr>
                ))}
                {auditLogs !== undefined && !auditLogs.length && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-sm text-gray-400">
                      No activity yet — records will appear as users interact with the system.
                    </td>
                  </tr>
                )}
                {auditLogs === undefined && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-sm text-gray-300">
                      Loading…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </Layout>
  );
}
