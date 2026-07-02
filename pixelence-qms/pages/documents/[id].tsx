import { useState } from "react";
import { useRouter } from "next/router";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Layout from "@/components/layout/Layout";
import ESignatureModal from "@/components/ESignatureModal";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_BADGE: Record<string, string> = {
  draft: "badge-draft",
  "in-review": "badge-review",
  "awaiting-approval": "badge-review",
  effective: "badge-effective",
  archived: "badge-closed",
  obsolete: "badge-closed",
};

type WorkflowModal = "submit-review" | "submit-approval" | "approve" | null;

export default function DocumentDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();

  const doc = useQuery(api.qms.documents.getById, id ? { docId: id as any } : "skip");
  const signatures = useQuery(api.qms.signatures.getByDocument, id ? { documentId: id as any } : "skip");
  const users = useQuery(api.users.listAll);

  const submitForReview = useMutation(api.qms.documents.submitForReview);
  const submitForApproval = useMutation(api.qms.documents.submitForApproval);
  const requestApproval = useAction(api.qms.documents.requestApproval);

  const [modal, setModal] = useState<WorkflowModal>(null);
  const [reviewerIds, setReviewerIds] = useState<string[]>([]);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  if (!doc) return <Layout title="Document"><p className="text-gray-400">Loading…</p></Layout>;

  const isManager = user?.role === "qms-manager" || user?.role === "qms-director" || user?.role === "super-admin";
  const isDirector = user?.role === "qms-director" || user?.role === "super-admin";

  const handleSubmitReview = async () => {
    if (!user || reviewerIds.length === 0) return;
    setWorking(true);
    try {
      await requestApproval({ docId: doc._id, reviewers: reviewerIds as any, requestedById: user._id as any });
      setModal(null);
    } catch (e: any) { setError(e.message); }
    finally { setWorking(false); }
  };

  const handleSubmitApproval = async () => {
    if (!user) return;
    setWorking(true);
    try {
      await submitForApproval({ docId: doc._id, requestedById: user._id as any });
      setModal(null);
    } catch (e: any) { setError(e.message); }
    finally { setWorking(false); }
  };

  const handleApproved = () => {
    setModal(null);
  };

  const toggleReviewer = (uid: string) =>
    setReviewerIds((prev) => prev.includes(uid) ? prev.filter((r) => r !== uid) : [...prev, uid]);

  return (
    <Layout title="Document Detail">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header card */}
        <div className="card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-gray-400 font-mono mb-1">{doc.docNumber}</p>
              <h2 className="text-xl font-bold text-gray-900">{doc.title}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Type: <span className="capitalize">{doc.type}</span>
                &ensp;|&ensp;Version: <strong>v{doc.version}</strong>
              </p>
            </div>
            <span className={`${STATUS_BADGE[doc.status] ?? "badge-draft"} text-sm px-3 py-1`}>
              {doc.status}
            </span>
          </div>

          {doc.contentUrl && (
            <a
              href={doc.contentUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline"
            >
              📄 View Document
            </a>
          )}
        </div>

        {/* Workflow actions */}
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Document Workflow</h3>
          <div className="flex flex-wrap gap-2">
            {doc.status === "draft" && isManager && (
              <button className="btn-primary" onClick={() => setModal("submit-review")}>
                Submit for Review
              </button>
            )}
            {doc.status === "in-review" && isManager && (
              <button className="btn-primary" onClick={() => setModal("submit-approval")}>
                Submit for Approval
              </button>
            )}
            {doc.status === "awaiting-approval" && isDirector && (
              <button className="btn-primary" onClick={() => setModal("approve")}>
                Approve & Publish
              </button>
            )}
            {doc.status === "effective" && isManager && (
              <button
                className="btn-secondary"
                onClick={async () => {
                  if (!user) return;
                  await useMutation(api.qms.documents.archive)({ docId: doc._id, userId: user._id as any });
                }}
              >
                Archive
              </button>
            )}
            {["draft", "in-review", "awaiting-approval", "effective", "archived", "obsolete"].every(
              (s) => doc.status !== s || !isManager
            ) && (
              <p className="text-sm text-gray-400">No actions available for your role at this stage.</p>
            )}
          </div>

          {/* Status timeline */}
          <div className="mt-5 flex items-center gap-0">
            {["draft", "in-review", "awaiting-approval", "effective"].map((s, i, arr) => {
              const statuses = ["draft", "in-review", "awaiting-approval", "effective", "archived", "obsolete"];
              const current = statuses.indexOf(doc.status);
              const step = statuses.indexOf(s);
              const done = current > step;
              const active = current === step;
              return (
                <div key={s} className="flex items-center">
                  <div className={`flex flex-col items-center`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2
                      ${done ? "bg-green-500 border-green-500 text-white"
                        : active ? "bg-brand-600 border-brand-600 text-white"
                        : "bg-white border-gray-300 text-gray-400"}`}>
                      {done ? "✓" : i + 1}
                    </div>
                    <span className={`text-xs mt-1 text-center max-w-16 leading-tight
                      ${active ? "text-brand-700 font-medium" : "text-gray-400"}`}>
                      {s.replace("-", " ")}
                    </span>
                  </div>
                  {i < arr.length - 1 && (
                    <div className={`h-0.5 w-12 mx-1 mb-4 ${done ? "bg-green-400" : "bg-gray-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Signatures */}
        {signatures && signatures.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Electronic Signatures</h3>
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="table-th">Meaning</th>
                  <th className="table-th">Signed At</th>
                  <th className="table-th">Hash (truncated)</th>
                </tr>
              </thead>
              <tbody>
                {signatures.map((sig) => (
                  <tr key={sig._id} className="border-t border-gray-100">
                    <td className="table-td font-medium">{sig.meaning}</td>
                    <td className="table-td text-gray-500">{new Date(sig.signedAt).toLocaleString()}</td>
                    <td className="table-td font-mono text-xs text-gray-400">{sig.signatureHash.slice(0, 20)}…</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submit for Review modal */}
      {modal === "submit-review" && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Select Reviewers</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {users?.filter((u) => u._id !== user?._id).map((u) => (
                <label key={u._id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reviewerIds.includes(u._id)}
                    onChange={() => toggleReviewer(u._id)}
                  />
                  <span className="text-sm">{u.firstName} {u.lastName} <span className="text-gray-400 text-xs">({u.role})</span></span>
                </label>
              ))}
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleSubmitReview} disabled={working || reviewerIds.length === 0}>
                {working ? "Sending…" : "Submit for Review"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit for Approval confirmation */}
      {modal === "submit-approval" && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-3">Submit for Approval</h3>
            <p className="text-sm text-gray-600 mb-5">
              This will move <strong>{doc.docNumber} v{doc.version}</strong> to <em>Awaiting Approval</em> status and notify the QMS Director.
            </p>
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleSubmitApproval} disabled={working}>
                {working ? "Submitting…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* E-Signature modal for approval */}
      {modal === "approve" && (
        <ESignatureModal
          meaning="Approval"
          targetLabel={`${doc.docNumber} v${doc.version} — ${doc.title}`}
          documentId={doc._id}
          onSuccess={handleApproved}
          onCancel={() => setModal(null)}
        />
      )}
    </Layout>
  );
}
