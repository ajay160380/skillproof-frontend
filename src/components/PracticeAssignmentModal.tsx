import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface PracticeData {
  job_id: number;
  role_title: string;
  company_name: string;
  min_score: number;
  title: string;
  scenario: string;
  problem_statement: string;
  requirements: string[];
  difficulty: string;
  estimated_time_minutes: number;
  target_skills: string[];
  starter_code: string;
  sample_cases: Array<{ input: string; expected_output: string; explanation?: string }>;
  hints: string[];
}

interface EvaluationResult {
  score: number;
  min_score: number;
  is_ready: boolean;
  summary: string;
  strengths: string[];
  improvements: string[];
  complexity_analysis?: string;
  readiness_tip?: string;
}

interface PracticeAssignmentModalProps {
  job: {
    id: number;
    role_title: string;
    company_name: string;
    min_score?: number;
    required_tests?: Array<{ id: number; title: string }>;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onStartOfficialTest?: (testId: number) => void;
}

export function PracticeAssignmentModal({
  job,
  isOpen,
  onClose,
  onStartOfficialTest,
}: PracticeAssignmentModalProps) {
  const [loading, setLoading] = useState(true);
  const [practiceData, setPracticeData] = useState<PracticeData | null>(null);
  const [code, setCode] = useState('');
  const [activeTab, setActiveTab] = useState<'problem' | 'hints'>('problem');
  const [unlockedHints, setUnlockedHints] = useState<number[]>([]);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen || !job) return;

    setLoading(true);
    setEvaluation(null);
    setUnlockedHints([]);
    setActiveTab('problem');

