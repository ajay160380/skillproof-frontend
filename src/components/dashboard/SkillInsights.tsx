import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { api } from '../../services/api';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { SkeletonLoader } from '../SkeletonLoader';
import { AnimatedCounter } from '../AnimatedCounter';

interface RadarDatum {
  skill: string;
  score: number;
  market_avg: number;
}

interface GapItem {
  skill: string;
  score: number;
  market_avg: number;
  status: 'above' | 'at' | 'below';
  delta: number;
  is_in_demand?: boolean;
  tips: string[];
}

interface RoadmapItem {
  order: number;
  title: string;
  description: string;
  action_type: 'take_test' | 'retake_test' | 'practice';
  test_id?: number;
  test_title?: string;
  priority: 'high' | 'medium' | 'low';
  estimated_minutes: number;
}

interface InsightsData {
  readiness_score: number;
  strongest_skill: { name: string; score: number } | null;
  weakest_skill: { name: string; score: number } | null;
  radar_data: RadarDatum[];
  gap_analysis: GapItem[];
  roadmap: RoadmapItem[];
  scoring_method: string;
  generated_at?: string;
  cached?: boolean;
  empty?: boolean;
  message?: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 400, damping: 30 } }
};

const glassCardClasses = "bg-[#111113] border border-[#2A2A2D] rounded-3xl p-6 relative overflow-hidden group transition-all duration-300";

const statusConfig = {
  above: {
    label: 'Above Market',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
    barColor: 'from-emerald-500 to-emerald-400',
    icon: '↗',
  },
  at: {
    label: 'At Market',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
    barColor: 'from-amber-500 to-amber-400',
    icon: '→',
  },
  below: {
    label: 'Below Market',
    color: 'text-rose-400',
    bg: 'bg-rose-400/10',
    border: 'border-rose-400/20',
    barColor: 'from-rose-500 to-rose-400',
    icon: '↘',
  },
};

const priorityConfig = {
  high: { label: 'HIGH', color: 'text-rose-400', bg: 'bg-rose-400/15', border: 'border-rose-400/30' },
  medium: { label: 'MED', color: 'text-amber-400', bg: 'bg-amber-400/15', border: 'border-amber-400/30' },
  low: { label: 'LOW', color: 'text-sky-400', bg: 'bg-sky-400/15', border: 'border-sky-400/30' },
};

