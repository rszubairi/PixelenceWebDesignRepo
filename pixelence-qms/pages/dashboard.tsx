import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Layout from "@/components/layout/Layout";

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const capaSummary = useQuery(api.qms.capa.getSummaryStats);
  const pmsSummary = useQuery(api.qms.pms.getSummaryStats);
  const riskSummary = useQuery(api.qms.risk.getSummaryStats);
  const recentAuditLogs = useQuery(api.qms.auditTrail.list, { limit: 8 });

  return (
    <Layout title="QMS Dashboard">
      <div className="space-y-8">
        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Open CAPAs" value={capaSummary?.open ?? "—"} sub={`${capaSummary?.overdue ?? 0} overdue`} />
          <StatCard label="Open Complaints" value={pmsSummary?.open ?? "—"} sub={`${pmsSummary?.mdrReportable ?? 0} MDR-reportable`} />
          <StatCard label="High-RPN Risks" value={riskSummary?.highRpn ?? "—"} sub={`${riskSummary?.open ?? 0} open`} />
          <StatCard label="Adverse Events" value={pmsSummary?.adverseEvents ?? "—"} />
        </div>

        {/* Recent audit trail */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Recent Activity (Audit Trail)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="table-th">Timestamp</th>
                  <th className="table-th">User</th>
                  <th className="table-th">Action</th>
                  <th className="table-th">Table</th>
                  <th className="table-th">Record</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentAuditLogs?.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="table-td text-gray-400">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="table-td font-mono text-xs">{String(log.userId).slice(-8)}</td>
                    <td className="table-td">
                      <span className="font-medium text-brand-700">{log.action}</span>
                    </td>
                    <td className="table-td text-gray-500">{log.tableName}</td>
                    <td className="table-td font-mono text-xs">{String(log.recordId).slice(-8)}</td>
                  </tr>
                ))}
                {!recentAuditLogs?.length && (
                  <tr>
                    <td colSpan={5} className="table-td text-center text-gray-400 py-6">No audit events yet</td>
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
