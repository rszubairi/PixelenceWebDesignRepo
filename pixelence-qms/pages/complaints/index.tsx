import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_BADGE: Record<string, string> = {
  received: "badge-draft",
  investigating: "badge-review",
  "capa-raised": "badge-open",
  resolved: "badge-effective",
};

export default function ComplaintsPage() {
  const { user } = useAuth();
  const complaints = useQuery(api.qms.pms.list, {});
  const summary = useQuery(api.qms.pms.getSummaryStats);
  const createComplaint = useMutation(api.qms.pms.create);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    complaintNumber: "", customerName: "", customerEmail: "",
    description: "", adverseEvent: false, seriousInjury: false,
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await createComplaint({ ...form, createdById: user._id as any });
    setShowCreate(false);
    setForm({ complaintNumber: "", customerName: "", customerEmail: "", description: "", adverseEvent: false, seriousInjury: false });
  };

  return (
    <Layout title="Complaints & Post-Market Surveillance">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[["Total", summary?.total], ["Open", summary?.open], ["Adverse Events", summary?.adverseEvents], ["MDR-Reportable", summary?.mdrReportable]].map(([l, v]) => (
            <div key={l as string} className="card py-3">
              <p className="text-xs text-gray-500">{l}</p>
              <p className={`text-2xl font-bold ${(l === "MDR-Reportable" || l === "Adverse Events") && (v as number) > 0 ? "text-red-600" : "text-gray-900"}`}>{v ?? "—"}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          {(user?.role === "qms-manager" || user?.role === "super-admin") && (
            <button className="btn-primary" onClick={() => setShowCreate(true)}>+ Log Complaint</button>
          )}
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
              <h3 className="text-lg font-semibold mb-4">Log Complaint / Adverse Event</h3>
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Complaint Number</label>
                    <input className="form-input" required placeholder="CMP-2026-001" value={form.complaintNumber} onChange={set("complaintNumber")} />
                  </div>
                  <div>
                    <label className="form-label">Customer Name</label>
                    <input className="form-input" required value={form.customerName} onChange={set("customerName")} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Customer Email</label>
                  <input className="form-input" type="email" required value={form.customerEmail} onChange={set("customerEmail")} />
                </div>
                <div>
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows={3} required value={form.description} onChange={set("description")} />
                </div>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.adverseEvent} onChange={set("adverseEvent")} />
                    Adverse Event
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.seriousInjury} onChange={set("seriousInjury")} />
                    Serious Injury
                  </label>
                </div>
                {(form.adverseEvent || form.seriousInjury) && (
                  <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                    This complaint will be flagged as <strong>MDR-reportable</strong>. FDA notification required within 15 days (serious injury) or 30 days (malfunction).
                  </div>
                )}
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Log Complaint</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="card p-0 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="table-th">CMP #</th>
                <th className="table-th">Customer</th>
                <th className="table-th">Description</th>
                <th className="table-th">Adverse</th>
                <th className="table-th">MDR</th>
                <th className="table-th">Status</th>
                <th className="table-th">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {complaints?.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50">
                  <td className="table-td font-mono text-brand-700">{c.complaintNumber}</td>
                  <td className="table-td">{c.customerName}</td>
                  <td className="table-td max-w-xs truncate text-gray-500">{c.description}</td>
                  <td className="table-td">{c.adverseEvent ? <span className="text-red-600 font-semibold">Yes</span> : "No"}</td>
                  <td className="table-td">{c.mdrReportable ? <span className="text-red-600 font-semibold">Yes</span> : "No"}</td>
                  <td className="table-td"><span className={STATUS_BADGE[c.status] ?? "badge-draft"}>{c.status}</span></td>
                  <td className="table-td text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {!complaints?.length && (
                <tr><td colSpan={7} className="table-td text-center text-gray-400 py-8">No complaints logged</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
