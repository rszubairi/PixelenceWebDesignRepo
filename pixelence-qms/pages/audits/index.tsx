import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_BADGE: Record<string, string> = {
  scheduled: "badge-draft",
  "in-progress": "badge-review",
  completed: "badge-effective",
};

export default function AuditsPage() {
  const { user } = useAuth();
  const audits = useQuery(api.qms.audit.list, {});
  const createAudit = useMutation(api.qms.audit.create);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    auditNumber: "", type: "internal" as const, scope: "", leadAuditor: "", targetDate: "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await createAudit({ ...form, createdById: user._id as any });
    setShowCreate(false);
    setForm({ auditNumber: "", type: "internal", scope: "", leadAuditor: "", targetDate: "" });
  };

  return (
    <Layout title="Audits & Management Review">
      <div className="space-y-6">
        <div className="flex justify-end">
          {(user?.role === "qms-manager" || user?.role === "qms-director" || user?.role === "super-admin") && (
            <button className="btn-primary" onClick={() => setShowCreate(true)}>+ Schedule Audit</button>
          )}
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Schedule Audit</h3>
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Audit Number</label>
                    <input className="form-input" required placeholder="AUD-2026-001" value={form.auditNumber} onChange={set("auditNumber")} />
                  </div>
                  <div>
                    <label className="form-label">Type</label>
                    <select className="form-input" value={form.type} onChange={set("type")}>
                      <option value="internal">Internal</option>
                      <option value="external">External</option>
                      <option value="supplier">Supplier</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label">Scope</label>
                  <input className="form-input" required value={form.scope} onChange={set("scope")} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Lead Auditor</label>
                    <input className="form-input" required value={form.leadAuditor} onChange={set("leadAuditor")} />
                  </div>
                  <div>
                    <label className="form-label">Target Date</label>
                    <input className="form-input" type="date" required value={form.targetDate} onChange={set("targetDate")} />
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Schedule</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="card p-0 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="table-th">Audit #</th>
                <th className="table-th">Type</th>
                <th className="table-th">Scope</th>
                <th className="table-th">Lead Auditor</th>
                <th className="table-th">Target Date</th>
                <th className="table-th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {audits?.map((a) => (
                <tr key={a._id} className="hover:bg-gray-50">
                  <td className="table-td font-mono text-brand-700">{a.auditNumber}</td>
                  <td className="table-td capitalize text-gray-500">{a.type}</td>
                  <td className="table-td max-w-xs truncate">{a.scope}</td>
                  <td className="table-td">{a.leadAuditor}</td>
                  <td className="table-td text-gray-500">{new Date(a.targetDate).toLocaleDateString()}</td>
                  <td className="table-td"><span className={STATUS_BADGE[a.status] ?? "badge-draft"}>{a.status}</span></td>
                </tr>
              ))}
              {!audits?.length && (
                <tr><td colSpan={6} className="table-td text-center text-gray-400 py-8">No audits scheduled</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