export function SkillInsights({ onStartTest }: { onStartTest: (testId: number) => void }) {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/assessments/skill-insights/');
        setData(res.data);
      } catch (err: any) {
        console.error('Failed to fetch skill insights:', err);
        if (err.response?.status === 503) {
          setError('Unable to generate insights right now. Please try again later.');
        } else if (err.response?.status === 403) {
          setError('Skill insights are available for candidates only.');
        } else {
          setError('Something went wrong. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  // LOADING STATE
  if (loading) {
    return (
      <div className="space-y-6 p-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonLoader type="card" />
          <SkeletonLoader type="card" />
          <SkeletonLoader type="card" />
        </div>
        <SkeletonLoader type="card" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonLoader type="card" />
          <SkeletonLoader type="card" />
        </div>
      </div>
    );
  }

  // ERROR STATE
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${glassCardClasses} text-center py-16`}
      >
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-rose-400/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="font-sans tracking-tight text-xl text-white mb-2">Insight Generation Unavailable</h3>
          <p className="font-mono text-xs text-[#A0A0A3] max-w-md mx-auto mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[#1E1E21] hover:bg-white/20 border border-[#3A3A3D] text-white font-mono text-xs uppercase tracking-widest rounded-xl transition-all"
          >
            Retry
          </button>
        </div>
      </motion.div>
    );
  }

  // EMPTY STATE
  if (!data || data.empty) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${glassCardClasses} text-center py-20`}
      >
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-brand-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-brand-secondary/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 rounded-3xl flex items-center justify-center border border-[#2A2A2D]">
            <span className="text-4xl">🧠</span>
          </div>
          <h3 className="font-sans tracking-tight text-2xl text-white mb-3">Unlock Your Skill Insights</h3>
          <p className="font-mono text-xs text-[#A0A0A3] max-w-lg mx-auto mb-8 leading-relaxed">
            {data?.message || "Complete your first assessment to unlock personalized AI-powered skill gap analysis, market comparisons, and a tailored learning roadmap."}
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-mono text-xs uppercase tracking-widest rounded-2xl hover: transition-all duration-300 font-bold"
          >
            Take Your First Test →
          </button>
        </div>
      </motion.div>
    );
  }

  // SUCCESS STATE
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 p-2"
    >
      {/* ── HEADER: Readiness Score + Quick Stats ─────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Readiness Score */}
        <div className={`${glassCardClasses} md:col-span-1 flex flex-col items-center justify-center text-center hover:bg-[#1E1E21] hover:`}>
          <div className="absolute -top-20 -left-20 w-48 h-48 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 rounded-full blur-3xl group-hover:from-brand-primary/30 group-hover:to-brand-secondary/30 transition-colors duration-500" />
          <div className="relative z-10">
            <p className="font-mono text-[9px] text-[#A0A0A3] font-bold uppercase tracking-[0.25em] mb-3">Career Readiness</p>
            <div className="text-7xl font-sans tracking-tight font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-white/60 leading-none tracking-tighter drop-shadow-sm mb-2">
              <AnimatedCounter target={data.readiness_score} duration={2} />
            </div>
            <p className="font-mono text-[10px] text-[#6A6A6D] uppercase tracking-widest">out of 100</p>
            {data.scoring_method === 'ai' && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                <span className="font-mono text-[8px] text-brand-primary uppercase tracking-widest font-bold">AI-Analyzed</span>
              </div>
            )}
          </div>
        </div>

        {/* Strongest Skill */}
        <div className={`${glassCardClasses} hover:bg-[#1E1E21] hover:`}>
          <div className="absolute -top-16 -right-16 w-32 h-32 bg-emerald-400/15 rounded-full blur-3xl group-hover:bg-emerald-400/25 transition-colors duration-500" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-mono text-[9px] text-[#A0A0A3] font-bold uppercase tracking-[0.25em]">Strongest Skill</p>
              </div>
              <div className="w-10 h-10 bg-emerald-400/10 rounded-xl flex items-center justify-center border border-emerald-400/20">
                <span className="text-lg">💪</span>
              </div>
            </div>
            <div className="text-3xl font-sans tracking-tight font-bold text-white mb-1 tracking-tight">{data.strongest_skill?.name || '—'}</div>
            <div className="flex items-center gap-2">
              <span className="text-4xl font-sans tracking-tight font-bold text-emerald-400 leading-none">
                {data.strongest_skill?.score || 0}
              </span>
              <span className="font-mono text-[9px] text-[#6A6A6D] uppercase">score</span>
            </div>
          </div>
        </div>

        {/* Weakest Skill */}
        <div className={`${glassCardClasses} hover:bg-[#1E1E21] hover:`}>
          <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-rose-400/15 rounded-full blur-3xl group-hover:bg-rose-400/25 transition-colors duration-500" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-mono text-[9px] text-[#A0A0A3] font-bold uppercase tracking-[0.25em]">Needs Attention</p>
              </div>
              <div className="w-10 h-10 bg-rose-400/10 rounded-xl flex items-center justify-center border border-rose-400/20">
                <span className="text-lg">🎯</span>
              </div>
            </div>
            <div className="text-3xl font-sans tracking-tight font-bold text-white mb-1 tracking-tight">{data.weakest_skill?.name || '—'}</div>
            <div className="flex items-center gap-2">
              <span className="text-4xl font-sans tracking-tight font-bold text-rose-400 leading-none">
                {data.weakest_skill?.score || 0}
              </span>
              <span className="font-mono text-[9px] text-[#6A6A6D] uppercase">score</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── RADAR CHART: Skill vs Market ─────────────────────────── */}
      {data.radar_data.length > 0 && (
        <motion.div variants={itemVariants} className={`${glassCardClasses} hover:bg-[#1E1E21]`}>
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-sans tracking-tight text-xl font-bold text-white tracking-tight">Skill Radar</h3>
                <p className="font-mono text-[9px] text-[#A0A0A3] font-bold uppercase tracking-[0.2em] mt-1">Your skills vs platform average</p>
              </div>
              <div className="flex items-center gap-4 font-mono text-[9px] uppercase tracking-widest">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-primary" />
                  <span className="text-[#A0A0A3]">You</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-white/30" />
                  <span className="text-[#A0A0A3]">Market Avg</span>
                </span>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data.radar_data}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis
                    dataKey="skill"
                    tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
                    axisLine={false}
                  />
                  <Radar
                    name="Market Avg"
                    dataKey="market_avg"
                    stroke="rgba(255,255,255,0.3)"
                    fill="rgba(255,255,255,0.05)"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                  />
                  <Radar
                    name="Your Score"
                    dataKey="score"
                    stroke="#3B82F6"
                    fill="rgba(59,130,246,0.15)"
                    strokeWidth={2.5}
                    dot={{ fill: '#3B82F6', r: 4, strokeWidth: 0 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15,23,42,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      fontFamily: 'IBM Plex Mono',
                      fontSize: '11px',
                      color: '#fff',
                      padding: '8px 12px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── GAP ANALYSIS CARDS ───────────────────────────────────── */}
      {data.gap_analysis.length > 0 && (
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-4 px-1">
            <div>
              <h3 className="font-sans tracking-tight text-xl font-bold text-white tracking-tight">Gap Analysis</h3>
              <p className="font-mono text-[9px] text-[#A0A0A3] font-bold uppercase tracking-[0.2em] mt-1">How your skills compare to market demand</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.gap_analysis.map((gap, idx) => {
              const config = statusConfig[gap.status];
              return (
                <motion.div
                  key={gap.skill}
                  variants={itemVariants}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className={`${glassCardClasses} hover:bg-[#1E1E21] hover: cursor-default`}
                >
                  {/* Status indicator blob */}
                  <div className={`absolute -top-12 -right-12 w-24 h-24 ${gap.status === 'above' ? 'bg-emerald-400/10' : gap.status === 'below' ? 'bg-rose-400/10' : 'bg-amber-400/10'} rounded-full blur-2xl`} />
                  
                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-sans tracking-tight text-lg font-bold text-white">{gap.skill}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${config.bg} ${config.color} ${config.border} border`}>
                            <span>{config.icon}</span> {config.label}
                          </span>
                          {gap.is_in_demand && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                              🔥 In Demand
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-3xl font-sans tracking-tight font-bold ${config.color}`}>{gap.score}</div>
                        <div className="font-mono text-[9px] text-[#6A6A6D]">vs {gap.market_avg} avg</div>
                      </div>
                    </div>

                    {/* Score Bar */}
                    <div className="mb-4">
                      <div className="w-full bg-[#141415] h-2 rounded-full overflow-hidden border border-[#1E1E21]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(gap.score, 100)}%` }}
                          transition={{ duration: 1, delay: 0.3 + idx * 0.1, ease: "easeOut" }}
                          className={`bg-gradient-to-r ${config.barColor} h-2 rounded-full relative`}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] -translate-x-full" />
                        </motion.div>
                      </div>
                      {/* Market average marker */}
                      <div className="relative h-0 mt-0">
                        <div
                          className="absolute w-0.5 h-3 bg-white/30 -top-3 rounded-full"
                          style={{ left: `${Math.min(gap.market_avg, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Tips */}
                    <div className="space-y-2 mt-5">
                      {gap.tips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-white/30 mt-0.5 text-xs shrink-0">→</span>
                          <p className="font-mono text-[10px] text-[#A0A0A3] leading-relaxed">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── PERSONALIZED LEARNING ROADMAP ─────────────────────────── */}
      {data.roadmap.length > 0 && (
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-4 px-1">
            <div>
              <h3 className="font-sans tracking-tight text-xl font-bold text-white tracking-tight">Your Learning Roadmap</h3>
              <p className="font-mono text-[9px] text-[#A0A0A3] font-bold uppercase tracking-[0.2em] mt-1">AI-recommended next steps to grow your profile</p>
            </div>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[23px] top-8 bottom-8 w-px bg-gradient-to-b from-brand-primary/40 via-brand-secondary/40 to-transparent" />

            <div className="space-y-4">
              {data.roadmap.map((step, idx) => {
                const pConfig = priorityConfig[step.priority];
                return (
                  <motion.div
                    key={step.order}
                    variants={itemVariants}
                    whileHover={{ x: 6 }}
                    className={`${glassCardClasses} pl-14 hover:bg-[#1E1E21] hover:`}
                  >
                    {/* Step number circle */}
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center z-20 ">
                      <span className="font-mono text-[9px] text-white font-bold">{step.order}</span>
                    </div>

                    <div className="relative z-10">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <h4 className="font-sans tracking-tight text-base font-bold text-white">{step.title}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-mono font-bold uppercase tracking-widest ${pConfig.bg} ${pConfig.color} border ${pConfig.border}`}>
                              {pConfig.label}
                            </span>
                            {step.estimated_minutes && (
                              <span className="px-2 py-0.5 rounded-full text-[8px] font-mono font-bold uppercase tracking-widest bg-[#141415] text-[#6A6A6D] border border-[#2A2A2D]">
                                ~{step.estimated_minutes}min
                              </span>
                            )}
                          </div>
                          <p className="font-mono text-[10px] text-[#A0A0A3] leading-relaxed">{step.description}</p>
                        </div>

                        {step.test_id && (step.action_type === 'take_test' || step.action_type === 'retake_test') && (
                          <button
                            onClick={() => onStartTest(step.test_id!)}
                            className="shrink-0 px-5 py-2.5 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-mono text-[10px] uppercase tracking-widest rounded-xl hover: transition-all duration-300 font-bold whitespace-nowrap"
                          >
                            {step.action_type === 'retake_test' ? 'Retake Test' : 'Start Test'} →
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── FOOTER: Generation Info ───────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex items-center justify-between px-2 pt-2">
        <div className="flex items-center gap-3">
          {data.cached && (
            <span className="font-mono text-[9px] text-white/30 uppercase tracking-widest">
              Cached result • Updates when you complete a new assessment
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${data.scoring_method === 'ai' ? 'bg-brand-primary' : 'bg-amber-400'}`} />
          <span className="font-mono text-[9px] text-white/30 uppercase tracking-widest">
            {data.scoring_method === 'ai' ? 'AI-Generated Insights' : 'Rule-Based Analysis'}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
