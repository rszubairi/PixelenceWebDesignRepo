import { useState } from "react";
import { useRouter } from "next/router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Layout from "@/components/layout/Layout";
import ESignatureModal from "@/components/ESignatureModal";
import { useAuth } from "@/contexts/AuthContext";

const ITEM_TYPE_COLOR: Record<string, string> = {
  input: "bg-purple-100 text-purple-800",
  output: "bg-blue-100 text-blue-800",
  verification: "bg-yellow-100 text-yellow-800",
  validation: "bg-green-100 text-green-800",
};

const STATUS_BADGE: Record<string, string> = {
  draft: "badge-draft",
  verified: "badge-review",
  approved: "badge-effective",
};

export default function DhfProjectPage() {
  const router = useRouter();
  const { projectId } = router.query;
  const { user } = useAuth();

  const project = useQuery(api.qms.dhf.getProjectById, projectId ? { projectId: projectId as any } : "skip");
  const addItem = useMutation(api.qms.dhf.addItem);
  const advanceStatus = useMutation(api.qms.dhf.advanceProjectStatus);

  const [showAdd, setShowAdd] = useState(false);
  const [signingItemId, setSigningItemId] = useState<string | null>(null);
  const [form, setForm] = useState({
    itemType: "input" as const,
    itemCode: "",
    description: "",
    linkedItems: "",
  });

  const PHASE_ORDER = ["planning", "active", "validation", "transferred", "completed"];

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !project) return;
    await addItem({
      projectId: project._id,
      itemType: form.itemType,
      itemCode: form.itemCode,
      description: form.description,
      linkedItems: form.linkedItems ? form.linkedItems.split(",").map((s) => s.trim()) : [],
      createdById: user._id as any,
    });
    setShowAdd(false);
    setForm({ itemType: "input", itemCode: "", description: "", linkedItems: "" });
  };

  const handleAdvance = async () => {
    if (!user || !project) return;
    const currentIdx = PHASE_ORDER.indexOf(project.status);
    const next = PHASE_ORDER[currentIdx + 1] as any;
    if (next) await advanceStatus({ projectId: project._id, status: next, updatedById: user._id as any });
  };

  if (!project) return <Layout title="DHF Project"><p className="text-gray-400 p-8">Loading…</p></Layout>;

  const isManager = user?.role === "qms-manager" || user?.role === "qms-director" || user?.role === "super-admin";
  const currentPhaseIdx = PHASE_ORDER.indexOf(project.status);

  const SECTIONS: Array<{ type: "input" | "output" | "verification" | "validation"; label: string; description: string }> = [
    { type: "input", label: "Design Inputs", description: "Clinical, regulatory, and technical requirements" },
    { type: "output", label: "Design Outputs", description: "Architecture configs, schema, code releases" },
    { type: "verification", label: "Verification", description: "Test suite execution reports, static analysis" },
    { type: "validation", label: "Validation", description: "Clinical trial records, user acceptance testing" },
  ];

  return (
    <Layout title={`DHF: ${project.projectName}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Project header */}
        <div className="card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{project.projectName}</h2>
              {project.description && <p className="text-sm text-gray-500 mt-1">{project.description}</p>}
            </div>
            {isManager && currentPhaseIdx < PHASE_ORDER.length - 1 && (
              <button className="btn-primary whitespace-nowrap" onClick={handleAdvance}>
                Advance → {PHASE_ORDER[currentPhaseIdx + 1]}
              </button>
            )}
          </div>

          {/* Phase stepper */}
          <div className="flex items-center gap-0 mt-5">
            {PHASE_ORDER.map((phase, i) => {
              const done = currentPhaseIdx > i;
              const active = currentPhaseIdx === i;
              return (
                <div key={phase} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2
                      ${done ? "bg-green-500 border-green-500 text-white"
                        : active ? "bg-brand-600 border-brand-600 text-white"
                        : "bg-white border-gray-300 text-gray-400"}`}>
                      {done ? "✓" : i + 1}
                    </div>
                    <span className={`text-xs mt-1 capitalize ${active ? "text-brand-700 font-medium" : "text-gray-400"}`}>
                      {phase}
                    </span>
                  </div>
                  {i < PHASE_ORDER.length - 1 && (
                    <div className={`h-0.5 w-14 mx-1 mb-4 ${done ? "bg-green-400" : "bg-gray-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Add item */}
        <div className="flex justify-end">
          {isManager && (
            <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Add DHF Item</button>
          )}
        </div>

        {showAdd && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Add DHF Item</h3>
              <form onSubmit={handleAddItem} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Item Type</label>
                    <select className="form-input" value={form.itemType}
                      onChange={(e) => setForm((f) => ({ ...f, itemType: e.target.value as any }))}>
                      <option value="input">Input</option>
                      <option value="output">Output</option>
                      <option value="verification">Verification</option>
                      <option value="validation">Validation</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Item Code</label>
                    <input className="form-input" required placeholder="DI-001" value={form.itemCode}
                      onChange={(e) => setForm((f) => ({ ...f, itemCode: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows={3} required value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Linked Item Codes (comma-separated)</label>
                  <input className="form-input" placeholder="DO-001, V-002" value={form.linkedItems}
                    onChange={(e) => setForm((f) => ({ ...f, linkedItems: e.target.value }))} />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Add</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Sections */}
        {SECTIONS.map(({ type, label, description }) => {
          const sectionItems = project.grouped?.[type] ?? [];
          return (
            <div key={type} className="card">
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${ITEM_TYPE_COLOR[type]}`}>
                  {type}
                </span>
                <h3 className="font-semibold text-gray-800">{label}</h3>
              </div>
              <p className="text-xs text-gray-400 mb-4">{description}</p>
              {sectionItems.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No items yet</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-100">
                  <thead>
                    <tr>
                      <th className="table-th">Code</th>
                      <th className="table-th">Description</th>
                      <th className="table-th">Links</th>
                      <th className="table-th">Status</th>
                      <th className="table-th">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {sectionItems.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="table-td font-mono text-brand-700">{item.itemCode}</td>
                        <td className="table-td max-w-xs truncate">{item.description}</td>
                        <td className="table-td text-xs text-gray-400">{item.linkedItems.join(", ") || "—"}</td>
                        <td className="table-td">
                          <span className={STATUS_BADGE[item.status] ?? "badge-draft"}>{item.status}</span>
                        </td>
                        <td className="table-td">
                          {item.status !== "approved" && isManager && (
                            <button
                              className="text-xs text-brand-600 hover:underline"
                              onClick={() => setSigningItemId(item._id)}
                            >
                              Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>

      {signingItemId && (
        <ESignatureModal
          meaning="DHF Item Approval"
          targetLabel={`DHF item in project: ${project.projectName}`}
          dhfItemId={signingItemId}
          onSuccess={() => setSigningItemId(null)}
          onCancel={() => setSigningItemId(null)}
        />
      )}
    </Layout>
  );
}
