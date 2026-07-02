import { useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Layout from "@/components/layout/Layout";
import { useState } from "react";

function KpiCard({ label, value, subLabel, subValue, warn }: {
  label: string; value: number | string; subLabel?: string; subValue?: number | string; warn?: boolean;
}) {
  return (
    <div className={`card ${warn ? "border-red-200 bg-red-50" : ""}`}>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${warn ? "text-red-700" : "text-gray-900"}`}>{value}</p>
      {subLabel && (
        <p className={`text-xs mt-1 ${warn ? "text-red-500" : "text-gray-400"}`}>
          {subValue} {subLabel}
        </p>
      )}
    </div>
  );
}

function BarMeter({ label, value, max, color = "bg-brand-500" }: {
  label: string; value: number; max: number; color?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{label}</span>
        <span className="font-medium">{value} / {max}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ReportingPage() {
  const summary = useQuery(api.qms.reporting.executiveSummary);
  const docMatrix = useQuery(api.qms.reporting.documentAgeMatrix);
  const capaAge = useQuery(api.qms.reporting.capaAgeTrend);

  // AI copilot trace audit
  const auditTrace = useAction(api.qms.ai.auditTraceMatrix);
  const matrix = useQuery(api.qms.traceability.checkTraceMatrix);
  const [aiFindings, setAiFindings] = useState<any | null>(null);
  const [aiRunning, setAiRunning] = useState(false);

  const runAiAudit = async () => {
    if (!matrix) return;
    setAiRunning(true);
    try {
      const result = await auditTrace({ matrixJson: JSON.stringify(matrix) });
      setAiFindings(result);
    } finally { setAiRunning(false); }
  };

  const s = summary;

  return (
    <Layout title="Reporting & Analytics">
      <div className="space-y-8">
        {/* Executive KPI row */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Executive KPIs</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="Training Compliance" value={`${s?.training.compliancePct ?? "—"}%`}
              subLabel="records complete" subValue={s?.training.completed} />
            <KpiCard label="Open CAPAs" value={s?.capas.open ?? "—"}
              subLabel="overdue" subValue={s?.capas.overdue} warn={(s?.capas.overdue ?? 0) > 0} />
            <KpiCard label="MDR-Reportable Complaints" value={s?.complaints.mdrReportable ?? "—"}
              warn={(s?.complaints.mdrReportable ?? 0) > 0} />
            <KpiCard label="High-RPN Risks (≥50)" value={s?.risks.highRpn ?? "—"}
              subLabel="open" subValue={s?.risks.open} warn={(s?.risks.open ?? 0) > 0} />
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Module coverage */}
          <section className="card">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Module Coverage</h2>
            <div className="space-y-3">
              <BarMeter label="Documents (effective)" value={s?.documents.effective ?? 0} max={s?.documents.total ?? 1} />
              <BarMeter label="CAPAs (closed)" value={(s?.capas.total ?? 0) - (s?.capas.open ?? 0)}
                max={s?.capas.total ?? 1} color="bg-green-500" />
              <BarMeter label="Complaints (resolved)" value={(s?.complaints.total ?? 0) - (s?.complaints.open ?? 0)}
                max={s?.complaints.total ?? 1} color="bg-green-500" />
              <BarMeter label="Risks (mitigated/acceptable)" value={(s?.risks.total ?? 0) - (s?.risks.open ?? 0)}
                max={s?.risks.total ?? 1} color="bg-yellow-500" />
            </div>
          </section>

          {/* CAPA root cause distribution */}
          <section className="card">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">CAPA Root Cause Distribution</h2>
            {s?.capas.rcaDist && Object.keys(s.capas.rcaDist).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(s.capas.rcaDist).map(([method, count]) => (
                  <div key={method} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{method}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-brand-500 h-2 rounded-full"
                          style={{ width: `${(count / (s?.capas.total || 1)) * 100}%` }} />
                      </div>
                      <span className="font-medium text-gray-800 w-4 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No CAPAs recorded</p>
            )}
          </section>
        </div>

        {/* Document review matrix */}
        <section className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Document Periodic Review Matrix
            <span className="ml-2 text-xs font-normal text-gray-400">(ISO 13485 §4.2.4 — review every 3 years)</span>
          </h2>
          {docMatrix && docMatrix.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="table-th">Doc #</th>
                    <th className="table-th">Title</th>
                    <th className="table-th">Version</th>
                    <th className="table-th">Effective</th>
                    <th className="table-th">Age (mo.)</th>
                    <th className="table-th">Review Due (mo.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {docMatrix.map((d) => (
                    <tr key={d.docNumber}
                      className={d.overdue ? "bg-red-50" : d.warning ? "bg-yellow-50" : "hover:bg-gray-50"}>
                      <td className="table-td font-mono text-brand-700">{d.docNumber}</td>
                      <td className="table-td">{d.title}</td>
                      <td className="table-td">v{d.version}</td>
                      <td className="table-td text-gray-500">{d.effectiveDate}</td>
                      <td className="table-td">{d.ageMonths}</td>
                      <td className={`table-td font-semibold ${d.overdue ? "text-red-600" : d.warning ? "text-yellow-600" : "text-green-600"}`}>
                        {d.overdue ? `${Math.abs(d.reviewDueMonths)} OVERDUE` : d.reviewDueMonths}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No effective documents to review</p>
          )}
        </section>

        {/* CAPA age trend */}
        <section className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">CAPA Age Tracker</h2>
          {capaAge && capaAge.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="table-th">CAPA #</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Source</th>
                    <th className="table-th">Age (days)</th>
                    <th className="table-th">Overdue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {capaAge.map((c) => (
                    <tr key={c.capaNumber} className={c.isOverdue ? "bg-red-50" : "hover:bg-gray-50"}>
                      <td className="table-td font-mono text-brand-700">{c.capaNumber}</td>
                      <td className="table-td capitalize">{c.status}</td>
                      <td className="table-td text-gray-500 max-w-xs truncate">{c.source}</td>
                      <td className={`table-td font-semibold ${c.ageDays > 90 ? "text-red-600" : c.ageDays > 60 ? "text-yellow-600" : "text-gray-700"}`}>
                        {c.ageDays}
                      </td>
                      <td className="table-td">{c.isOverdue ? <span className="text-red-600 font-semibold">Yes</span> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No CAPAs recorded</p>
          )}
        </section>

        {/* AI Traceability Audit */}
        <section className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-700">AI Traceability Audit</h2>
              <p className="text-xs text-gray-400 mt-0.5">Claude analyses your trace matrix for IEC 62304 compliance gaps</p>
            </div>
            <button className="btn-primary" onClick={runAiAudit} disabled={aiRunning || !matrix?.length}>
              {aiRunning ? "Running…" : "Run AI Audit"}
            </button>
          </div>

          {aiFindings && (
            <div className="space-y-3">
              <p className="text-sm text-gray-700 italic border-l-4 border-brand-400 pl-3">{aiFindings.summary}</p>
              {aiFindings.findings?.map((f: any, i: number) => (
                <div key={i}
                  className={`rounded-md p-3 text-sm border ${
                    f.severity === "critical" ? "bg-red-50 border-red-200 text-red-800"
                      : f.severity === "major" ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                      : "bg-blue-50 border-blue-200 text-blue-800"
                  }`}>
                  <span className="font-semibold capitalize">[{f.severity}]</span> {f.issue}
                  {f.reqNumbers?.length > 0 && (
                    <span className="ml-2 font-mono text-xs">({f.reqNumbers.join(", ")})</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
