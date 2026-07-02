import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Layout from "@/components/layout/Layout";

export default function AuditTrailPage() {
  const logs = useQuery(api.qms.auditTrail.list, { limit: 200 });

  return (
    <Layout title="Immutable Audit Trail — 21 CFR §11.10(e)">
      <div className="space-y-4">
        <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
          This log is <strong>strictly append-only</strong>. No edits or deletions are permitted by any system actor.
          All QMS write operations are recorded here automatically.
        </div>

        <div className="card p-0 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="table-th">Timestamp (UTC)</th>
                <th className="table-th">User ID</th>
                <th className="table-th">Action</th>
                <th className="table-th">Table</th>
                <th className="table-th">Record ID</th>
                <th className="table-th">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {logs?.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50 font-mono">
                  <td className="table-td text-gray-500">{log.timestamp}</td>
                  <td className="table-td">{String(log.userId).slice(-12)}</td>
                  <td className="table-td font-semibold text-brand-700">{log.action}</td>
                  <td className="table-td text-gray-600">{log.tableName}</td>
                  <td className="table-td text-gray-500">{String(log.recordId).slice(-12)}</td>
                  <td className="table-td text-gray-400">{log.ipAddress}</td>
                </tr>
              ))}
              {!logs?.length && (
                <tr><td colSpan={6} className="table-td text-center text-gray-400 py-8">No audit events recorded</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
