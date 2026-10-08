import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { BadgeIcon, type BadgeLevel } from '../components/BadgeIcon';
import { EmptyState } from '../components/EmptyState';
import { Loader } from '../components/Loader';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { ProfileView } from '../components/profile/ProfileView';
import { MessagesView } from './MessagesView';
import { ScoreRing } from '../components/ScoreRing';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { NetworkDiscoveryWidget, FeedWidget } from '../components/network/NetworkWidgets';
import { useAuthStore } from '../store/authStore';
import { LogOut } from 'lucide-react';
import { getCachedRecruiterData, setCachedRecruiterData } from '../utils/dashboardCache';

// Interfaces
interface PublicBadge {
  id: string;
  skill_category: { name: string; slug: string };
  badge_level: string;
  overall_score?: number;
  sub_scores?: Record<string, number>;
  ai_feedback_text?: string;
  cheating_flags?: any;
  issued_at: string;
}

interface MarketplaceCandidate {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  public_badges: PublicBadge[];
}

interface SavedCandidate {
  id: number;
  candidate_detail: MarketplaceCandidate;
  saved_at: string;
  notes: string;
}

interface DashboardStats {
  total_verified_candidates: number;
  candidates_saved: number;
  average_verified_score: number;
  trending_skills: Array<{ name: string; slug: string; count: number }>;
}

