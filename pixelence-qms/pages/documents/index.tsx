import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/router";
import { api } from "../../../convex/_generated/api";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_BADGE: Record<string, string> = {
  draft: "badge-draft",
  "in-review": "badge-review",
  "awaiting-approval": "badge-review",
  effective: "badge-effective",
  archived: "badge-closed",
  obsolete: "badge-closed",
};

export default function DocumentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const docs = useQuery(api.qms.documents.list, {
    type: typeFilter || undefined,
    status: statusFilter || undefined,
  });

  const createDraft = useMutation(api.qms.documents.createDraft);

  const [form, setForm] = useState({ title: "", docNumber: "", type: "sop" as const, contentUrl: "" });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await createDraft({ ...form, createdById: user._id as any });
    setShowCreate(false);
    setForm({ title: "", docNumber: "", type: "sop", contentUrl: "" });
  };

  return (
    <Layout title="Document & Change Control">
      <div className="space-y-4">
        {/* Filters + action */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2">
            <select className="form-input w-36" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All types</option>
              <option value="sop">SOP</option>
              <option value="manual">Manual</option>
              <option value="specification">Specification</option>
              <option value="policy">Policy</option>
              <option value="protocol">Protocol</option>
            </select>
            <select className="form-input w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="in-review">In Review</option>
              <option value="awaiting-approval">Awaiting Approval</option>
              <option value="effective">Effective</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          {(user?.role === "qms-manager" || user?.role === "qms-director" || user?.role === "super-admin") && (
            <button className="btn-primary" onClick={() => setShowCreate(true)}>+ New Draft</button>
          )}
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Create Draft Document</h3>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="form-label">Document Number</label>
                  <input className="form-input" required placeholder="SOP-001" value={form.docNumber}
                    onChange={(e) => setForm({ ...form, docNumber: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Title</label>
                  <input className="form-input" required value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Type</label>
                  <select className="form-input" value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
                    <option value="sop">SOP</option>
                    <option value="manual">Manual</option>
                    <option value="specification">Specification</option>
                    <option value="policy">Policy</option>
                    <option value="protocol">Protocol</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Content URL (optional)</label>
                  <input className="form-input" type="url" value={form.contentUrl}
                    onChange={(e) => setForm({ ...form, contentUrl: e.target.value })} />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Create Draft</button>
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
                <th className="table-th">Doc #</th>
                <th className="table-th">Title</th>
                <th className="table-th">Type</th>
                <th className="table-th">Version</th>
                <th className="table-th">Status</th>
                <th className="table-th">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {docs?.map((doc) => (
                <tr key={doc._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/documents/${doc._id}`)}>
                  <td className="table-td font-mono text-brand-700">{doc.docNumber}</td>
                  <td className="table-td font-medium">{doc.title}</td>
                  <td className="table-td uppercase text-xs text-gray-500">{doc.type}</td>
                  <td className="table-td">v{doc.version}</td>
                  <td className="table-td">
                    <span className={STATUS_BADGE[doc.status] ?? "badge-draft"}>{doc.status}</span>
                  </td>
                  <td className="table-td text-gray-400">{new Date(doc.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {!docs?.length && (
                <tr>
                  <td colSpan={6} className="table-td text-center text-gray-400 py-8">No documents found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
