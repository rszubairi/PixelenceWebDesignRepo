import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Layout from "@/components/layout/Layout";

const TYPE_COLOR: Record<string, string> = {
  prd: "bg-purple-100 text-purple-800",
  srs: "bg-blue-100 text-blue-800",
  "software-spec": "bg-indigo-100 text-indigo-800",
};

export default function TraceabilityPage() {
  const matrix = useQuery(api.qms.traceability.checkTraceMatrix);

  const orphans = matrix?.filter((r) => r.isOrphan) ?? [];

  return (
    <Layout title="Requirements & Traceability Matrix">
      <div className="space-y-6">
        {orphans.length > 0 && (
          <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
            <p className="text-sm font-semibold text-yellow-800">
              {orphans.length} orphaned requirement{orphans.length > 1 ? "s" : ""} detected
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              These requirements have no verification reference and no traceability links. Review required for IEC 62304 compliance.
            </p>
            <ul className="mt-2 space-y-0.5">
              {orphans.map((r) => (
                <li key={r._id} className="text-xs text-yellow-800 font-mono">{r.reqNumber} — {r.title}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="card p-0 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="table-th">Req #</th>
                <th className="table-th">Title</th>
                <th className="table-th">Type</th>
                <th className="table-th">Source</th>
                <th className="table-th">Linked To</th>
                <th className="table-th">Test Ref</th>
                <th className="table-th">Orphan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {matrix?.map((r) => (
                <tr key={r._id} className={`hover:bg-gray-50 ${r.isOrphan ? "bg-yellow-50" : ""}`}>
                  <td className="table-td font-mono text-brand-700">{r.reqNumber}</td>
                  <td className="table-td font-medium">{r.title}</td>
                  <td className="table-td">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLOR[r.type] ?? "bg-gray-100 text-gray-700"}`}>{r.type}</span>
                  </td>
                  <td className="table-td text-gray-500 text-xs">{r.source}</td>
                  <td className="table-td text-gray-500 text-xs">{r.linkedTo.length > 0 ? `${r.linkedTo.length} link(s)` : <span className="text-yellow-600">None</span>}</td>
                  <td className="table-td text-xs">{r.verificationRef ?? <span className="text-yellow-600">Missing</span>}</td>
                  <td className="table-td">{r.isOrphan ? <span className="text-red-600 font-semibold">Yes</span> : "—"}</td>
                </tr>
              ))}
              {!matrix?.length && (
                <tr><td colSpan={7} className="table-td text-center text-gray-400 py-8">No requirements entered</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
