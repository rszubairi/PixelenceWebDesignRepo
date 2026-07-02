import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_BADGE: Record<string, string> = {
  initiated: "badge-draft",
  investigating: "badge-review",
  "actions-active": "badge-review",
  verification: "badge-open",
  closed: "badge-closed",
};

export default function CapaPage() {
  const { user } = useAuth();
  const summary = useQuery(api.qms.capa.getSummaryStats);
  const capas = useQuery(api.qms.capa.list, {});
  const createCapa = useMutation(api.qms.capa.create);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    capaNumber: "", source: "", description: "", containmentAction: "",
    rootCauseMethod: "5 Whys", rootCauseAnalysis: "", effectivenessPlan: "",
    verificationDate: "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await createCapa({ ...form, createdById: user._id as any });
    setShowCreate(false);
    setForm({ capaNumber: "", source: "", description: "", containmentAction: "", rootCauseMethod: "5 Whys", rootCauseAnalysis: "", effectivenessPlan: "", verificationDate: "" });
  };

  return (
    <Layout title="CAPA & Nonconformance">
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[["Total", summary?.total], ["Open", summary?.open], ["Overdue", summary?.overdue]].map(([l, v]) => (
            <div key={l as string} className="card py-3">
              <p className="text-xs text-gray-500">{l}</p>
              <p className={`text-2xl font-bold ${l === "Overdue" && (v as number) > 0 ? "text-red-600" : "text-gray-900"}`}>{v ?? "—"}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          {(user?.role === "qms-manager" || user?.role === "super-admin") && (
            <button className="btn-primary" onClick={() => setShowCreate(true)}>+ New CAPA</button>
          )}
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
              <h3 className="text-lg font-semibold mb-4">Initiate CAPA Record</h3>
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">CAPA Number</label>
                    <input className="form-input" required placeholder="CAPA-2026-001" value={form.capaNumber} onChange={set("capaNumber")} />
                  </div>
                  <div>
                    <label className="form-label">Source</label>
                    <input className="form-input" required placeholder="Audit AUD-001 / Complaint / Internal" value={form.source} onChange={set("source")} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Description of Nonconformance</label>
                  <textarea className="form-input" rows={2} required value={form.description} onChange={set("description")} />
                </div>
                <div>
                  <label className="form-label">Immediate Containment Action</label>
                  <textarea className="form-input" rows={2} required value={form.containmentAction} onChange={set("containmentAction")} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Root Cause Method</label>
                    <select className="form-input" value={form.rootCauseMethod} onChange={set("rootCauseMethod")}>
                      <option>5 Whys</option>
                      <option>Ishikawa (Fishbone)</option>
                      <option>Fault Tree Analysis</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Verification Date</label>
                    <input className="form-input" type="date" required value={form.verificationDate} onChange={set("verificationDate")} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Root Cause Analysis</label>
                  <textarea className="form-input" rows={3} required value={form.rootCauseAnalysis} onChange={set("rootCauseAnalysis")} />
                </div>
                <div>
                  <label className="form-label">Effectiveness Plan</label>
                  <textarea className="form-input" rows={2} required value={form.effectivenessPlan} onChange={set("effectivenessPlan")} />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Initiate CAPA</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="card p-0 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="table-th">CAPA #</th>
                <th className="table-th">Source</th>
                <th className="table-th">Description</th>
                <th className="table-th">Method</th>
                <th className="table-th">Verification</th>
                <th className="table-th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {capas?.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50">
                  <td className="table-td font-mono text-brand-700">{c.capaNumber}</td>
                  <td className="table-td text-gray-500">{c.source}</td>
                  <td className="table-td max-w-xs truncate">{c.description}</td>
                  <td className="table-td text-xs text-gray-500">{c.rootCauseMethod}</td>
                  <td className="table-td text-gray-500">{new Date(c.verificationDate).toLocaleDateString()}</td>
                  <td className="table-td">
                    <span className={STATUS_BADGE[c.status] ?? "badge-draft"}>{c.status}</span>
                  </td>
                </tr>
              ))}
              {!capas?.length && (
                <tr><td colSpan={6} className="table-td text-center text-gray-400 py-8">No CAPAs initiated</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
