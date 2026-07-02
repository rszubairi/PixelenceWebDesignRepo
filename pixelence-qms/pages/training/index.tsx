import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

const STATUS_BADGE: Record<string, string> = {
  pending: "badge-open",
  "in-progress": "badge-review",
  completed: "badge-effective",
};

export default function TrainingPage() {
  const { user } = useAuth();
  const curriculum = useQuery(api.qms.training.getCurriculumForUser, user ? { userId: user._id as any } : "skip");

  const total = curriculum?.length ?? 0;
  const completed = curriculum?.filter((c) => c.record?.status === "completed" && c.record?.isPassed).length ?? 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Layout title="Training Management">
      <div className="space-y-6">
        {/* Progress summary */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">Your Training Compliance</p>
            <p className="text-sm font-bold text-brand-700">{completed}/{total} completed ({pct}%)</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-brand-500 h-2 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          {pct < 100 && (
            <p className="text-xs text-red-600 mt-2">
              Incomplete training may block critical clinical actions. Complete all required courses below.
            </p>
          )}
        </div>

        {/* Curriculum cards */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {curriculum?.map(({ program, record }) => {
            const status = record?.status ?? "pending";
            const passed = record?.isPassed ?? false;
            return (
              <div key={program._id} className="card flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-gray-800 text-sm">{program.title}</p>
                  <span className={STATUS_BADGE[status] ?? "badge-draft"}>
                    {status === "completed" && passed ? "Completed" : status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 flex-1">{program.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Passing score: {program.passingScore}%</span>
                  {record?.quizScore !== undefined && (
                    <span className={record.isPassed ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                      Your score: {record.quizScore}%
                    </span>
                  )}
                </div>
                {(status !== "completed" || !passed) && (
                  <Link
                    href={`/training/${program._id}`}
                    className="btn-primary text-center text-xs py-1.5"
                  >
                    {status === "in-progress" ? "Continue" : "Start Course"}
                  </Link>
                )}
                {status === "completed" && passed && record?.completedAt && (
                  <p className="text-xs text-green-600">
                    Completed {new Date(record.completedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            );
          })}
          {!curriculum?.length && (
            <p className="col-span-3 text-center text-gray-400 py-12">No training programs assigned</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
