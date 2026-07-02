import { useState } from "react";
import { useRouter } from "next/router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Layout from "@/components/layout/Layout";
import ESignatureModal from "@/components/ESignatureModal";
import { useAuth } from "@/contexts/AuthContext";

type Phase = "overview" | "quiz" | "esign" | "complete";

export default function TrainingCoursePage() {
  const router = useRouter();
  const { programId } = router.query;
  const { user } = useAuth();

  const program = useQuery(api.qms.training.getProgramById, programId ? { programId: programId as any } : "skip");

  const startAssessment = useMutation(api.qms.training.startAssessment);
  const completeAssessment = useMutation(api.qms.training.completeAssessment);

  const [phase, setPhase] = useState<Phase>("overview");
  const [recordId, setRecordId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [error, setError] = useState("");

  if (!program) return <Layout title="Training"><p className="text-gray-400 p-8">Loading…</p></Layout>;

  const questions = program.questions ?? [];

  const handleStart = async () => {
    if (!user) return;
    try {
      const rid = await startAssessment({ userId: user._id as any, programId: program._id });
      setRecordId(rid as string);
      setPhase("quiz");
    } catch (e: any) { setError(e.message); }
  };

  const handleSubmitQuiz = async () => {
    if (!recordId) return;
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) correct++;
    });
    const pct = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    const didPass = pct >= (program.passingScore ?? 80);
    setScore(pct);
    setPassed(didPass);

    if (didPass) {
      setPhase("esign");
    } else {
      // Failed — save result without e-signature
      await completeAssessment({ recordId: recordId as any, quizScore: pct, passed: false });
      setPhase("complete");
    }
  };

  const handleSignatureSuccess = async (signatureHash: string) => {
    if (!recordId) return;
    await completeAssessment({ recordId: recordId as any, quizScore: score, passed: true, signatureHash });
    setPhase("complete");
  };

  const allAnswered = questions.every((_, i) => answers[i] !== undefined);

  return (
    <Layout title={program.title}>
      <div className="max-w-2xl mx-auto space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
        )}

        {/* ── Overview ─────────────────────────────────────────────────────── */}
        {phase === "overview" && (
          <div className="card space-y-4">
            <div>
              <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Training Program</p>
              <h2 className="text-2xl font-bold text-gray-900">{program.title}</h2>
            </div>
            <p className="text-gray-600">{program.description}</p>
            <div className="grid grid-cols-2 gap-4 py-3 border-t border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-400">Passing Score</p>
                <p className="font-semibold text-gray-800">{program.passingScore}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Questions</p>
                <p className="font-semibold text-gray-800">{questions.length}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              On passing, you will be required to apply an electronic signature (FDA 21 CFR Part 11)
              to confirm your understanding and completion.
            </p>
            <button className="btn-primary w-full" onClick={handleStart}>
              Start Assessment
            </button>
          </div>
        )}

        {/* ── Quiz ─────────────────────────────────────────────────────────── */}
        {phase === "quiz" && (
          <div className="space-y-5">
            <div className="card">
              <p className="text-sm text-gray-500 mb-1">Answer all questions, then submit to calculate your score.</p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div
                  className="bg-brand-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${(Object.keys(answers).length / Math.max(questions.length, 1)) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{Object.keys(answers).length}/{questions.length} answered</p>
            </div>

            {questions.map((q, qi) => (
              <div key={qi} className="card">
                <p className="font-medium text-gray-800 mb-4">
                  <span className="text-brand-600 font-bold mr-2">{qi + 1}.</span>
                  {q.question}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <label
                      key={oi}
                      className={`flex items-center gap-3 p-3 rounded-md cursor-pointer border transition-colors
                        ${answers[qi] === oi
                          ? "border-brand-500 bg-brand-50"
                          : "border-gray-200 hover:bg-gray-50"}`}
                    >
                      <input
                        type="radio"
                        name={`q${qi}`}
                        value={oi}
                        checked={answers[qi] === oi}
                        onChange={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                        className="accent-brand-600"
                      />
                      <span className="text-sm text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <button
              className="btn-primary w-full"
              onClick={handleSubmitQuiz}
              disabled={!allAnswered}
            >
              Submit Assessment
            </button>
          </div>
        )}

        {/* ── E-Signature (passed) ─────────────────────────────────────────── */}
        {phase === "esign" && (
          <ESignatureModal
            meaning="Training Completion Acknowledgment"
            targetLabel={program.title}
            trainingRecordId={recordId ?? undefined}
            onSuccess={handleSignatureSuccess}
            onCancel={() => setPhase("quiz")}
          />
        )}

        {/* ── Complete ─────────────────────────────────────────────────────── */}
        {phase === "complete" && (
          <div className="card text-center space-y-4 py-10">
            <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl
              ${passed ? "bg-green-100" : "bg-red-100"}`}>
              {passed ? "✓" : "✗"}
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {passed ? "Assessment Passed!" : "Assessment Failed"}
            </h2>
            <p className="text-gray-600">
              Your score: <span className={`font-bold text-lg ${passed ? "text-green-600" : "text-red-600"}`}>{score}%</span>
              &ensp;(passing: {program.passingScore}%)
            </p>
            {passed ? (
              <p className="text-sm text-green-700">
                Your training record has been signed and is now complete. Thank you.
              </p>
            ) : (
              <p className="text-sm text-red-700">
                You did not reach the passing score. Please review the SOP and try again.
              </p>
            )}
            <div className="flex gap-2 justify-center pt-2">
              <button className="btn-secondary" onClick={() => router.push("/training")}>
                Back to Training
              </button>
              {!passed && (
                <button className="btn-primary" onClick={() => { setAnswers({}); setPhase("quiz"); }}>
                  Retake Assessment
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
