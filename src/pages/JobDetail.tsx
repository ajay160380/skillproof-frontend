import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { Loader } from '../components/Loader';
import { useAuthStore } from '../store/authStore';
import { ScoreRing } from '../components/ScoreRing';
import { PracticeAssignmentModal } from '../components/PracticeAssignmentModal';
import { AIPrepGuideView } from '../components/AIPrepGuideView';
import toast from 'react-hot-toast';



interface JobDetail {
  id: number;
  recruiter_id?: number;
  company_name: string;
  role_title: string;
  description: string;
  location?: string;
  salary_range?: string;
  min_score?: number;
  required_tests: {
    id: number;
    title: string;
    duration_minutes?: number;
    category?: {
      name: string;
    };
  }[];
  candidate_eligibility?: {
    is_eligible: boolean;
    status: 'eligible' | 'test_required' | 'score_too_low' | 'applied';
    has_applied: boolean;
    candidate_score: number | null;
    min_score: number;
    completed_tests_count: number;
    total_required_tests: number;
    missing_tests: Array<{ id: number; title: string }>;
    completed_tests: Array<{ id: number; title: string; score: number; passed: boolean }>;
  };
}

interface CompanyRequirement {
  company_description: string;
  preferred_min_score: number | null;
  required_skills: { id: number; name: string }[];
}

interface JobProgress {
  status: string;
  overall_fit_score: number | null;
  completed_test_ids: number[];
}