export function RecruiterDashboard() {
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } }, exit: { opacity: 0, transition: { duration: 0.2 } } };
  const tabVariants = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } }, exit: { opacity: 0, y: -10, transition: { duration: 0.2 } } };

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'Dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const currentParams = Object.fromEntries(searchParams.entries());
    if (activeTab !== 'Dashboard') {
      if (currentParams.tab !== activeTab) {
        setSearchParams({ ...currentParams, tab: activeTab }, { replace: true });
      }
    } else {
      if (currentParams.tab) {
        const { tab, ...rest } = currentParams;
        setSearchParams(rest, { replace: true });
      }
    }
  }, [activeTab]);

  useEffect(() => {
    const urlTab = searchParams.get('tab') || 'Dashboard';
    if (urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [searchParams, activeTab]);
  const { user, logout } = useAuthStore();
  const cached = getCachedRecruiterData(user?.id);
  
  // Dashboard & Candidates State - Instantly hydrated from cache
  const [loading, setLoading] = useState(!cached);
  const [isColdStarting, setIsColdStarting] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(cached?.stats || null);
  const [candidates, setCandidates] = useState<MarketplaceCandidate[]>([]);
  const [savedCandidates, setSavedCandidates] = useState<SavedCandidate[]>(cached?.savedCandidates || []);
  const [talentMatches, setTalentMatches] = useState<any[]>([]);
  
  // Jobs & Interviews State
  const [jobs, setJobs] = useState<any[]>(cached?.jobs || []);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [selectedJobIdForApplicants, setSelectedJobIdForApplicants] = useState<number | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [minScore, setMinScore] = useState<number>(0);
  const [sortBy, setSortBy] = useState('highest_score');
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [sendingInvite, setSendingInvite] = useState<number | null>(null);

  // Requirements / Company Profile State
  const [reqCompany, setReqCompany] = useState(cached?.reqCompany || '');
  const [reqDesc, setReqDesc] = useState(cached?.reqDesc || '');
  const [reqMinScore, setReqMinScore] = useState<number | ''>(typeof cached?.reqMinScore === 'number' ? cached.reqMinScore : '');
  const [reqSkills, setReqSkills] = useState<string[]>(cached?.reqSkills || []);
  const [allCategories, setAllCategories] = useState<{id: number, slug: string, name: string}[]>(cached?.allCategories || []);
  const [savingReqs, setSavingReqs] = useState(false);

  // Settings State
  const [profile, setProfile] = useState<any>(cached?.profile || null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({ full_name: '', company_name: '', bio: '', avatar_url: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const availableSkills = stats?.trending_skills.map(s => ({ value: s.slug, label: s.name })) || [
    { value: 'python', label: 'Python' }, { value: 'react', label: 'React' }, { value: 'sql', label: 'SQL' }, { value: 'communication', label: 'Communication' }
  ];
  const badgeLevels = ['platinum', 'gold', 'silver', 'bronze'];

  useEffect(() => {
    if (!loading) {
      setIsColdStarting(false);
      return;
    }
    const timer = setTimeout(() => {
      setIsColdStarting(true);
    }, 1800);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    let isMounted = true;
    async function fetchAllData() {
      try {
        const [statsRes, reqsRes, catsRes, savedRes, jobsRes, profileRes] = await Promise.all([
          api.get('/marketplace/dashboard-stats/').catch(() => ({ data: null })),
          api.get('/jobs/company-requirements/').catch(() => ({ data: null })),
          api.get('/skills/categories/').catch(() => ({ data: { results: [] } })),
          api.get('/network/my-follows/').catch(() => ({ data: { results: [] } })),
          api.get('/jobs/my-listings/').catch(() => ({ data: { results: [] } })),
          api.get('/auth/me/').catch(() => ({ data: null }))
        ]);
        
        if (!isMounted) return;

        if (statsRes.data) setStats(statsRes.data);
        
        const cats = Array.isArray(catsRes.data) ? catsRes.data : catsRes.data.results || [];
        setAllCategories(cats);
        
        let cName = '';
        let cDesc = '';
        let cScore: number | '' = '';
        let cSkills: string[] = [];

        if (reqsRes.data) {
          cName = reqsRes.data.company_name || '';
          cDesc = reqsRes.data.company_description || '';
          cScore = reqsRes.data.preferred_min_score || '';
          cSkills = reqsRes.data.required_skills?.map((s: any) => s.id.toString()) || [];

          setReqCompany(cName);
          setReqDesc(cDesc);
          setReqMinScore(cScore);
          setReqSkills(cSkills);
        }

        const savedList = Array.isArray(savedRes.data) ? savedRes.data : savedRes.data.results || [];
        const jobsList = Array.isArray(jobsRes.data) ? jobsRes.data : jobsRes.data.results || [];

        setSavedCandidates(savedList);
        setJobs(jobsList);
        if (profileRes.data) setProfile(profileRes.data);

        setCachedRecruiterData(user?.id, {
          stats: statsRes.data,
          allCategories: cats,
          reqCompany: cName,
          reqDesc: cDesc,
          reqMinScore: cScore,
          reqSkills: cSkills,
          savedCandidates: savedList,
          jobs: jobsList,
          profile: profileRes.data,
        });

      } catch (err) {
        console.error('Failed to fetch initial data:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
          setIsColdStarting(false);
        }
      }
    }
    fetchAllData();
    return () => { isMounted = false; };
  }, [user?.id]);

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedQuery(searchQuery); }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchCandidates = useCallback(async () => {
    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      if (debouncedQuery) params.append('search', debouncedQuery);
      if (selectedSkills.length > 0) params.append('skill', selectedSkills.join(','));
      if (selectedLevels.length > 0) params.append('badge_level', selectedLevels.join(','));
      if (minScore > 0) params.append('min_score', minScore.toString());
      if (sortBy) params.append('sort_by', sortBy);

      const res = await api.get(`/marketplace/candidates/?${params.toString()}`);
      setCandidates(res.data.results || res.data || []);
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
    } finally {
      setIsSearching(false);
    }
  }, [debouncedQuery, selectedSkills, selectedLevels, minScore, sortBy]);

  const fetchTalentMatches = useCallback(async () => {
    setIsSearching(true);
    try {
      const res = await api.get('/jobs/talent-match/');
      setTalentMatches(res.data);
    } catch (err) {
      console.error('Failed to fetch talent matches:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const fetchInterviews = useCallback(async () => {
    try {
      const res = await api.get('/jobs/interviews/my-interviews/');
      setInterviews(res.data.results || res.data || []);
    } catch(e) {}
  }, []);

  useEffect(() => {
    if (activeTab === 'Explore Network') {
      fetchCandidates();
    } else if (activeTab === 'Dashboard') {
      fetchTalentMatches();
    } else if (activeTab === 'Interviews') {
      fetchInterviews();
    }
  }, [activeTab, fetchCandidates, fetchTalentMatches, fetchInterviews]);

  const fetchApplicantsForJob = async (jobId: number) => {
    try {
      const res = await api.get(`/jobs/my-listings/${jobId}/applicants/`);
      setApplicants(res.data.results || res.data || []);
      setSelectedJobIdForApplicants(jobId);
      setActiveTab('Applicants');
    } catch(e) { toast.error('Failed to fetch applicants'); }
  };

  const handleProposeInterview = async (candidateId: string, jobId?: number) => {
    setSendingInvite(Number(candidateId));
    try {
      // Create a proposed time of tomorrow at 10 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const data: any = { candidate_id: candidateId, proposed_time: tomorrow.toISOString(), message: 'We would love to interview you for an open role!' };
      if(jobId) data.job_listing_id = jobId;

      await api.post('/jobs/interviews/propose/', data);
      toast.success('Interview proposed successfully!');
    } catch (err) {
      toast.error('Failed to propose interview.');
    } finally {
      setSendingInvite(null);
    }
  };

  const toggleFollow = async (candidateId: string) => {
    const isFollowing = savedCandidates.some(s => s.candidate_detail.id === candidateId);
    try {
      if (isFollowing) {
        await api.delete(`/network/unfollow/${candidateId}/`);
        setSavedCandidates(prev => prev.filter(s => s.candidate_detail.id !== candidateId));
        setStats(prev => prev ? { ...prev, candidates_saved: prev.candidates_saved - 1 } : null);
        toast.success('Unfollowed candidate');
      } else {
        const res = await api.post('/network/follow/', { candidate_id: candidateId });
        setSavedCandidates(prev => [res.data, ...prev]);
        setStats(prev => prev ? { ...prev, candidates_saved: prev.candidates_saved + 1 } : null);
        toast.success('Following candidate');
      }
    } catch (err) {
      toast.error('Failed to update follow status');
    }
  };

  const handleSaveRequirements = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingReqs(true);
    try {
      await api.put('/jobs/company-requirements/', {
        company_name: reqCompany,
        company_description: reqDesc,
        preferred_min_score: reqMinScore === '' ? null : Number(reqMinScore),
        required_skill_ids: reqSkills
      });
      toast.success('Company profile updated');
    } catch (err) {
      toast.error('Failed to save company profile');
    } finally {
      setSavingReqs(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      const res = await api.patch('/auth/me/', editProfileData);
      setProfile(res.data);
      setIsEditingProfile(false);
      toast.success('Profile updated');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const sidebarItems = [
    {
      category: 'OVERVIEW',
      items: [
        { id: 'Dashboard', icon: '📊', label: 'Dashboard' },
      ]
    },
    {
      category: 'TALENT',
      items: [
        { id: 'Explore Network', icon: '🔍', label: 'Explore Network' },
        { id: 'Leaderboard', icon: '🏆', label: 'Leaderboard', isLink: true, url: '/leaderboard' },
      ]
    },
    {
      category: 'HIRING',
      items: [
        { id: 'Job Listings', icon: '💼', label: 'Job Listings' },
        { id: 'Applicants', icon: '📄', label: 'Applicants' },
        { id: 'Interviews', icon: '🗓️', label: 'Interviews' },
      ]
    },
    {
      category: 'NETWORK',
      items: [
        { id: 'Feed', icon: '📰', label: 'Feed' },
        { id: 'Explore Network', icon: '🔍', label: 'Explore Network' },
        { id: 'Messages', icon: '💬', label: 'Messages' },
      ]
    },
    {
      category: 'COMPANY',
      items: [
        { id: 'Company Profile', icon: '🏢', label: 'Company Profile' },
      ]
    },
    {
      category: 'SYSTEM',
      items: [
        { id: 'Settings', icon: '⚙️', label: 'Settings' },
      ]
    }
  ];

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-ink text-white p-6 relative">
        <div className="absolute inset-0 bg-mesh-dark opacity-100 pointer-events-none" />
        <Loader text="INITIALIZING RECRUITER SUITE..." size="lg" />
        {isColdStarting && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 max-w-md p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center text-xs text-amber-200 backdrop-blur-md"
          >
            <div className="font-mono font-bold tracking-wider text-amber-300 mb-1">CONNECTING TO CLOUD SERVER</div>
            <div className="text-[11px] text-amber-200/70">Render free tier spins up from sleep (~15-20s on first load). Loading candidate marketplace...</div>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-ink text-white relative">
      <div className="absolute inset-0 bg-mesh-dark opacity-100 pointer-events-none" />

      {/* Sidebar */}
      <div className="w-72 bg-white/5 backdrop-blur-3xl border-r border-white/10 flex flex-col h-full shrink-0 relative z-20 shadow-2xl">
        <div className="p-8 pb-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-tr from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)] ring-1 ring-white/20">
               <span className="font-serif font-bold text-white text-xl">S</span>
             </div>
             <div>
               <h3 className="font-serif text-2xl font-bold text-white tracking-tight leading-none">SkillProof</h3>
               <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-400 font-bold">Recruiter Suite</span>
             </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-8 scrollbar-hide">
          {sidebarItems.map(group => (
            <div key={group.category}>
              <h4 className="font-mono text-[10px] text-white/40 font-bold uppercase tracking-[0.25em] mb-3 px-4">{group.category}</h4>
              <ul className="space-y-1">
                {group.items.map(item => {
                  const isActive = activeTab === item.id;
                  return (
                    <li key={item.id} className="relative px-2">
                      {item.isLink ? (
                        <a
                          href={item.url}
                          className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group relative text-white/50 hover:bg-white/5 hover:text-white"
                        >
                          <span className="text-xl opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-transform duration-300">{item.icon}</span>
                          <span className="tracking-wide">{item.label}</span>
                        </a>
                      ) : (
                        <>
                          {/* Active Indicator Glow */}
                          {isActive && (
                            <motion.div 
                              layoutId="activeTabIndicatorRecruiter" 
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/4 bg-brand-primary rounded-r-full shadow-[0_0_12px_rgba(59,130,246,0.8)]" 
                            />
                          )}
                          <button
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group ${
                              isActive
                                ? 'bg-white/10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)] text-white border border-white/5 font-bold' 
                                : 'text-white/50 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <span className={`text-xl transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'group-hover:scale-110 opacity-70 group-hover:opacity-100'}`}>
                              {item.icon}
                            </span>
                            <span className="tracking-wide">{item.label}</span>
                          </button>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        
        {/* User Profile Snippet */}
        <div className="p-3.5 mx-4 mb-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-between group hover:bg-white/10 transition-all duration-300 relative overflow-hidden">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-sm">
               <div className="w-full h-full bg-ink rounded-[10px] flex items-center justify-center text-emerald-400 font-serif font-bold text-lg">
                 {user?.email?.charAt(0).toUpperCase() || 'R'}
               </div>
            </div>
            <div>
              <div className="text-sm font-bold text-white truncate w-24 tracking-tight">{user?.email ? user.email.split('@')[0] : 'Recruiter'}</div>
              <div className="text-[9.5px] font-mono font-bold text-emerald-400 uppercase tracking-widest mt-0.5">Recruiter</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            title="Log Out"
            className="text-white/40 hover:text-rose-400 hover:bg-rose-500/10 p-2 rounded-xl transition-colors relative z-10"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 h-full overflow-y-auto relative bg-transparent scrollbar-hide">
        <AnimatePresence mode="wait">
          
          {/* Dashboard Tab */}
          {activeTab === 'Dashboard' && (
            <motion.div key="dashboard" variants={tabVariants} initial="hidden" animate="show" exit="exit">
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden bg-gradient-to-r from-white/[0.08] to-white/[0.02] border-b border-white/10 text-white mb-8 shadow-2xl mx-4 mt-0 rounded-b-3xl"
              >
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, #ffffff 40px, #ffffff 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, #ffffff 40px, #ffffff 41px)`,
                }} />
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none" />
                
                <div className="relative max-w-5xl mx-auto px-8 py-12">
                  <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-emerald-400 mb-3 flex items-center gap-2 font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        HIRING INTELLIGENCE & TALENT PIPELINE
                      </div>
                      <h1 className="font-serif text-4xl md:text-5xl font-bold mb-3 tracking-tight text-white">
                        Welcome, {profile?.full_name || (user?.email ? user.email.split('@')[0] : 'Partner')}
                      </h1>
                      <p className="text-sm md:text-base text-white/70 max-w-xl leading-relaxed">
                        Track verified talent benchmarks, explore skill-certified candidates, and manage proctored requisitions.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <div className="max-w-5xl mx-auto px-8 pb-12 space-y-8">
                {/* Stats Grid */}
                {stats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-2xl border border-white/10 hover:border-emerald-500/30 rounded-3xl p-6 shadow-xl transition-all">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-2">Total Verified Talent</div>
                      <div className="text-4xl text-white font-serif font-bold"><AnimatedCounter target={stats.total_verified_candidates} /></div>
                      <p className="font-mono text-[9px] text-white/40 uppercase tracking-widest mt-2">Active proctored candidate pool</p>
                    </motion.div>
                    <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-2xl border border-white/10 hover:border-amber-500/30 rounded-3xl p-6 shadow-xl transition-all">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-amber-400 font-bold mb-2">Shortlisted Talent</div>
                      <div className="text-4xl text-white font-serif font-bold"><AnimatedCounter target={stats.candidates_saved} /></div>
                      <p className="font-mono text-[9px] text-white/40 uppercase tracking-widest mt-2">Saved profiles in requisition pipeline</p>
                    </motion.div>
                    <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-2xl border border-white/10 hover:border-brand-primary/30 rounded-3xl p-6 shadow-xl transition-all">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-brand-primary font-bold mb-2">Platform Score Benchmark</div>
                      <div className="text-4xl text-white font-serif font-bold flex items-baseline gap-1">
                        <AnimatedCounter target={stats.average_verified_score} />
                        <span className="text-lg text-white/40 font-mono">/100</span>
                      </div>
                      <p className="font-mono text-[9px] text-white/40 uppercase tracking-widest mt-2">Verified candidate median score</p>
                    </motion.div>
                  </div>
                )}

                {/* Talent Match AI Spotlight */}
                <div>
                  <h3 className="font-serif text-2xl font-bold text-white mb-6">Top AI Verified Matches</h3>
                  {isSearching ? (
                    <div className="py-20 flex justify-center"><Loader /></div>
                  ) : talentMatches.length === 0 ? (
                    <EmptyState 
                      title="No perfect matches yet" 
                      description="We couldn't find candidates matching your exact requirements. Try adjusting your preferred minimum scores in the Company Profile."
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {talentMatches.slice(0, 4).map((match, i) => (
                        <motion.div whileHover={{ y: -5 }} key={match.user_id} className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-2xl border border-white/10 hover:border-emerald-500/40 rounded-3xl p-6 hover:shadow-[0_16px_48px_rgba(16,185,129,0.15)] transition-all duration-300">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-serif text-xl text-white font-bold">{match.name || match.email.split('@')[0]}</h3>
                              <div className="font-mono text-[10px] text-white/50 uppercase tracking-widest">{match.email}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono text-[10px] uppercase text-emerald-400 font-bold tracking-widest">Global Rank</div>
                              <div className="font-serif text-2xl text-white font-bold">#{match.global_rank}</div>
                            </div>
                          </div>

                          <div className="mb-6">
                            <div className="font-mono text-[10px] text-white/50 uppercase tracking-widest mb-2.5">Top Verified Skills</div>
                            <div className="flex flex-wrap gap-2">
                              {match.top_skills.map((skill: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-1.5 border border-white/10 px-2.5 py-1.5 bg-white/5 rounded-xl text-[11px] font-mono font-bold text-white shadow-sm">
                                  <BadgeIcon level={skill.badge_level.toLowerCase() as BadgeLevel} size={14} />
                                  <span>{skill.skill_name}</span>
                                  <span className="text-emerald-400 font-mono">({skill.score}%)</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex gap-3">
                            <Link 
                              to={`/profile/${match.user_id}`} 
                              className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white text-center rounded-xl font-mono text-xs font-bold uppercase tracking-widest border border-white/10 transition-colors"
                            >
                              Dossier
                            </Link>
                            <button
                              onClick={() => handleProposeInterview(match.user_id.toString())}
                              disabled={sendingInvite === match.user_id}
                              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-ink text-center rounded-xl font-mono text-xs font-bold uppercase tracking-widest transition-all shadow-[0_4px_16px_rgba(16,185,129,0.3)] hover:scale-[1.02] disabled:opacity-50"
                            >
                              {sendingInvite === match.user_id ? 'Proposing...' : 'Propose Interview'}
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Explore Network Tab */}
          {activeTab === 'Explore Network' && (
            <motion.div key="explore-network" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-5xl mx-auto px-8 py-10 space-y-8">
              <h2 className="font-serif text-2xl font-bold text-white">Explore Verified Network</h2>
              <NetworkDiscoveryWidget />
            </motion.div>
          )}

          {/* Messages Tab */}
          {activeTab === 'Messages' && (
            <motion.div key="messages" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-6xl mx-auto px-4 sm:px-8 py-6 h-full">
              <MessagesView />
            </motion.div>
          )}

          {/* Job Listings Tab */}
          {activeTab === 'Job Listings' && (
            <motion.div key="jobs" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-5xl mx-auto px-8 py-10 space-y-8">
               <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-white">Your Requisitions</h2>
                    <p className="font-mono text-[10px] text-white/50 uppercase tracking-widest mt-0.5">Manage open roles and incoming applicant matches</p>
                  </div>
                  <button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-ink px-6 py-2.5 rounded-xl font-mono text-xs uppercase tracking-widest font-bold shadow-lg transition-all hover:scale-105">
                    + Post New Job
                  </button>
               </div>
               
               <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-sm min-h-[400px]">
                 {jobs.length > 0 ? (
                   <div className="space-y-4">
                     {jobs.map(job => (
                       <div key={job.id} className="flex flex-col md:flex-row justify-between items-start md:items-center border border-white/10 rounded-2xl p-6 bg-white/5 hover:bg-white/[0.08] hover:border-emerald-500/30 transition-all gap-4 text-white">
                         <div>
                           <h3 className="font-serif text-xl font-bold text-white">{job.role_title}</h3>
                           <p className="font-mono text-[10px] text-white/50 uppercase tracking-widest mt-1">Posted: {new Date(job.created_at).toLocaleDateString()}</p>
                         </div>
                         <div className="flex gap-3 w-full md:w-auto">
                           <button 
                             onClick={() => fetchApplicantsForJob(job.id)}
                             className="flex-1 md:flex-none px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-ink rounded-xl font-mono text-xs uppercase tracking-widest font-bold hover:scale-105 transition-all shadow-md"
                           >
                             View Applicants
                           </button>
                           <button className="flex-1 md:flex-none px-4 py-2.5 border border-white/15 hover:border-white/30 text-white rounded-xl font-mono text-xs uppercase tracking-widest transition-colors">
                             Edit
                           </button>
                         </div>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <EmptyState title="No active job listings" description="Post a job to start attracting verified talent." />
                 )}
               </div>
            </motion.div>
          )}

          {/* Applicants Tab */}
          {activeTab === 'Applicants' && (
            <motion.div key="applicants" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-5xl mx-auto px-8 py-10 space-y-8">
               <div className="flex gap-4 items-center mb-6">
                 <button onClick={() => setActiveTab('Job Listings')} className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
                   ←
                 </button>
                 <h2 className="font-serif text-2xl font-bold text-white">Job Applicants</h2>
               </div>
               
               <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-sm min-h-[400px]">
                 {applicants.length > 0 ? (
                   <div className="space-y-4">
                     {applicants.map(app => (
                       <div key={app.id} className="flex justify-between items-center border border-white/10 rounded-2xl p-6 bg-white/5 hover:bg-white/[0.08] text-white">
                         <div className="flex items-center gap-4">
                           {app.overall_fit_score ? (
                             <ScoreRing percentage={app.overall_fit_score} size={60} strokeWidth={3} />
                           ) : (
                             <div className="w-[60px] h-[60px] rounded-full bg-white/10 flex items-center justify-center font-mono text-[10px] text-white/50">TBD</div>
                           )}
                           <div>
                             <h3 className="font-serif text-lg font-bold text-white">{app.candidate_name || app.candidate_email}</h3>
                             <p className="font-mono text-[9px] uppercase tracking-widest text-emerald-400 font-bold mt-0.5">Status: {app.status}</p>
                           </div>
                         </div>
                         <div className="flex gap-2">
                           <Link to={`/profile/${app.candidate_id}`} className="px-4 py-2.5 border border-white/15 hover:border-white/30 text-white rounded-xl font-mono text-xs uppercase tracking-widest transition-colors">
                             Dossier
                           </Link>
                           <button onClick={() => handleProposeInterview(app.candidate_id.toString(), selectedJobIdForApplicants || undefined)} className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-ink rounded-xl font-mono text-xs uppercase tracking-widest font-bold hover:scale-105 transition-all shadow-md">
                             Propose Interview
                           </button>
                         </div>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <EmptyState title="No applicants yet" description="Wait for candidates to apply or actively reach out to talent." />
                 )}
               </div>
            </motion.div>
          )}

          {/* Interviews Tab */}
          {activeTab === 'Interviews' && (
            <motion.div key="interviews" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-5xl mx-auto px-8 py-10 space-y-8">
              <h2 className="font-serif text-2xl font-bold text-white">Proposed & Upcoming Interviews</h2>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-sm min-h-[400px]">
                {interviews.length > 0 ? (
                  <div className="space-y-4">
                    {interviews.map((interview, i) => (
                      <div key={i} className="flex flex-col md:flex-row justify-between md:items-center border border-white/10 rounded-2xl p-6 bg-white/5 hover:bg-white/[0.08] gap-4 text-white">
                        <div className="flex gap-6 items-center">
                          <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/15 text-white flex flex-col items-center justify-center leading-none shadow-sm">
                            <span className="font-mono text-[10px] uppercase tracking-widest opacity-70">
                              {new Date(interview.proposed_time).toLocaleDateString(undefined, { month: 'short' })}
                            </span>
                            <span className="font-serif font-bold text-xl mt-0.5">
                              {new Date(interview.proposed_time).getDate()}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-serif text-xl font-bold text-white">{interview.candidate_name || 'Candidate'}</h3>
                            <p className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest mt-1 mb-1 font-bold">{interview.job_role || 'General Interview'}</p>
                            <p className="font-mono text-[9px] text-white/50 uppercase tracking-widest">
                              Time: {new Date(interview.proposed_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                            <div className="mt-2 inline-block px-2.5 py-0.5 rounded font-mono text-[9px] uppercase tracking-widest font-bold border border-white/15 bg-white/5">
                              Status: <span className={interview.status === 'accepted' ? 'text-emerald-400' : interview.status === 'declined' ? 'text-rose-400' : 'text-amber-400'}>{interview.status}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                           <Link to={`/profile/${interview.candidate}`} className="px-6 py-2.5 border border-white/15 hover:border-white/30 text-white rounded-xl font-mono text-xs uppercase tracking-widest transition-colors inline-block">
                             View Candidate
                           </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No interviews scheduled" description="Propose interviews from the Talent Match or Applicants page." />
                )}
              </div>
            </motion.div>
          )}

          {/* Feed Tab */}
          {activeTab === 'Feed' && (
            <motion.div key="feed" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-3xl mx-auto px-8 py-10 space-y-8">
              <h2 className="font-serif text-2xl font-bold text-white">Professional Network</h2>
              <FeedWidget />
            </motion.div>
          )}

          {/* Company Profile Tab */}
          {activeTab === 'Company Profile' && (
            <motion.div key="company" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-3xl mx-auto px-8 py-10 space-y-8">
              <h2 className="font-serif text-2xl font-bold text-white">Company Requirements Profile</h2>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-sm text-white">
                <form onSubmit={handleSaveRequirements} className="space-y-6">
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-widest text-white/70 mb-2">Company Name</label>
                    <input
                      type="text" value={reqCompany} onChange={e => setReqCompany(e.target.value)}
                      className="w-full border border-white/10 rounded-xl p-4 focus:outline-none focus:border-emerald-400 font-mono text-sm bg-white/5 text-white placeholder-white/30"
                      placeholder="e.g. TechCorp" required
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-widest text-white/70 mb-2">Company Description</label>
                    <textarea
                      value={reqDesc} onChange={e => setReqDesc(e.target.value)}
                      className="w-full border border-white/10 rounded-xl p-4 focus:outline-none focus:border-emerald-400 text-sm min-h-[120px] bg-white/5 text-white placeholder-white/30"
                      placeholder="Tell candidates what you do..."
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-widest text-white/70 mb-2">Minimum Preferred Score</label>
                    <input
                      type="number" min="0" max="100" value={reqMinScore} onChange={e => setReqMinScore(e.target.value ? Number(e.target.value) : '')}
                      className="w-full md:w-1/3 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-emerald-400 font-mono text-sm bg-white/5 text-white placeholder-white/30"
                      placeholder="e.g. 75"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-widest text-white/70 mb-2">Required Core Skills</label>
                    <div className="flex flex-wrap gap-2">
                      {allCategories.map(cat => (
                        <button
                          key={cat.id} type="button"
                          onClick={() => setReqSkills(prev => prev.includes(cat.id.toString()) ? prev.filter(id => id !== cat.id.toString()) : [...prev, cat.id.toString()])}
                          className={`px-4 py-2 border rounded-xl font-mono text-[10px] uppercase tracking-widest transition-all ${
                            reqSkills.includes(cat.id.toString()) 
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold shadow-sm' 
                            : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:text-white'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="pt-6 border-t border-white/10">
                    <button type="submit" disabled={savingReqs} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-ink px-8 py-3.5 rounded-xl font-mono text-xs uppercase font-bold tracking-widest shadow-lg transition-all hover:scale-105 disabled:opacity-50">
                      {savingReqs ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeTab === 'Settings' && (
            <motion.div key="settings" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-3xl mx-auto px-8 py-10 space-y-8">
              <h2 className="font-serif text-2xl font-bold text-white">Settings</h2>
              
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-sm text-white">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-serif text-lg font-bold text-white">Personal Profile</h3>
                  {!isEditingProfile && (
                    <button onClick={() => setIsEditingProfile(true)} className="text-xs font-mono uppercase tracking-widest text-emerald-400 hover:text-emerald-300 underline font-bold">
                      Edit Profile
                    </button>
                  )}
                </div>
                
                {isEditingProfile ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-white/50 mb-1">Full Name</label>
                      <input type="text" value={editProfileData.full_name} onChange={e => setEditProfileData({...editProfileData, full_name: e.target.value})} className="w-full p-3.5 rounded-xl border border-white/10 bg-white/5 text-white font-mono text-sm focus:outline-none focus:border-emerald-400" />
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-white/50 mb-1">Bio</label>
                      <textarea value={editProfileData.bio} onChange={e => setEditProfileData({...editProfileData, bio: e.target.value})} className="w-full p-3.5 rounded-xl border border-white/10 bg-white/5 text-white font-mono text-sm focus:outline-none focus:border-emerald-400" rows={3} />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button onClick={handleSaveProfile} disabled={isSavingProfile} className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-ink rounded-xl font-mono text-xs uppercase font-bold tracking-widest shadow-lg hover:scale-105 transition-all">
                        {isSavingProfile ? 'Saving...' : 'Save'}
                      </button>
                      <button onClick={() => setIsEditingProfile(false)} className="px-6 py-2.5 border border-white/15 text-white rounded-xl font-mono text-xs uppercase font-bold tracking-widest hover:border-white/30 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-4 items-center">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-brand-primary/20 border border-white/20 text-white flex items-center justify-center font-serif text-2xl shadow-md">
                        {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-serif font-bold text-xl text-white">{profile?.full_name || (user?.email ? user.email.split('@')[0] : 'User')}</div>
                        <div className="font-mono text-xs text-white/50">{user?.email}</div>
                      </div>
                    </div>
                    {profile?.bio && (
                      <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/10 text-sm text-white/80 italic">
                        "{profile.bio}"
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-sm">
                 <h3 className="font-serif text-lg font-bold text-white mb-2">Account Actions</h3>
                 <p className="font-mono text-[10px] text-white/50 uppercase tracking-widest mb-6">Sign out of active session</p>
                 <button 
                  onClick={handleLogout} 
                  className="px-6 py-3 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 rounded-xl font-mono text-xs uppercase font-bold tracking-widest transition-colors flex items-center gap-2"
                >
                   <LogOut size={16} /> Log Out
                 </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
