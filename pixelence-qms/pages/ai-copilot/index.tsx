import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";

type Tool = "sop" | "hazard" | "trace";

export default function AiCopilotPage() {
  const { user } = useAuth();
  const generateSop = useAction(api.qms.ai.generateSopDraft);
  const suggestHazards = useAction(api.qms.ai.suggestHazards);

  const [tool, setTool] = useState<Tool>("sop");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  // SOP generator state
  const [sopPrompt, setSopPrompt] = useState("");
  const [sopType, setSopType] = useState("SOP");
  const [sopResult, setSopResult] = useState("");

  // Hazard suggester state
  const [hazardReq, setHazardReq] = useState("");
  const [hazardResults, setHazardResults] = useState<any[]>([]);

  const runSop = async () => {
    setError(""); setRunning(true);
    try {
      const res: any = await generateSop({ promptText: sopPrompt, docType: sopType });
      setSopResult(res.draft);
    } catch (e: any) { setError(e.message); }
    finally { setRunning(false); }
  };

  const runHazards = async () => {
    setError(""); setRunning(true);
    try {
      const res: any = await suggestHazards({ requirementText: hazardReq });
      setHazardResults(res.hazards ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setRunning(false); }
  };

  const rpn = (h: any) => h.severity * h.probability * h.detectability;

  return (
    <Layout title="AI Copilot — Quality Operations">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="rounded-md bg-brand-50 border border-brand-200 p-3 text-sm text-brand-700">
          <strong>AI Copilot</strong> uses Claude to accelerate manual quality tasks. All AI-generated content
          must be reviewed and approved by a qualified person before use in official records.
        </div>

        {/* Tool selector */}
        <div className="flex gap-2 border-b border-gray-200 pb-px">
          {([
            ["sop", "SOP Draft Generator"],
            ["hazard", "FMEA Hazard Suggester"],
            ["trace", "Traceability Auditor →"],
          ] as [Tool, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTool(id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tool === id
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
        )}

        {/* ── SOP Draft Generator ───────────────────────────────────────────── */}
        {tool === "sop" && (
          <div className="space-y-4">
            <div className="card space-y-3">
              <h3 className="font-semibold text-gray-800">Generate SOP Draft</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="form-label">Activity to Document</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="e.g., Radiologist review and sign-off of AI-enhanced MRI reports"
                    value={sopPrompt}
                    onChange={(e) => setSopPrompt(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Document Type</label>
                  <select className="form-input" value={sopType} onChange={(e) => setSopType(e.target.value)}>
                    <option>SOP</option>
                    <option>Work Instruction</option>
                    <option>Policy</option>
                    <option>Protocol</option>
                  </select>
                </div>
              </div>
              <button className="btn-primary" onClick={runSop} disabled={running || !sopPrompt}>
                {running ? "Generating…" : "Generate Draft"}
              </button>
            </div>

            {sopResult && (
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-700">AI-Generated Draft</h4>
                  <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded">Requires human review</span>
                </div>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed max-h-[60vh] overflow-y-auto border-t border-gray-100 pt-3">
                  {sopResult}
                </pre>
                <button
                  className="btn-secondary mt-3 text-xs"
                  onClick={() => navigator.clipboard.writeText(sopResult)}
                >
                  Copy to clipboard
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── FMEA Hazard Suggester ─────────────────────────────────────────── */}
        {tool === "hazard" && (
          <div className="space-y-4">
            <div className="card space-y-3">
              <h3 className="font-semibold text-gray-800">FMEA Hazard Identification</h3>
              <div>
                <label className="form-label">Software Requirement Text</label>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="e.g., The system shall apply a deep learning model to enhance MRI images and return enhanced output within 30 seconds."
                  value={hazardReq}
                  onChange={(e) => setHazardReq(e.target.value)}
                />
              </div>
              <button className="btn-primary" onClick={runHazards} disabled={running || !hazardReq}>
                {running ? "Analysing…" : "Suggest Hazards"}
              </button>
            </div>

            {hazardResults.length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-700">Suggested Hazards ({hazardResults.length})</h4>
                  <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded">Requires QA review before use</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead>
                      <tr>
                        <th className="table-th">Hazard</th>
                        <th className="table-th">Consequence</th>
                        <th className="table-th">S</th>
                        <th className="table-th">P</th>
                        <th className="table-th">D</th>
                        <th className="table-th">RPN</th>
                        <th className="table-th">Mitigation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {hazardResults.map((h, i) => {
                        const r = rpn(h);
                        return (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="table-td font-medium">{h.hazard}</td>
                            <td className="table-td text-gray-500">{h.consequence}</td>
                            <td className="table-td text-center">{h.severity}</td>
                            <td className="table-td text-center">{h.probability}</td>
                            <td className="table-td text-center">{h.detectability}</td>
                            <td className={`table-td text-center font-bold ${r >= 50 ? "text-red-600" : r >= 20 ? "text-yellow-600" : "text-green-600"}`}>
                              {r}
                            </td>
                            <td className="table-td text-gray-500 max-w-xs truncate">{h.mitigation}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Traceability Auditor (link to Reporting page) ─────────────────── */}
        {tool === "trace" && (
          <div className="card text-center py-10 space-y-3">
            <p className="text-5xl">🔗</p>
            <p className="font-semibold text-gray-800">AI Traceability Auditor</p>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              The AI traceability audit is integrated into the Reporting &amp; Analytics page,
              where it can run against your live requirements matrix.
            </p>
            <a href="/reporting" className="btn-primary inline-block">Go to Reporting</a>
          </div>
        )}
      </div>
    </Layout>
  );
}
