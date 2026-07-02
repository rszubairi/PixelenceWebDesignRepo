import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

const STATUS_BADGE: Record<string, string> = {
  planning: "badge-draft",
  active: "badge-review",
  validation: "badge-open",
  transferred: "badge-effective",
  completed: "badge-closed",
};

const PHASE_ORDER = ["planning", "active", "validation", "transferred", "completed"];

export default function DhfPage() {
  const { user } = useAuth();
  const projects = useQuery(api.qms.dhf.listProjects, {});
  const createProject = useMutation(api.qms.dhf.createProject);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ projectName: "", description: "" });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await createProject({ ...form, createdById: user._id as any });
    setShowCreate(false);
    setForm({ projectName: "", description: "" });
  };

  return (
    <Layout title="Design History File (DHF) — IEC 62304">
      <div className="space-y-6">
        <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
          The DHF documents design inputs, outputs, verification &amp; validation records for each product version.
          Each phase requires multi-user approval sign-offs before advancing. Required by 21 CFR §820.30.
        </div>

        <div className="flex justify-end">
          {(user?.role === "qms-manager" || user?.role === "qms-director" || user?.role === "super-admin") && (
            <button className="btn-primary" onClick={() => setShowCreate(true)}>+ New DHF Project</button>
          )}
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <h3 className="text-lg font-semibold mb-4">Create DHF Project</h3>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="form-label">Project Name</label>
                  <input className="form-input" required value={form.projectName}
                    onChange={(e) => setForm((f) => ({ ...f, projectName: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows={2} value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Create</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {projects?.map((project) => {
            const stepIdx = PHASE_ORDER.indexOf(project.status);
            return (
              <Link key={project._id} href={`/dhf/${project._id}`} className="card hover:shadow-md transition-shadow block">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-gray-900">{project.projectName}</h3>
                  <span className={STATUS_BADGE[project.status] ?? "badge-draft"}>{project.status}</span>
                </div>
                {project.description && (
                  <p className="text-sm text-gray-500 mb-4 truncate">{project.description}</p>
                )}
                {/* Phase stepper */}
                <div className="flex items-center gap-0">
                  {PHASE_ORDER.map((phase, i) => {
                    const done = stepIdx > i;
                    const active = stepIdx === i;
                    return (
                      <div key={phase} className="flex items-center">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs border
                          ${done ? "bg-green-500 border-green-500 text-white"
                            : active ? "bg-brand-600 border-brand-600 text-white"
                            : "bg-white border-gray-300 text-gray-400"}`}>
                          {done ? "✓" : i + 1}
                        </div>
                        {i < PHASE_ORDER.length - 1 && (
                          <div className={`h-px w-6 ${done ? "bg-green-400" : "bg-gray-200"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-2">Created {new Date(project.createdAt).toLocaleDateString()}</p>
              </Link>
            );
          })}
          {!projects?.length && (
            <p className="col-span-2 text-center text-gray-400 py-12">No DHF projects created yet</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
