import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";

function rpnClass(rpn: number) {
  if (rpn >= 50) return "text-red-700 font-bold";
  if (rpn >= 20) return "text-yellow-700 font-semibold";
  return "text-green-700";
}

const STATUS_BADGE: Record<string, string> = {
  open: "badge-open",
  mitigated: "badge-effective",
  acceptable: "badge-closed",
};

export default function RiskRegisterPage() {
  const { user } = useAuth();
  const risks = useQuery(api.qms.risk.list, {});
  const summary = useQuery(api.qms.risk.getSummaryStats);
  const createRisk = useMutation(api.qms.risk.create);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    riskNumber: "", hazard: "", consequence: "", mitigation: "",
    preSeverity: 3, preProbability: 3, preDetectability: 3,
    postSeverity: 1, postProbability: 2, postDetectability: 2,
  });

  const preRpn = form.preSeverity * form.preProbability * form.preDetectability;
  const postRpn = form.postSeverity * form.postProbability * form.postDetectability;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await createRisk({ ...form, createdById: user._id as any });
    setShowCreate(false);
  };

  const n = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: Number(e.target.value) }));

  return (
    <Layout title="Risk Register — ISO 14971">
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ["Total Risks", summary?.total],
            ["Open", summary?.open],
            ["Mitigated", summary?.mitigated],
            ["High RPN (≥50)", summary?.highRpn],
          ].map(([label, val]) => (
            <div key={label as string} className="card py-3">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{val ?? "—"}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          {(user?.role === "qms-manager" || user?.role === "qms-staff" || user?.role === "super-admin") && (
            <button className="btn-primary" onClick={() => setShowCreate(true)}>+ Add Risk</button>
          )}
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
              <h3 className="text-lg font-semibold mb-4">New FMEA Risk Entry</h3>
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Risk Number</label>
                    <input className="form-input" required placeholder="RISK-001"
                      value={form.riskNumber} onChange={(e) => setForm({ ...form, riskNumber: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Hazard</label>
                  <input className="form-input" required value={form.hazard}
                    onChange={(e) => setForm({ ...form, hazard: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Consequence</label>
                  <input className="form-input" required value={form.consequence}
                    onChange={(e) => setForm({ ...form, consequence: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Mitigation</label>
                  <textarea className="form-input" rows={2} required value={form.mitigation}
                    onChange={(e) => setForm({ ...form, mitigation: e.target.value })} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[["Pre-Sev", "preSeverity"], ["Pre-Prob", "preProbability"], ["Pre-Det", "preDetectability"]].map(([label, field]) => (
                    <div key={field}>
                      <label className="form-label">{label} (1-5)</label>
                      <input className="form-input" type="number" min={1} max={5}
                        value={(form as any)[field]} onChange={n(field)} />
                    </div>
                  ))}
                </div>
                <p className="text-sm font-medium text-gray-700">Pre-mitigation RPN: <span className={rpnClass(preRpn)}>{preRpn}</span></p>
                <div className="grid grid-cols-3 gap-3">
                  {[["Post-Sev", "postSeverity"], ["Post-Prob", "postProbability"], ["Post-Det", "postDetectability"]].map(([label, field]) => (
                    <div key={field}>
                      <label className="form-label">{label} (1-5)</label>
                      <input className="form-input" type="number" min={1} max={5}
                        value={(form as any)[field]} onChange={n(field)} />
                    </div>
                  ))}
                </div>
                <p className="text-sm font-medium text-gray-700">Post-mitigation RPN: <span className={rpnClass(postRpn)}>{postRpn}</span></p>
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Save Risk</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="card p-0 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="table-th">Risk #</th>
                <th className="table-th">Hazard</th>
                <th className="table-th">Pre-RPN</th>
                <th className="table-th">Mitigation</th>
                <th className="table-th">Post-RPN</th>
                <th className="table-th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {risks?.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50">
                  <td className="table-td font-mono text-brand-700">{r.riskNumber}</td>
                  <td className="table-td">{r.hazard}</td>
                  <td className={`table-td ${rpnClass(r.preRpn)}`}>{r.preRpn}</td>
                  <td className="table-td max-w-xs truncate text-gray-500">{r.mitigation}</td>
                  <td className={`table-td ${rpnClass(r.postRpn)}`}>{r.postRpn}</td>
                  <td className="table-td">
                    <span className={STATUS_BADGE[r.status] ?? "badge-draft"}>{r.status}</span>
                  </td>
                </tr>
              ))}
              {!risks?.length && (
                <tr><td colSpan={6} className="table-td text-center text-gray-400 py-8">No risks logged</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
