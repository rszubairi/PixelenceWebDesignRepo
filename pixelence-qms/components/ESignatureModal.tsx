import { useState, FormEvent } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  meaning: string;
  targetLabel: string;
  documentId?: string;
  changeRequestId?: string;
  capaId?: string;
  trainingRecordId?: string;
  dhfItemId?: string;
  onSuccess: (signatureHash: string) => void;
  onCancel: () => void;
}

/**
 * Dual-factor electronic signature modal — FDA 21 CFR Part 11 §11.50.
 *
 * Renders the user's full name, signing date/time, and meaning of signature
 * (all required by §11.50(a)). Re-authenticates via the Express gateway
 * (bcrypt compare) before calling the Convex verifyAndApply action.
 */
export default function ESignatureModal({
  meaning,
  targetLabel,
  documentId,
  changeRequestId,
  capaId,
  trainingRecordId,
  dhfItemId,
  onSuccess,
  onCancel,
}: Props) {
  const { user } = useAuth();
  const verifyAndApply = useAction(api.qms.signatures.verifyAndApply);

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const signingTime = new Date().toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    setSubmitting(true);
    try {
      const result = await verifyAndApply({
        userId: user._id as any,
        password,
        meaning,
        ...(documentId && { documentId: documentId as any }),
        ...(changeRequestId && { changeRequestId: changeRequestId as any }),
        ...(capaId && { capaId: capaId as any }),
        ...(trainingRecordId && { trainingRecordId: trainingRecordId as any }),
        ...(dhfItemId && { dhfItemId: dhfItemId as any }),
      });
      onSuccess((result as any).signatureHash ?? "");
    } catch (err: any) {
      setError(err.message ?? "Signature verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-lg">✍</div>
          <div>
            <h3 className="text-base font-semibold text-gray-800">Electronic Signature</h3>
            <p className="text-xs text-gray-500">FDA 21 CFR Part 11 · EU Annex 11</p>
          </div>
        </div>

        {/* Signature record block (21 CFR §11.50(a)) */}
        <div className="rounded-md bg-gray-50 border border-gray-200 p-4 mb-5 text-sm space-y-1.5">
          <div className="grid grid-cols-3 gap-1 text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
            <span>Signer</span><span>Date / Time</span><span>Meaning</span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-sm text-gray-800">
            <span className="font-medium">{user.firstName} {user.lastName}</span>
            <span className="text-gray-600">{signingTime}</span>
            <span className="italic text-gray-700">{meaning}</span>
          </div>
          <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
            Signing: <span className="font-medium text-gray-700">{targetLabel}</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">
              Re-enter your password to sign
              <span className="ml-1 text-gray-400 font-normal">(secondary authentication)</span>
            </label>
            <input
              type="password"
              required
              autoFocus
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your account password"
            />
          </div>

          <p className="text-xs text-gray-400">
            By clicking "Apply Signature" you certify that you are {user.firstName} {user.lastName}
            and you intend to sign this record as <strong>{meaning}</strong>.
            This signature is legally binding under 21 CFR §11.100.
          </p>

          <div className="flex gap-2 justify-end pt-1">
            <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting || !password}>
              {submitting ? "Verifying…" : "Apply Signature"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