    api.get(`/jobs/${job.id}/practice-assignment/`)
      .then((res) => {
        setPracticeData(res.data);
        setCode(res.data.starter_code || 'def solution():\n    pass');
      })
      .catch(() => {
        toast.error('Failed to load practice assignment');
      })
      .finally(() => setLoading(false));
  }, [isOpen, job]);

  if (!isOpen || !job) return null;

  const handleUnlockHint = (idx: number) => {
    if (!unlockedHints.includes(idx)) {
      setUnlockedHints([...unlockedHints, idx]);
    }
  };

  const handleEvaluate = async () => {
    if (!code || code.trim().length < 10) {
      toast.error('Please write some code before submitting for evaluation');
      return;
    }

    try {
      setEvaluating(true);
      const res = await api.post('/jobs/evaluate-practice/', {
        role_title: job.role_title,
        problem_statement: practiceData?.problem_statement || '',
        code_submission: code,
        starter_code: practiceData?.starter_code || '',
        min_score: job.min_score || 70,
      });

      setEvaluation(res.data);
      if (res.data.score === 0) {
        toast.error('Incomplete code: Starter template submitted without custom logic.');
      } else if (res.data.is_ready) {
        toast.success(`🎉 Great job! Practice score: ${res.data.score}% (Ready for official test!)`);
      } else {
        toast(`Practice evaluated: ${res.data.score}%. Check suggestions below!`, { icon: '💡' });
      }
    } catch (err) {
      toast.error('Failed to evaluate practice code');
    } finally {
      setEvaluating(false);
    }
  };

  const firstRequiredTestId = job.required_tests?.[0]?.id;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-6xl max-h-[92vh] bg-[#141415] border border-[#2A2A2D] rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10 text-white"
        >
          {/* Header */}
          <div className="p-6 border-b border-[#2A2A2D] bg-[#1E1E21]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-mono text-[10px] uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Practice Mode • Unproctored
                </span>
                <span className="px-3 py-1 bg-[#141415] text-[#D4D4D8] border border-[#2A2A2D] rounded-full font-mono text-[10px] uppercase tracking-wider">
                  {job.company_name}
                </span>
                <span className="px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-full font-mono text-[10px] uppercase tracking-wider font-bold">
                  Target Threshold: {job.min_score || 75}%
                </span>
              </div>
              <h2 className="font-sans font-bold text-2xl text-white">
                Practice Assignment: <span className="text-emerald-400">{job.role_title}</span>
              </h2>
              <p className="font-mono text-xs text-[#A0A0A3] mt-1">
                Customized coding exercise based on this role's production requirements. Zero score risk.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {firstRequiredTestId && (
                <button
                  onClick={() => {
                    onClose();
                    if (onStartOfficialTest) {
                      onStartOfficialTest(firstRequiredTestId);
                    } else {
                      navigate(`/test/${firstRequiredTestId}`);
                    }
                  }}
                  className="px-4 py-2 bg-white hover:bg-emerald-400 text-[#0A0A0B] font-mono text-xs uppercase tracking-widest font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0"
                >
                  <span>⚡</span> Take Official Test
                </button>
              )}
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-[#141415] hover:bg-[#2A2A2D] border border-[#2A2A2D] text-[#A0A0A3] hover:text-white flex items-center justify-center font-bold text-lg transition-colors shrink-0"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Modal Body */}
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
              <div className="font-mono text-sm uppercase tracking-widest text-emerald-400 font-bold">
                Generating Job Practice Challenge via AI...
              </div>
              <p className="text-xs text-[#A0A0A3] max-w-md font-sans">
                Synthesizing production scenarios, constraints, and test cases matching {job.role_title} requirements.
              </p>
            </div>
          ) : !practiceData ? (
            <div className="p-12 text-center text-[#A0A0A3]">
              Failed to load practice challenge. Please try again.
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-[#2A2A2D]">
              {/* Left Column: Problem & Requirements (5 cols) */}
              <div className="lg:col-span-5 p-6 overflow-y-auto max-h-[calc(92vh-180px)] space-y-6">
                {/* Tabs */}
                <div className="flex gap-2 border-b border-[#2A2A2D] pb-3">
                  <button
                    onClick={() => setActiveTab('problem')}
                    className={`px-4 py-1.5 rounded-xl font-mono text-xs uppercase tracking-wider font-bold transition-all ${
                      activeTab === 'problem'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'text-[#A0A0A3] hover:text-white'
                    }`}
                  >
                    📋 Problem & Requirements
                  </button>
                  <button
                    onClick={() => setActiveTab('hints')}
                    className={`px-4 py-1.5 rounded-xl font-mono text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'hints'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'text-[#A0A0A3] hover:text-white'
                    }`}
                  >
                    <span>💡</span> Hints ({unlockedHints.length}/{practiceData.hints?.length || 0})
                  </button>
                </div>

                {activeTab === 'problem' ? (
                  <>
                    {/* Challenge Title & Badges */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          {practiceData.difficulty || 'Medium'}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#1E1E21] text-[#A0A0A3] border border-[#2A2A2D]">
                          Est. {practiceData.estimated_time_minutes || 25} mins
                        </span>
                      </div>
                      <h3 className="font-sans font-bold text-xl text-white">
                        {practiceData.title}
                      </h3>
                    </div>

                    {/* Scenario */}
                    {practiceData.scenario && (
                      <div className="p-4 rounded-2xl bg-[#1E1E21] border border-[#2A2A2D] text-xs text-[#D4D4D8] leading-relaxed">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-400 block font-bold mb-1">
                          🏢 Production Context:
                        </span>
                        {practiceData.scenario}
                      </div>
                    )}

                    {/* Problem Statement */}
                    <div>
                      <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#A0A0A3] font-bold mb-2">
                        Problem Statement & Constraints
                      </h4>
                      <div className="text-sm text-[#E4E4E7] font-sans whitespace-pre-wrap leading-relaxed bg-[#0A0A0B] p-4 rounded-2xl border border-[#2A2A2D]">
                        {practiceData.problem_statement}
                      </div>
                    </div>

                    {/* Key Requirements */}
                    {practiceData.requirements?.length > 0 && (
                      <div>
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#A0A0A3] font-bold mb-2">
                          Key Job Competencies
                        </h4>
                        <ul className="space-y-2">
                          {practiceData.requirements.map((req, i) => (
                            <li
                              key={i}
                              className="text-xs text-[#D4D4D8] flex items-start gap-2 bg-[#1E1E21]/60 p-2.5 rounded-xl border border-[#2A2A2D]"
                            >
                              <span className="text-emerald-400 font-bold">✓</span>
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Sample Test Cases */}
                    {practiceData.sample_cases?.length > 0 && (
                      <div>
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#A0A0A3] font-bold mb-2">
                          Sample Test Cases
                        </h4>
                        <div className="space-y-2.5">
                          {practiceData.sample_cases.map((sc, i) => (
                            <div
                              key={i}
                              className="p-3 bg-[#0A0A0B] border border-[#2A2A2D] rounded-xl font-mono text-xs space-y-1"
                            >
                              <div>
                                <span className="text-[#A0A0A3]">Input: </span>
                                <code className="text-emerald-400">{sc.input}</code>
                              </div>
                              <div>
                                <span className="text-[#A0A0A3]">Expected: </span>
                                <code className="text-white font-bold">{sc.expected_output}</code>
                              </div>
                              {sc.explanation && (
                                <p className="text-[11px] text-[#71717A] mt-1 font-sans">
                                  {sc.explanation}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* Hints Tab */
                  <div className="space-y-4">
                    <div className="text-xs text-[#A0A0A3] font-sans">
                      Progressive hints to help you master this pattern before taking the official proctored test:
                    </div>
                    {practiceData.hints?.map((hint, i) => {
                      const isUnlocked = unlockedHints.includes(i);
                      return (
                        <div
                          key={i}
                          className="p-4 rounded-2xl bg-[#1E1E21] border border-[#2A2A2D] space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
                              <span>💡</span> Hint {i + 1}
                            </span>
                            {!isUnlocked && (
                              <button
                                onClick={() => handleUnlockHint(i)}
                                className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg font-mono text-[10px] uppercase font-bold transition-all"
                              >
                                Reveal Hint
                              </button>
                            )}
                          </div>
                          {isUnlocked ? (
                            <p className="text-xs text-[#E4E4E7] font-sans leading-relaxed pt-1">
                              {hint}
                            </p>
                          ) : (
                            <p className="text-xs text-[#71717A] italic">
                              Click "Reveal Hint" to unlock step-by-step guidance.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Code Editor & AI Review (7 cols) */}
              <div className="lg:col-span-7 p-6 overflow-y-auto max-h-[calc(92vh-180px)] flex flex-col justify-between space-y-6">
                <div>
                  {/* Editor Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs uppercase tracking-widest text-[#A0A0A3] font-bold">
                        Python 3 Sandbox
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono text-[10px]">
                        Auto-Format
                      </span>
                    </div>
                    <button
                      onClick={() => setCode(practiceData.starter_code)}
                      className="font-mono text-[10px] uppercase tracking-wider text-[#71717A] hover:text-white transition-colors"
                    >
                      Reset Starter Code
                    </button>
                  </div>

                  {/* Code Textarea / Sandbox */}
                  <div className="relative rounded-2xl overflow-hidden border border-[#2A2A2D] bg-[#0A0A0B] shadow-inner">
                    <textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      rows={14}
                      className="w-full p-4 bg-[#0A0A0B] text-emerald-300 font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-y"
                      placeholder="Write your Python solution here..."
                      spellCheck={false}
                    />
                  </div>

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                    <span className="font-mono text-[11px] text-[#71717A]">
                      Practice submissions do not count against your official records.
                    </span>
                    <button
                      onClick={handleEvaluate}
                      disabled={evaluating}
                      className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-[#0A0A0B] font-mono text-xs uppercase tracking-widest font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/10 disabled:opacity-50 flex items-center gap-2 shrink-0"
                    >
                      {evaluating ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-[#0A0A0B] border-t-transparent rounded-full animate-spin" />
                          <span>AI Evaluating Code...</span>
                        </>
                      ) : (
                        <>
                          <span>⚡</span> Run & Evaluate with AI
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* AI Evaluation Results Card */}
                {evaluation && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-6 rounded-2xl border ${
                      evaluation.score === 0
                        ? 'bg-rose-500/10 border-rose-500/40 text-rose-200'
                        : evaluation.is_ready
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                        : 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/10">
                      <div>
                        <div className="font-mono text-[10px] uppercase tracking-widest font-bold">
                          {evaluation.score === 0
                            ? '🔴 INCOMPLETE / UNATTEMPTED'
                            : evaluation.is_ready
                            ? '🟢 READY FOR OFFICIAL ASSESSMENT'
                            : '🟡 PRACTICE NEEDED'}
                        </div>
                        <h4 className="font-sans font-bold text-2xl text-white mt-1">
                          Practice Score:{' '}
                          <span className={evaluation.score === 0 ? 'text-rose-400' : evaluation.is_ready ? 'text-emerald-400' : 'text-amber-400'}>
                            {evaluation.score}%
                          </span>{' '}
                          <span className="text-xs text-[#A0A0A3] font-normal font-mono">
                            (Job Target: {evaluation.min_score}%)
                          </span>
                        </h4>
                      </div>

                      {firstRequiredTestId && evaluation.is_ready && (
                        <button
                          onClick={() => {
                            onClose();
                            if (onStartOfficialTest) {
                              onStartOfficialTest(firstRequiredTestId);
                            } else {
                              navigate(`/test/${firstRequiredTestId}`);
                            }
                          }}
                          className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-[#0A0A0B] font-mono text-xs uppercase tracking-widest font-bold rounded-xl transition-all shadow-lg shrink-0 flex items-center gap-1.5"
                        >
                          <span>🚀</span> Start Official Exam
                        </button>
                      )}
                    </div>

                    <p className="text-sm text-white/90 leading-relaxed font-sans mb-4">
                      {evaluation.summary}
                    </p>

                    {evaluation.complexity_analysis && (
                      <div className="mb-4 font-mono text-xs text-[#A0A0A3] bg-black/40 p-2.5 rounded-xl border border-white/10">
                        ⚡ Complexity: <span className="text-white font-bold">{evaluation.complexity_analysis}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                      {evaluation.strengths?.length > 0 && (
                        <div className="bg-black/30 p-3 rounded-xl border border-white/10">
                          <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-400 font-bold block mb-1.5">
                            Key Strengths:
                          </span>
                          <ul className="space-y-1 text-white/80 list-disc list-inside">
                            {evaluation.strengths.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {evaluation.improvements?.length > 0 && (
                        <div className="bg-black/30 p-3 rounded-xl border border-white/10">
                          <span className="font-mono text-[10px] uppercase tracking-widest text-amber-400 font-bold block mb-1.5">
                            Improvement Areas:
                          </span>
                          <ul className="space-y-1 text-white/80 list-disc list-inside">
                            {evaluation.improvements.map((imp, idx) => (
                              <li key={idx}>{imp}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {evaluation.readiness_tip && (
                      <div className="mt-4 pt-3 border-t border-white/10 font-mono text-xs text-white/90">
                        💡 {evaluation.readiness_tip}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
