import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_BADGE: Record<string, string> = {
  open: "badge-open",
  approved: "badge-effective",
  executed: "badge-closed",
  rejected: "badge-draft",
};

export default function ChangeRequestsPage() {
  const { user } = useAuth();
  const crs = useQuery(api.qms.changeRequests.list, {});
  const createCr = useMutation(api.qms.changeRequests.create);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ crNumber: "", title: "", description: "", impactAssessment: "" });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await createCr({ ...form, createdById: user._id as any });
    setShowCreate(false);
    setForm({ crNumber: "", title: "", description: "", impactAssessment: "" });
  };

  return (
    <Layout title="Change Requests">
      <div className="space-y-6">
        <div className="flex justify-end">
          {(user?.role === "qms-manager" || user?.role === "qms-director" || user?.role === "super-admin") && (
            <button className="btn-primary" onClick={() => setShowCreate(true)}>+ New Change Request</button>
          )}
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Open Change Request</h3>
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">CR Number</label>
                    <input className="form-input" required placeholder="CR-2026-001" value={form.crNumber} onChange={set("crNumber")} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Title</label>
                  <input className="form-input" required value={form.title} onChange={set("title")} />
                </div>
                <div>
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows={3} required value={form.description} onChange={set("description")} />
                </div>
                <div>
                  <label className="form-label">Impact Assessment</label>
                  <textarea className="form-input" rows={2} required value={form.impactAssessment} onChange={set("impactAssessment")} />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Open CR</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="card p-0 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="table-th">CR #</th>
                <th className="table-th">Title</th>
                <th className="table-th">Description</th>
                <th className="table-th">Status</th>
                <th className="table-th">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {crs?.map((cr) => (
                <tr key={cr._id} className="hover:bg-gray-50">
                  <td className="table-td font-mono text-brand-700">{cr.crNumber}</td>
                  <td className="table-td font-medium">{cr.title}</td>
                  <td className="table-td max-w-xs truncate text-gray-500">{cr.description}</td>
                  <td className="table-td"><span className={STATUS_BADGE[cr.status] ?? "badge-draft"}>{cr.status}</span></td>
                  <td className="table-td text-gray-400">{new Date(cr.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {!crs?.length && (
                <tr><td colSpan={5} className="table-td text-center text-gray-400 py-8">No change requests</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
