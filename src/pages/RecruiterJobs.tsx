import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Loader } from '../components/Loader';
import { EmptyState } from '../components/EmptyState';

interface JobApplicant {
  id: number;
  candidate_id: number;
  candidate_email: string;
  status: string;
  overall_fit_score: number | null;
  completed_at: string | null;
}

interface RecruiterJob {
  id: number;
  company_name: string;
  role_title: string;
  is_active: boolean;
}

export function RecruiterJobs() {
  const [jobs, setJobs] = useState<RecruiterJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<RecruiterJob | null>(null);
  const [applicants, setApplicants] = useState<JobApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  useEffect(() => {
    if (user?.role === 'candidate') {
      navigate('/dashboard');
      return;
    }
    const isAuthorized = user?.role === 'recruiter' || ['admin', 'superadmin', 'manager'].includes(user?.role || '') || (user as any)?.is_staff;
    if (!isAuthorized) {
      navigate('/dashboard');
      return;
    }
    api.get('/jobs/my-listings/')
      .then(res => {
        const data = res.data.results || res.data;
        setJobs(data);
        if (data.length > 0) {
          fetchApplicants(data[0]);
        } else {
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [user, navigate]);

  const fetchApplicants = (job: RecruiterJob) => {
    setSelectedJob(job);
    setLoadingApplicants(true);
    api.get(`/jobs/my-listings/${job.id}/applicants/`)
      .then(res => setApplicants(res.data.results || res.data))
      .catch(err => console.error(err))
      .finally(() => {
        setLoadingApplicants(false);
        setLoading(false);
      });
  };

  if (loading) return <Loader />;

  return (
    <div className="flex-1 bg-[#0A0A0B] text-white flex flex-col md:flex-row h-[calc(100vh-73px)]">
      {/* Sidebar: Job Listings */}
      <div className="w-full md:w-80 bg-[#141415] border-r border-[#2A2A2D] flex flex-col h-full shrink-0">
        <div className="p-6 border-b border-[#2A2A2D]">
          <div className="flex justify-between items-center">
            <h2 className="font-sans font-bold text-xl text-white">My Listings</h2>
            <Link to="/jobs/post" className="w-8 h-8 flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 text-[#0A0A0B] font-bold rounded-xl transition-all shadow-md">
              +
            </Link>
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1 p-2 space-y-1">
          {jobs.length === 0 ? (
            <div className="p-6 text-center text-[#A0A0A3] font-mono text-xs">No active listings</div>
          ) : (
            jobs.map(job => (
              <button
                key={job.id}
                onClick={() => fetchApplicants(job)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedJob?.id === job.id 
                    ? 'bg-[#1E1E21] border-emerald-500/50 text-white' 
                    : 'bg-transparent border-transparent hover:bg-[#1E1E21]/60 text-[#D4D4D8]'
                }`}
              >
                <div className="font-sans font-bold text-base text-white truncate mb-1">{job.role_title}</div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#A0A0A3]">{job.company_name}</div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Content: Applicants */}
      <div className="flex-1 bg-[#0A0A0B] overflow-y-auto p-8 md:p-12">
        {!selectedJob ? (
          <EmptyState message="Select a job listing to view applicants" />
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-mono text-[10px] uppercase tracking-wider mb-3 font-bold">
                Ranked by Fit Score
              </div>
              <h1 className="font-sans font-bold text-3xl sm:text-4xl text-white mb-2">{selectedJob.role_title} Applicants</h1>
              <p className="font-mono text-xs text-[#A0A0A3]">
                Verified candidates who qualified through proctored competency assessments.
              </p>
            </div>

            {loadingApplicants ? (
              <Loader />
            ) : applicants.length === 0 ? (
              <EmptyState message="No candidates have applied to this role yet." />
            ) : (
              <div className="bg-[#141415] border border-[#2A2A2D] rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#1E1E21] text-[#A0A0A3] font-mono text-[10px] uppercase tracking-widest border-b border-[#2A2A2D]">
                      <th className="px-6 py-4">Rank</th>
                      <th className="px-6 py-4">Candidate</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Fit Score</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2A2D]">
                    {applicants.map((app, idx) => (
                      <tr key={app.id} className="hover:bg-[#1E1E21]/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-[#A0A0A3]">#{idx + 1}</td>
                        <td className="px-6 py-4 font-sans font-medium text-white">{app.candidate_email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider rounded-full border ${
                            app.status === 'completed' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold' 
                              : 'bg-white/5 text-[#A0A0A3] border-white/10'
                          }`}>
                            {app.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {app.overall_fit_score !== null ? (
                            <span className="font-sans font-bold text-xl text-emerald-400">{app.overall_fit_score}%</span>
                          ) : (
                            <span className="font-mono text-xs text-[#A0A0A3]">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link 
                            to={`/profile/${app.candidate_id}`}
                            className="font-mono text-xs uppercase tracking-widest text-emerald-400 hover:text-emerald-300 font-bold"
                          >
                            View Dossier &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
