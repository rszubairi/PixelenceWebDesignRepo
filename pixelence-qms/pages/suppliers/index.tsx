import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";

const CRIT_BADGE: Record<string, string> = {
  critical: "badge-open",
  major: "badge-review",
  minor: "badge-draft",
};
const STATUS_BADGE: Record<string, string> = {
  approved: "badge-effective",
  conditional: "badge-review",
  suspended: "badge-open",
};

export default function SuppliersPage() {
  const { user } = useAuth();
  const suppliers = useQuery(api.qms.suppliers.list, {});
  const createSupplier = useMutation(api.qms.suppliers.create);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "", criticality: "major" as const, serviceProvided: "",
    certificationUrl: "", certificationExpiry: "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await createSupplier({ ...form, createdById: user._id as any });
    setShowCreate(false);
    setForm({ name: "", criticality: "major", serviceProvided: "", certificationUrl: "", certificationExpiry: "" });
  };

  return (
    <Layout title="Supplier Quality Management">
      <div className="space-y-6">
        <div className="flex justify-end">
          {(user?.role === "qms-manager" || user?.role === "super-admin") && (
            <button className="btn-primary" onClick={() => setShowCreate(true)}>+ Add Supplier</button>
          )}
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Register Supplier</h3>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="form-label">Supplier Name</label>
                  <input className="form-input" required value={form.name} onChange={set("name")} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Criticality</label>
                    <select className="form-input" value={form.criticality} onChange={set("criticality")}>
                      <option value="critical">Critical</option>
                      <option value="major">Major</option>
                      <option value="minor">Minor</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Cert. Expiry</label>
                    <input className="form-input" type="date" value={form.certificationExpiry} onChange={set("certificationExpiry")} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Service Provided</label>
                  <input className="form-input" required value={form.serviceProvided} onChange={set("serviceProvided")} />
                </div>
                <div>
                  <label className="form-label">Certification URL</label>
                  <input className="form-input" type="url" value={form.certificationUrl} onChange={set("certificationUrl")} />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Register</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="card p-0 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="table-th">Supplier</th>
                <th className="table-th">Service</th>
                <th className="table-th">Criticality</th>
                <th className="table-th">Score</th>
                <th className="table-th">Cert. Expiry</th>
                <th className="table-th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {suppliers?.map((s) => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="table-td font-medium">{s.name}</td>
                  <td className="table-td text-gray-500 max-w-xs truncate">{s.serviceProvided}</td>
                  <td className="table-td"><span className={CRIT_BADGE[s.criticality] ?? "badge-draft"}>{s.criticality}</span></td>
                  <td className="table-td">
                    <span className={s.evaluationScore >= 80 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>{s.evaluationScore}</span>
                  </td>
                  <td className="table-td text-gray-500">{s.certificationExpiry ? new Date(s.certificationExpiry).toLocaleDateString() : "—"}</td>
                  <td className="table-td"><span className={STATUS_BADGE[s.status] ?? "badge-draft"}>{s.status}</span></td>
                </tr>
              ))}
              {!suppliers?.length && (
                <tr><td colSpan={6} className="table-td text-center text-gray-400 py-8">No suppliers registered</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
