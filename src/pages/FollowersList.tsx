import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Loader } from '../components/Loader';
import { EmptyState } from '../components/EmptyState';

interface Follower {
  id: number;
  recruiter_name: string;
  company_name: string;
  avatar_url: string | null;
  saved_at: string;
}

export function FollowersList() {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'candidate') {
      navigate('/');
      return;
    }

    api.get('/network/followers/')
      .then(res => setFollowers(res.data.results || res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (loading) return <Loader />;

  return (
    <div className="flex-1 bg-[#0A0A0B] text-white min-h-screen">
      <div className="relative overflow-hidden bg-[#141415] border-b border-[#2A2A2D] mb-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative max-w-4xl mx-auto px-8 py-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-mono text-[10px] uppercase tracking-wider mb-4 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Network Activity
          </div>
          <h1 className="font-sans font-bold text-4xl sm:text-5xl text-white mb-4 tracking-tight">
            Network Followers
          </h1>
          <p className="text-[#A0A0A3] text-sm md:text-base font-sans max-w-lg leading-relaxed">
            Recruiters actively tracking your verified skill dossier and portfolio.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 pb-20">
        {followers.length === 0 ? (
          <EmptyState message="No recruiters following yet — complete more verified skills to get noticed." />
        ) : (
          <div className="bg-[#141415] border border-[#2A2A2D] rounded-2xl shadow-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#1E1E21] text-[#A0A0A3] font-mono text-[10px] uppercase tracking-widest border-b border-[#2A2A2D]">
                  <th className="px-6 py-4">Recruiter</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4 text-right">Following Since</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2D]">
                {followers.map((follower) => (
                  <tr key={follower.id} className="hover:bg-[#1E1E21]/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#1E1E21] border border-[#2A2A2D] overflow-hidden flex items-center justify-center shrink-0">
                          {follower.avatar_url ? (
                            <img src={follower.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-sans font-bold text-emerald-400">{follower.recruiter_name.charAt(0)}</span>
                          )}
                        </div>
                        <span className="font-sans font-semibold text-white">
                          {follower.recruiter_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-mono text-xs uppercase tracking-widest text-[#D4D4D8]">
                        {follower.company_name}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="font-mono text-xs uppercase tracking-widest text-[#A0A0A3]">
                        {new Date(follower.saved_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