export function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [progress, setProgress] = useState<JobProgress | null>(null);
  const [companyReqs, setCompanyReqs] = useState<CompanyRequirement | null>(null);
  const [loading, setLoading] = useState(true);
  const [prepGuide, setPrepGuide] = useState<string | null>(null);
  const [isGeneratingPrep, setIsGeneratingPrep] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);
  const { user } = useAuthStore();

  const navigate = useNavigate();

  useEffect(() => {
    const isAuthorized = user?.role === 'candidate' || ['admin', 'superadmin', 'manager'].includes(user?.role || '') || (user as any)?.is_staff;
    if (!isAuthorized) {
      navigate('/');
      return;
    }

    Promise.all([
      api.get(`/jobs/${id}/`),
      api.get(`/jobs/${id}/my-progress/`).catch(() => ({ data: null }))
    ])
    .then(([jobRes, progRes]) => {
      setJob(jobRes.data);
      setProgress(progRes.data);
      
      if (jobRes.data.recruiter_id) {
        api.get(`/jobs/company-requirements/${jobRes.data.recruiter_id}/`)
          .then(reqRes => setCompanyReqs(reqRes.data))
          .catch(() => {});
      }
    })
    .catch(() => {
      toast.error('Failed to load job details');
      navigate('/jobs');
    })
    .finally(() => setLoading(false));
  }, [id, user, navigate]);

  const handleApply = async () => {
    try {
      setIsApplying(true);
      toast.loading('Submitting application with your verified score...', { id: 'apply-job' });
      const res = await api.post(`/jobs/${id}/apply/`);
      setProgress(res.data);
      toast.success('🎉 Application submitted with verified skill score!', { id: 'apply-job' });
      
      // Refresh job data to sync eligibility status
      const jobRes = await api.get(`/jobs/${id}/`);
      setJob(jobRes.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit application', { id: 'apply-job' });
    } finally {
      setIsApplying(false);
    }
  };

  const startTest = (testId: number) => {
    navigate(`/test/${testId}`);
  };

  const generatePrepGuide = async () => {
    if (!job) return;
    setIsGeneratingPrep(true);
    try {
      const res = await api.post('/jobs/generate-prep/', {
        role_title: job.role_title,
        description: job.description
      });
      setPrepGuide(res.data.prep_guide);
      toast.success('Generated interview prep guide!');
    } catch (err) {
      toast.error('Failed to generate prep guide');
    } finally {
      setIsGeneratingPrep(false);
    }
  };

  if (loading) return <Loader />;
  if (!job) return <div className="text-white p-8">Job not found</div>;

  const elig = job.candidate_eligibility;
  const isEligible = elig?.is_eligible;
  const hasApplied = elig?.has_applied || progress?.status === 'completed' || (progress && progress.status !== 'not_started');
  const isCompleted = progress?.status === 'completed' || (elig?.has_applied && elig?.is_eligible);
  const completedTestIds = progress?.completed_test_ids || elig?.completed_tests?.map(c => c.id) || [];
  const minScoreReq = job.min_score || 70;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 bg-[#0A0A0B] text-white min-h-screen pb-20"
    >
      {/* Hero Header Section */}
      <div className="relative overflow-hidden bg-[#141415] border-b border-[#2A2A2D] py-12 px-6 lg:px-12 mb-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-5xl mx-auto">
          <button 
            onClick={() => navigate('/jobs')} 
            className="font-mono text-xs uppercase tracking-widest text-[#A0A0A3] hover:text-white transition-colors flex items-center gap-2 mb-8 group"
          >
            <span className="text-lg leading-none group-hover:-translate-x-1 transition-transform">&larr;</span> Back to Jobs
          </button>
          
          <motion.div initial={{ y: 20 }} animate={{ y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="px-3.5 py-1.5 bg-[#1E1E21] text-emerald-400 border border-[#2A2A2D] rounded-full font-mono text-xs uppercase tracking-wider font-bold">
                {job.company_name}
              </span>
              {job.location && (
                <span className="px-3 py-1 bg-[#1E1E21] text-[#D4D4D8] border border-[#2A2A2D] rounded-full font-mono text-xs">
                  📍 {job.location}
                </span>
              )}
              {job.salary_range && (
                <span className="px-3 py-1 bg-[#1E1E21] text-[#D4D4D8] border border-[#2A2A2D] rounded-full font-mono text-xs">
                  💰 {job.salary_range}
                </span>
              )}
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-mono text-xs font-bold">
                🎯 Min Score: {minScoreReq}%
              </span>
            </div>

            <h1 className="font-sans text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-6">
              {job.role_title}
            </h1>
          </motion.div>

          {/* Eligibility Banner & Action CTA */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className={`p-5 rounded-2xl border mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              isEligible
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                : elig?.status === 'score_too_low'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            }`}>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest font-bold">
                  {isEligible ? '🟢 Verified Skill Match' : elig?.status === 'score_too_low' ? '⚠️ Score Below Requirement' : '🟡 Assessment Required'}
                </div>
                <div className="text-sm text-white/90 font-sans mt-0.5">
                  {isEligible 
                    ? `Your Verified Score (${elig?.candidate_score}%) satisfies the minimum ${minScoreReq}% requirement! Ready to apply.`
                    : elig?.status === 'score_too_low'
                    ? `Your Score (${elig?.candidate_score}%) is below the required ${minScoreReq}%. Retake assessment to qualify.`
                    : `Complete the required assessment below to verify your skills and unlock direct application.`}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                {/* Practice Assignment Button */}
                <button
                  onClick={() => setIsPracticeModalOpen(true)}
                  className="px-6 py-3.5 bg-[#1E1E21] hover:bg-emerald-500/10 hover:border-emerald-500/40 text-emerald-400 border border-[#2A2A2D] rounded-xl font-mono text-xs uppercase tracking-widest font-bold shadow-md hover:scale-105 transition-all flex items-center gap-2"
                >
                  <span>🎯</span> Take Practice Assignment
                </button>

                {hasApplied ? (
                  <span className="px-6 py-3.5 bg-purple-500/20 text-purple-300 font-mono text-xs uppercase tracking-widest rounded-xl font-bold border border-purple-500/30 inline-block">
                    ✓ Application Submitted
                  </span>
                ) : isEligible ? (
                  <button
                    onClick={handleApply}
                    disabled={isApplying}
                    className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-[#0A0A0B] rounded-xl font-mono text-xs uppercase tracking-widest font-bold shadow-xl hover:scale-105 transition-all disabled:opacity-50"
                  >
                    {isApplying ? 'Submitting...' : `Apply with Score (${elig?.candidate_score}%)`}
                  </button>
                ) : elig?.missing_tests && elig.missing_tests.length > 0 ? (
                  <button
                    onClick={() => startTest(elig.missing_tests[0].id)}
                    className="px-8 py-3.5 bg-white hover:bg-gray-100 text-[#0A0A0B] rounded-xl font-mono text-xs uppercase tracking-widest font-bold shadow-xl hover:scale-105 transition-all"
                  >
                    Take Assessment to Qualify &rarr;
                  </button>
                ) : (
                  <button
                    onClick={handleApply}
                    disabled={isApplying}
                    className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-[#0A0A0B] rounded-xl font-mono text-xs uppercase tracking-widest font-bold shadow-xl hover:scale-105 transition-all"
                  >
                    Start Verification
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* About Role Card */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
            className="md:col-span-2 bg-[#141415] border border-[#2A2A2D] rounded-3xl p-8 flex flex-col"
          >
            <div className="flex justify-between items-start mb-6">
              <h3 className="font-sans text-2xl font-bold text-white flex items-center gap-2.5">
                <span className="text-xl">📋</span> About the Role
              </h3>
              <button
                onClick={generatePrepGuide}
                disabled={isGeneratingPrep}
                className="font-mono text-xs flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl hover:bg-emerald-500/20 transition-all disabled:opacity-50"
              >
                <span>✨</span>
                {isGeneratingPrep ? 'Generating...' : 'AI Prep Guide'}
              </button>
            </div>
            
            {prepGuide && (
              <AIPrepGuideView guideText={prepGuide} onDismiss={() => setPrepGuide(null)} />
            )}

            
            <div className="text-[#D4D4D8] leading-relaxed whitespace-pre-wrap text-base flex-1">
              {job.description}
            </div>
          </motion.div>
          
          {/* Company Profile Card */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
            className="md:col-span-1 bg-[#141415] border border-[#2A2A2D] rounded-3xl p-8"
          >
            <h3 className="font-sans text-xl font-bold text-white mb-6 flex items-center gap-2.5">
              <span className="text-lg">🏢</span> Company
            </h3>
            
            <div className="mb-6 p-4 bg-[#1E1E21] rounded-2xl border border-[#2A2A2D]">
              <span className="block font-mono text-[10px] text-[#A0A0A3] uppercase tracking-widest mb-1">Target Score Threshold</span>
              <span className="font-sans text-3xl text-emerald-400 font-bold">{minScoreReq}%+</span>
            </div>

            {companyReqs?.company_description ? (
              <p className="text-sm text-[#A0A0A3] mb-6 leading-relaxed">
                {companyReqs.company_description}
              </p>
            ) : (
              <p className="text-sm text-[#A0A0A3] mb-6 leading-relaxed">
                {job.company_name} is actively hiring verified talent via SkillProof proctored competency tests.
              </p>
            )}

            {companyReqs?.required_skills && companyReqs.required_skills.length > 0 && (
              <div>
                <span className="block font-mono text-[10px] text-[#A0A0A3] uppercase tracking-widest mb-3">Core Tech Stack</span>
                <div className="flex flex-wrap gap-2">
                  {companyReqs.required_skills.map(s => (
                    <span key={s.id} className="font-mono text-[10px] px-3 py-1 bg-[#1E1E21] border border-[#2A2A2D] text-white uppercase tracking-wider rounded-lg">
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Fit Score Summary Ring (if completed) */}
        {isCompleted && (progress?.overall_fit_score !== null || elig?.candidate_score !== null) && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="mb-12 p-8 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-2 border-emerald-500/40 rounded-3xl flex flex-col md:flex-row items-center gap-8 justify-between relative overflow-hidden"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full font-mono text-[10px] uppercase tracking-wider mb-3 font-bold">
                <span>✓</span> Job Fit Verified
              </div>
              <h2 className="font-sans text-3xl font-bold text-white mb-2">Requirements Successfully Met</h2>
              <p className="text-sm text-[#D4D4D8] max-w-md leading-relaxed">
                You have passed all proctored skill assessments required for this role. Your verified portfolio has been transmitted to {job.company_name}.
              </p>
            </div>
            <div className="shrink-0">
              <ScoreRing percentage={progress?.overall_fit_score || elig?.candidate_score || 85} size={150} label="FIT SCORE" strokeWidth={5} />
            </div>
          </motion.div>
        )}

        {/* Required Assessments Action Plan */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
          <div className="flex items-center justify-between mb-6 border-b border-[#2A2A2D] pb-4">
            <div>
              <h3 className="font-sans text-2xl font-bold text-white">Required Assessments</h3>
              <p className="font-mono text-xs text-[#A0A0A3] mt-1">
                Passing scores directly unlock this role without HR phone screening.
              </p>
            </div>
            <span className="font-mono text-xs uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full font-bold">
              {completedTestIds.length} / {job.required_tests.length} Verified
            </span>
          </div>

          <div className="grid gap-4">
            {job.required_tests.map((test) => {
              const completedItem = elig?.completed_tests?.find(c => c.id === test.id);
              const isTestDone = completedTestIds.includes(test.id) || !!completedItem?.passed;
              const testScore = completedItem?.score;

              return (
                <div 
                  key={test.id} 
                  className={`bg-[#141415] border rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${
                    isTestDone 
                      ? 'border-emerald-500/40 bg-emerald-500/5' 
                      : 'border-[#2A2A2D] hover:border-[#3A3A3D]'
                  }`}
                >
                  <div>
                    <h4 className="font-sans text-xl font-bold text-white mb-1">{test.title}</h4>
                    <p className="font-mono text-xs text-[#A0A0A3]">
                      {test.category?.name || 'Skill Assessment'} • Proctored Sandbox
                    </p>
                  </div>
                  
                  {isTestDone ? (
                    <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-wider font-bold bg-[#1E1E21] px-4 py-2 rounded-xl border border-emerald-500/30">
                      <span>✓ Verified</span>
                      {testScore && <span>({testScore}%)</span>}
                    </div>
                  ) : (
                    <button
                      onClick={() => startTest(test.id)}
                      className="px-6 py-2.5 rounded-xl font-mono text-xs uppercase tracking-widest font-bold transition-all shadow-md bg-white hover:bg-emerald-400 hover:text-[#0A0A0B] text-[#0A0A0B]"
                    >
                      Take Assessment &rarr;
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Practice Assignment Modal */}
      {job && (
        <PracticeAssignmentModal
          job={job}
          isOpen={isPracticeModalOpen}
          onClose={() => setIsPracticeModalOpen(false)}
          onStartOfficialTest={(testId) => {
            setIsPracticeModalOpen(false);
            startTest(testId);
          }}
        />
      )}
    </motion.div>
  );
}


