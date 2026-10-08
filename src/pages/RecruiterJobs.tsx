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
    if (user?.role !== 'recruiter') {
      navigate('/');
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
    <div className="flex-1 bg-vellum flex flex-col md:flex-row h-[calc(100vh-73px)]">
      {/* Sidebar: Job Listings */}
      <div className="w-full md:w-80 bg-white border-r border-structure/20 flex flex-col h-full shrink-0">
        <div className="p-6 border-b border-structure/20 bg-vellum">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-sans tracking-tight text-2xl text-[#0A0A0B]">My Listings</h2>
            <Link to="/jobs/post" className="w-8 h-8 flex items-center justify-center bg-[#0A0A0B] text-white rounded-full hover:hidden transition-colors">
              +
            </Link>
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1">
          {jobs.length === 0 ? (
            <div className="p-6 text-center text-[#0A0A0B]/50 font-mono text-xs">No active listings</div>
          ) : (
            jobs.map(job => (
              <button
                key={job.id}
                onClick={() => fetchApplicants(job)}
                className={`w-full text-left p-6 border-b border-structure/10 transition-colors ${
                  selectedJob?.id === job.id ? 'hidden/5 border-l-4 border-l-verification' : 'hover:bg-structure/5 border-l-4 border-l-transparent'
                }`}
              >
                <div className="font-sans tracking-tight text-lg text-[#0A0A0B] truncate mb-1">{job.role_title}</div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#0A0A0B]/60">{job.company_name}</div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Content: Applicants */}
      <div className="flex-1 bg-mesh bg-vellum overflow-y-auto p-8 md:p-12">
        {!selectedJob ? (
          <EmptyState message="Select a job listing to view applicants" />
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="font-sans tracking-tight text-4xl text-[#0A0A0B] mb-2">{selectedJob.role_title} Applicants</h1>
              <p className="font-mono text-xs uppercase tracking-widest text-verification">
                Ranked by Job Fit Score
              </p>
            </div>

            {loadingApplicants ? (
              <Loader />
            ) : applicants.length === 0 ? (
              <EmptyState message="No candidates have applied to this role yet." />
            ) : (
              <div className="bg-white border border-structure/20 shadow-sm rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#0A0A0B] text-white font-mono text-[10px] uppercase tracking-widest">
                      <th className="px-6 py-4">Rank</th>
                      <th className="px-6 py-4">Candidate</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Fit Score</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {applicants.map((app, idx) => (
                      <tr key={app.id} className="border-b border-structure/10 hover:bg-structure/5 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-[#0A0A0B]/50">#{idx + 1}</td>
                        <td className="px-6 py-4 font-sans tracking-tight text-lg text-[#0A0A0B]">{app.candidate_email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 font-mono text-[9px] uppercase tracking-widest rounded ${
                            app.status === 'completed' ? 'hidden/20 text-verification' : 'bg-structure/20 text-[#0A0A0B]/60'
                          }`}>
                            {app.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {app.overall_fit_score !== null ? (
                            <span className="font-sans tracking-tight text-2xl text-[#0A0A0B]">{app.overall_fit_score}</span>
                          ) : (
                            <span className="font-mono text-xs text-[#0A0A0B]/30">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link 
                            to={`/profile/${app.candidate_id}`}
                            className="font-mono text-[10px] uppercase tracking-widest text-verification hover:underline"
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
