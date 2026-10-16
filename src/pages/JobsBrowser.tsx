import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { EmptyState } from '../components/EmptyState';
import { Loader } from '../components/Loader';
import { useAuthStore } from '../store/authStore';
import { PracticeAssignmentModal } from '../components/PracticeAssignmentModal';
import toast from 'react-hot-toast';


interface JobListing {
  id: number;
  company_name: string;
  role_title: string;
  description: string;
  location?: string;
  salary_range?: string;
  min_score?: number;
  is_active: boolean;
  required_tests: {
    id: number;
    title: string;
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

export function JobsBrowser() {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'eligible' | 'test_required' | 'applied'>('all');
  const [applyingJobId, setApplyingJobId] = useState<number | null>(null);
  const [selectedPracticeJob, setSelectedPracticeJob] = useState<any | null>(null);
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);
  const { user } = useAuthStore();

  const navigate = useNavigate();

  useEffect(() => {
    const isAuthorized = user?.role === 'candidate' || ['admin', 'superadmin', 'manager'].includes(user?.role || '') || (user as any)?.is_staff;
    if (!isAuthorized) {
      navigate('/');
      return;
    }
    
    api.get(`/jobs/?search=${search}`)
      .then(res => setJobs(res.data.results || res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [search, user, navigate]);

  const handleApply = async (jobId: number) => {
    try {
      setApplyingJobId(jobId);
      toast.loading('Submitting application with your verified score...', { id: `apply-${jobId}` });
      await api.post(`/jobs/${jobId}/apply/`);
      toast.success('🎉 Application submitted with verified skill score!', { id: `apply-${jobId}` });
      // Refresh list
      const res = await api.get(`/jobs/?search=${search}`);
      setJobs(res.data.results || res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to apply', { id: `apply-${jobId}` });
    } finally {
      setApplyingJobId(null);
    }
  };

  const handleStartTest = async (testId: number) => {
    try {
      const response = await api.post('/assessments/start/', { test_id: testId });
      navigate(`/test/${response.data.attempt_id}`);
    } catch (err) {
      toast.error('Failed to initialize assessment');
    }
  };

  if (loading) return <Loader />;

  const eligibleCount = jobs.filter(j => j.candidate_eligibility?.is_eligible).length;
  const testRequiredCount = jobs.filter(j => j.candidate_eligibility?.status === 'test_required' || j.candidate_eligibility?.status === 'score_too_low').length;
  const appliedCount = jobs.filter(j => j.candidate_eligibility?.has_applied).length;

  const filteredJobs = jobs.filter(j => {
    if (filter === 'eligible') return j.candidate_eligibility?.is_eligible;
    if (filter === 'test_required') return j.candidate_eligibility?.status === 'test_required' || j.candidate_eligibility?.status === 'score_too_low';
    if (filter === 'applied') return j.candidate_eligibility?.has_applied;
    return true;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 bg-mesh min-h-screen"
    >
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-[#0A0A0B] text-white mb-8 border-b-4 border-verification">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, #ffffff 40px, #ffffff 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, #ffffff 40px, #ffffff 41px)`,
        }} />
        
        <div className="relative max-w-6xl mx-auto px-8 py-14">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-mono text-[10px] text-verification uppercase tracking-[0.4em] mb-3 flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-verification animate-pulse" />
            AI COMPETENCY VERIFICATION MATCHING
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-sans text-4xl md:text-5xl mb-3 font-bold tracking-tight"
          >
            Score-Qualified Career Roles
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-[#A0A0A3] text-sm md:text-base font-light max-w-2xl leading-relaxed"
          >
            Roles unlock automatically as you pass required proctored assessments. Recruiter screening is automated with your cryptographically verified test score.
          </motion.p>

          {/* Quick Metrics */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#A0A0A3] block">Total Roles</span>
              <span className="font-sans text-2xl font-bold text-white mt-1 block">{jobs.length}</span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
              <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-400 block">Eligible to Apply</span>
              <span className="font-sans text-2xl font-bold text-emerald-300 mt-1 block">{eligibleCount}</span>
            </div>
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 backdrop-blur-sm">
              <span className="font-mono text-[10px] uppercase tracking-widest text-amber-400 block">Test Needed</span>
              <span className="font-sans text-2xl font-bold text-amber-300 mt-1 block">{testRequiredCount}</span>
            </div>
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm">
              <span className="font-mono text-[10px] uppercase tracking-widest text-purple-400 block">Applications Sent</span>
              <span className="font-sans text-2xl font-bold text-purple-300 mt-1 block">{appliedCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 pb-20">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-sm">🔍</span>
            </div>
            <input
              type="text"
              placeholder="Search by role or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-[#2A2A2D]/20 rounded-xl font-mono text-sm focus:outline-none focus:border-verification focus:ring-2 focus:ring-verification/20 transition-all shadow-sm"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl font-mono text-xs uppercase tracking-wider transition-all font-bold ${
                filter === 'all'
                  ? 'bg-[#0A0A0B] text-white shadow-md'
                  : 'bg-white border border-[#2A2A2D]/20 text-[#0A0A0B]/70 hover:bg-gray-100'
              }`}
            >
              All Roles ({jobs.length})
            </button>
            <button
              onClick={() => setFilter('eligible')}
              className={`px-4 py-2 rounded-xl font-mono text-xs uppercase tracking-wider transition-all font-bold flex items-center gap-1.5 ${
                filter === 'eligible'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
            >
              <span>🟢</span> Eligible ({eligibleCount})
            </button>
            <button
              onClick={() => setFilter('test_required')}
              className={`px-4 py-2 rounded-xl font-mono text-xs uppercase tracking-wider transition-all font-bold flex items-center gap-1.5 ${
                filter === 'test_required'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-amber-500/10 text-amber-700 border border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              <span>🟡</span> Needs Assessment ({testRequiredCount})
            </button>
            {appliedCount > 0 && (
              <button
                onClick={() => setFilter('applied')}
                className={`px-4 py-2 rounded-xl font-mono text-xs uppercase tracking-wider transition-all font-bold flex items-center gap-1.5 ${
                  filter === 'applied'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-purple-500/10 text-purple-700 border border-purple-500/30 hover:bg-purple-500/20'
                }`}
              >
                <span>🟣</span> Applied ({appliedCount})
              </button>
            )}
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <EmptyState message="No job listings found for the selected filter." />
        ) : (
          <motion.div 
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredJobs.map((job) => {
              const elig = job.candidate_eligibility;
              const isEligible = elig?.is_eligible;
              const hasApplied = elig?.has_applied;
              const minScoreReq = job.min_score || 70;

              return (
                <motion.div 
                  variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                  whileHover={{ y: -4 }}
                  key={job.id}
                  className={`bg-white border rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative group flex flex-col justify-between ${
                    isEligible 
                      ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' 
                      : 'border-structure/30'
                  }`}
                >
                  <div>
                    {/* Header: Company & Eligibility Pill */}
                    <div className="flex justify-between items-start mb-4 gap-2">
                      <span className="font-mono text-xs font-bold text-[#0A0A0B]/70 bg-gray-100 px-3 py-1 rounded-full">
                        {job.company_name}
                      </span>
                      {hasApplied ? (
                        <span className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 bg-purple-500/10 text-purple-700 border border-purple-500/20 rounded-full font-bold">
                          ✓ Applied
                        </span>
                      ) : isEligible ? (
                        <span className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 rounded-full font-bold flex items-center gap-1">
                          <span>✓</span> Eligible
                        </span>
                      ) : (
                        <span className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 bg-amber-500/10 text-amber-700 border border-amber-500/20 rounded-full font-bold">
                          Test Required
                        </span>
                      )}
                    </div>

                    <h3 className="font-sans text-xl font-bold text-[#0A0A0B] leading-tight mb-2 group-hover:text-emerald-600 transition-colors">
                      {job.role_title}
                    </h3>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap gap-2 text-xs font-mono text-[#0A0A0B]/60 mb-4">
                      {job.location && <span className="bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md">📍 {job.location}</span>}
                      {job.salary_range && <span className="bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md">💰 {job.salary_range}</span>}
                      <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                        Min: {minScoreReq}%
                      </span>
                    </div>

                    {/* Score Status Box */}
                    <div className={`p-3.5 rounded-2xl mb-4 border ${
                      isEligible 
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                        : elig?.status === 'score_too_low'
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : 'bg-amber-50/70 border-amber-200 text-amber-900'
                    }`}>
                      {isEligible ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[10px] font-mono uppercase tracking-wider font-bold text-emerald-700">Verified Score Match</div>
                            <div className="font-sans font-bold text-base text-emerald-800">
                              Your Score: {elig.candidate_score}%
                            </div>
                          </div>
                          <span className="text-2xl">🎯</span>
                        </div>
                      ) : elig?.status === 'score_too_low' ? (
                        <div>
                          <div className="text-[10px] font-mono uppercase tracking-wider font-bold text-rose-700">Score Below Threshold</div>
                          <div className="font-sans text-xs text-rose-800 mt-0.5">
                            Your Score: {elig.candidate_score}% &lt; {minScoreReq}% Required
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-800">Requires Skill Assessment</div>
                          <div className="font-sans text-xs text-amber-900/80 mt-0.5">
                            Complete {elig?.missing_tests?.[0]?.title || 'required test'} to unlock.
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Required tests pills */}
                    <div className="space-y-1 mb-6">
                      <div className="text-[10px] font-mono text-[#0A0A0B]/50 uppercase tracking-widest">Required Tests:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {job.required_tests.map(test => {
                          const completed = elig?.completed_tests?.find(c => c.id === test.id);
                          return (
                            <span 
                              key={test.id} 
                              className={`px-2 py-1 font-mono text-[9px] uppercase tracking-wider rounded-md border ${
                                completed?.passed 
                                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 font-bold' 
                                  : 'bg-gray-100 text-gray-700 border-gray-200'
                              }`}
                            >
                              {completed?.passed ? '✓ ' : '○ '}{test.title}
                              {completed ? ` (${completed.score}%)` : ''}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    {hasApplied ? (
                      <button
                        disabled
                        className="w-full text-center px-4 py-3 bg-purple-100 text-purple-700 font-mono text-xs uppercase tracking-widest rounded-xl font-bold border border-purple-200 cursor-default"
                      >
                        ✓ Application Submitted
                      </button>
                    ) : isEligible ? (
                      <button
                        onClick={() => handleApply(job.id)}
                        disabled={applyingJobId === job.id}
                        className="w-full text-center px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs uppercase tracking-widest rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                      >
                        {applyingJobId === job.id ? 'Submitting...' : `Apply with Score (${elig?.candidate_score}%)`}
                      </button>
                    ) : elig?.missing_tests && elig.missing_tests.length > 0 ? (
                      <button
                        onClick={() => handleStartTest(elig.missing_tests[0].id)}
                        className="w-full text-center px-4 py-3 bg-[#0A0A0B] hover:bg-gray-800 text-white font-mono text-xs uppercase tracking-widest rounded-xl font-bold transition-all shadow-md"
                      >
                        Take Test to Unlock Role &rarr;
                      </button>
                    ) : (
                      <Link
                        to={`/jobs/${job.id}`}
                        className="w-full block text-center px-4 py-3 bg-[#0A0A0B] hover:bg-gray-800 text-white font-mono text-xs uppercase tracking-widest rounded-xl font-bold transition-all shadow-md"
                      >
                        View Details
                      </Link>
                    )}

                    {/* Take Practice Assignment Button */}
                    <button
                      onClick={() => {
                        setSelectedPracticeJob(job);
                        setIsPracticeModalOpen(true);
                      }}
                      className="w-full text-center px-4 py-2.5 bg-[#1E1E21] hover:bg-emerald-500/10 hover:border-emerald-500/40 text-emerald-600 font-mono text-xs uppercase tracking-wider rounded-xl font-bold transition-all border border-gray-200 flex items-center justify-center gap-2 group"
                    >
                      <span className="group-hover:scale-110 transition-transform">🎯</span> Take Practice Assignment
                    </button>

                    <Link
                      to={`/jobs/${job.id}`}
                      className="w-full block text-center text-xs font-mono text-[#0A0A0B]/60 hover:text-[#0A0A0B] transition-colors py-1"
                    >
                      View Role Details & AI Prep &rarr;
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Practice Assignment Modal */}
      <PracticeAssignmentModal
        job={selectedPracticeJob}
        isOpen={isPracticeModalOpen}
        onClose={() => setIsPracticeModalOpen(false)}
        onStartOfficialTest={(testId) => {
          setIsPracticeModalOpen(false);
          handleStartTest(testId);
        }}
      />
    </motion.div>
  );

}

