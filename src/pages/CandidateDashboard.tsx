import React, { useEffect, useState } from 'react'; // AI features enabled
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { BadgeIcon, type BadgeLevel } from '../components/BadgeIcon';
import { Loader } from '../components/Loader';
import { useAuthStore } from '../store/authStore';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { ScoreRing } from '../components/ScoreRing';
import { StatusPill } from '../components/StatusPill';
import { ResumeUploader } from '../components/ResumeUploader';
import { getMyResume, getSuggestedTests, deleteResume, reparseResume, type Resume, type SuggestedTest } from '../services/resumeService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import toast from 'react-hot-toast';

import { ActivityStreakWidget, RecentJobMatchesWidget, UpcomingInterviewsWidget, PortfolioWidget } from '../components/dashboard/DashboardWidgets';
import { SkillInsights } from '../components/dashboard/SkillInsights';
import { FeedWidget, NetworkDiscoveryWidget, FollowersWidget } from '../components/network/NetworkWidgets';
import { ProfileView } from '../components/profile/ProfileView';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { PremiumToggle } from '../components/PremiumToggle';
import { MessagesView } from './MessagesView';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { LogOut } from 'lucide-react';
import { getCachedCandidateData, setCachedCandidateData } from '../utils/dashboardCache';

interface SkillTest {
  id: number;
  title: string;
  test_type: 'communication' | 'coding' | 'screen_task' | 'practical';
  difficulty: string;
  duration_minutes: number;
  category: { id: number; name: string };
}

interface SkillCategory {
  id: number;
  name: string;
  slug: string;
  icon: string;
  description: string;
}

interface Badge {
  id: number;
  skill_category: { id: number; name: string };
  badge_level: string;
  issued_at: string;
  overall_score?: number;
}

interface Attempt {
  id: number;
  status: string;
  score: { overall_score: number; ai_feedback_text: string } | null;
  test: { title: string; test_type: string };
  started_at: string;
  completed_at: string | null;
}

const CATEGORY_ICONS: Record<string, string> = {
  'file-json': '{ }',
  'message-circle': '💬',
  'database': '🗄️',
  'layout-template': '🎨',
};

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  easy: { label: 'EASY', color: 'text-verification', bg: 'hidden/10' },
  medium: { label: 'MEDIUM', color: 'text-amber-600', bg: 'bg-amber-50' },
  hard: { label: 'HARD', color: 'text-seal', bg: 'bg-seal/10' },
};

export function CandidateDashboard() {

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

const tabVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
};

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'Dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    const urlTab = searchParams.get('tab') || 'Dashboard';
    if (urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, activeTab]);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const cached = getCachedCandidateData(user?.id);

  const [categories, setCategories] = useState<SkillCategory[]>(cached?.categories || []);
  const [testsByCategory, setTestsByCategory] = useState<Record<number, SkillTest[]>>(cached?.testsByCategory || {});
  const [badges, setBadges] = useState<Record<number, Badge>>(cached?.badges || {});
  const [allBadges, setAllBadges] = useState<Badge[]>(cached?.allBadges || []);
  const [attempts, setAttempts] = useState<Attempt[]>(cached?.attempts || []);
  const [followersCount, setFollowersCount] = useState(cached?.followersCount || 0);
  const [latestFollowerCompany, setLatestFollowerCompany] = useState(cached?.latestFollowerCompany || '');
  const [invites, setInvites] = useState<any[]>(cached?.invites || []);
  const [showInvites, setShowInvites] = useState(false);
  const [analytics, setAnalytics] = useState<any>(cached?.analytics || null);
  const [articles, setArticles] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>(cached?.jobs || []);
  
  // Resume specific state
  const [resume, setResume] = useState<Resume | null>(cached?.resume || null);
  const [suggestedTests, setSuggestedTests] = useState<SuggestedTest[]>(cached?.suggestedTests || []);

  const [profile, setProfile] = useState<any>(cached?.profile || null);
  const [projects, setProjects] = useState<any[]>(cached?.projects || []);
  // Instant load if cache exists!
  const [loading, setLoading] = useState(!cached);
  const [isColdStarting, setIsColdStarting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  
  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({ full_name: '', company_name: '', bio: '', avatar_url: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Cold start timer for first-time visitors with no cache
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
    async function fetchData() {
      setIsSyncing(true);
      try {
        // Fetch ALL endpoints in a single parallel batch (no serial waiting!)
        const [
          catsRes,
          testsRes,
          badgesRes,
          attemptsRes,
          followersRes,
          invitesRes,
          analyticsRes,
          jobsRes,
          profileRes,
          projectsRes,
          myResumeRes
        ] = await Promise.all([
          api.get('/skills/categories/').catch(() => ({ data: [] })),
          api.get('/skills/tests/').catch(() => ({ data: [] })),
          api.get('/badges/my-badges/').catch(() => ({ data: [] })),
          api.get('/assessments/my-attempts/').catch(() => ({ data: { results: [] } })),
          api.get('/network/my-followers/').catch(() => ({ data: { count: 0, results: [] } })),
          api.get('/jobs/interviews/my-interviews/').catch(() => ({ data: { results: [] } })),
          api.get('/assessments/analytics/').catch(() => ({ data: null })),
          api.get('/jobs/').catch(() => ({ data: { results: [] } })),
          api.get('/auth/me/').catch(() => ({ data: null })),
          api.get('/portfolio/projects/').catch(() => ({ data: { results: [] } })),
          getMyResume().catch(() => null)
        ]);

        if (!isMounted) return;

        const cats: SkillCategory[] = Array.isArray(catsRes.data) ? catsRes.data : catsRes.data?.results || [];
        setCategories(cats);

        const tests: SkillTest[] = Array.isArray(testsRes.data) ? testsRes.data : testsRes.data?.results || [];
        const grouped: Record<number, SkillTest[]> = {};
        tests.forEach((t: SkillTest) => {
          const catId = t.category?.id;
          if (catId) {
            if (!grouped[catId]) grouped[catId] = [];
            grouped[catId].push(t);
          }
        });
        setTestsByCategory(grouped);

        const badgeList = Array.isArray(badgesRes.data) ? badgesRes.data : badgesRes.data?.results || [];
        setAllBadges(badgeList);
        const badgeMap: Record<number, Badge> = {};
        badgeList.forEach((b: Badge) => {
          if (b.skill_category?.id) {
            badgeMap[b.skill_category.id] = b;
          }
        });
        setBadges(badgeMap);

        const attemptsData: Attempt[] = Array.isArray(attemptsRes.data) ? attemptsRes.data : attemptsRes.data?.results || [];
        setAttempts(attemptsData);

        const followersData = followersRes.data;
        const count = followersData?.count || 0;
        setFollowersCount(count);
        let latestCompany = '';
        if (followersData?.results && followersData.results.length > 0) {
          latestCompany = followersData.results[0].recruiter_detail?.company_name || '';
          setLatestFollowerCompany(latestCompany);
        }

        const invitesData = Array.isArray(invitesRes.data) ? invitesRes.data : invitesRes.data?.results || [];
        setInvites(invitesData);

        const analyticsData = analyticsRes.data;
        setAnalytics(analyticsData);

        const jobsList = Array.isArray(jobsRes.data) ? jobsRes.data : jobsRes.data?.results || [];
        setJobs(jobsList);
        
        if (profileRes.data) setProfile(profileRes.data);
        const projectsList = Array.isArray(projectsRes.data) ? projectsRes.data : projectsRes.data?.results || [];
        setProjects(projectsList);

        if (myResumeRes) {
          setResume(myResumeRes);
          if (myResumeRes.parsing_status === 'completed') {
            getSuggestedTests().then(sTests => {
              if (isMounted) {
                setSuggestedTests(sTests);
                setCachedCandidateData(user?.id, {
                  categories: cats,
                  testsByCategory: grouped,
                  badges: badgeMap,
                  allBadges: badgeList,
                  attempts: attemptsData,
                  followersCount: count,
                  latestFollowerCompany: latestCompany,
                  invites: invitesData,
                  analytics: analyticsData,
                  jobs: jobsList,
                  profile: profileRes.data,
                  projects: projectsList,
                  resume: myResumeRes,
                  suggestedTests: sTests
                });
              }
            }).catch(console.error);
          }
        }

        // Cache the fresh snapshot for instant 0ms loads in future
        setCachedCandidateData(user?.id, {
          categories: cats,
          testsByCategory: grouped,
          badges: badgeMap,
          allBadges: badgeList,
          attempts: attemptsData,
          followersCount: count,
          latestFollowerCompany: latestCompany,
          invites: invitesData,
          analytics: analyticsData,
          jobs: jobsList,
          profile: profileRes.data,
          projects: projectsList,
          resume: myResumeRes,
        });

      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
          setIsSyncing(false);
          setIsColdStarting(false);
        }
      }
    }
    fetchData();
    return () => { isMounted = false; };
  }, [user?.id]);

  // Poll for unread messages
  useEffect(() => {
    if (!user) return;
    
    const fetchUnreadCount = async () => {
      try {
        const res = await api.get('/messages/conversations/');
        const conversations = res.data || [];
        const unread = conversations.reduce((sum: number, conv: any) => sum + (conv.unread_count || 0), 0);
        setTotalUnreadMessages(unread);
      } catch (err) {
        console.error('Failed to fetch unread messages:', err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000); // Check every 15 seconds
    
    return () => clearInterval(interval);
  }, [user]);

  // Polling for processing resume
  useEffect(() => {
    let interval: number | undefined;
    if (resume && (resume.parsing_status === 'pending' || resume.parsing_status === 'processing')) {
      interval = window.setInterval(async () => {
        try {
          const updated = await getMyResume();
          setResume(updated);
          if (updated && updated.parsing_status === 'completed') {
            const suggested = await getSuggestedTests();
            setSuggestedTests(suggested);
            clearInterval(interval);
          } else if (updated && updated.parsing_status === 'failed') {
            clearInterval(interval);
          }
        } catch (e) {
          clearInterval(interval);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [resume?.parsing_status]);

  const handleEditProfileClick = () => {
    setEditProfileData({
      full_name: profile?.full_name || (user?.email ? user.email.split('@')[0] : ''),
      company_name: profile?.company_name || '',
      bio: profile?.bio || '',
      avatar_url: profile?.avatar_url || ''
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      const res = await api.patch('/auth/me/', editProfileData);
      setProfile(res.data);
      setIsEditingProfile(false);
    } catch (err) {
      console.error('Failed to update profile', err);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleResumeUploadSuccess = async () => {
    try {
      const res = await getMyResume();
      setResume(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartTest = async (testId: number) => {
    try {
      const response = await api.post(`/assessments/start/`, { test_id: testId });
      navigate(`/test/${response.data.attempt_id}`);
    } catch (err) {
      console.error('Failed to start test:', err);
    }
  };

  const [isReparsing, setIsReparsing] = useState(false);

  const handleReparseResume = async () => {
    try {
      setIsReparsing(true);
      toast.loading('Analyzing resume competencies with AI...', { id: 'reparse' });
      const updated = await reparseResume();
      setResume(updated);
      if (updated && updated.parsing_status === 'completed') {
        toast.success('Resume analyzed successfully!', { id: 'reparse' });
        const tests = await getSuggestedTests();
        setSuggestedTests(tests);
      } else if (updated && updated.parsing_status === 'processing') {
        toast.loading('AI engine is processing your resume...', { id: 'reparse' });
      } else {
        toast.error('AI analysis encountered an issue. You can re-upload or try again.', { id: 'reparse' });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to analyze resume.', { id: 'reparse' });
    } finally {
      setIsReparsing(false);
    }
  };

  const handleDeleteResume = async () => {
    try {
      if (window.confirm("Are you sure you want to delete your resume and matched tests?")) {
        await deleteResume();
        setResume(null);
        setSuggestedTests([]);
        toast.success('Resume record removed');
      }
    } catch (err) {
      console.error('Failed to delete resume:', err);
      toast.error('Failed to delete resume');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-[#0A0A0B] text-white relative">
        <div className="absolute inset-0 hidden opacity-100 pointer-events-none" />

        {/* Sidebar with actual user info from auth state */}
        <div className="w-72 bg-[#111113] border-r border-[#2A2A2D] hidden md:flex flex-col h-full shrink-0 relative z-20 ">
          <div className="p-8 pb-6 flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center  ">
               <span className="font-sans tracking-tight text-[#0A0A0B] font-bold text-sm">S</span>
             </div>
             <h3 className="font-sans tracking-tight text-2xl font-bold text-white tracking-tight">SkillProof</h3>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6 scrollbar-hide">
            {['OVERVIEW', 'NETWORK', 'CAREER'].map((group) => (
              <div key={group} className="space-y-2">
                <div className="h-3 w-16 bg-[#1E1E21] rounded px-2" />
                <div className="h-9 w-full bg-[#141415] rounded-xl border border-[#1E1E21]" />
                <div className="h-9 w-full bg-[#141415] rounded-xl border border-[#1E1E21]" />
              </div>
            ))}
          </div>
          {/* User Profile */}
          <div className="p-3.5 mx-4 mb-6 rounded-2xl bg-[#111113] border border-[#2A2A2D] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-primary to-emerald-400 p-[1.5px] shrink-0">
               <div className="w-full h-full bg-[#0A0A0B] rounded-full flex items-center justify-center text-white font-sans tracking-tight font-bold text-lg">
                 {user?.email?.charAt(0).toUpperCase() || 'U'}
               </div>
            </div>
            <div className="truncate">
              <div className="text-sm font-bold text-white truncate">{user?.email ? user.email.split('@')[0] : 'User'}</div>
              <div className="text-[9.5px] font-mono font-bold text-[#A0A0A3] uppercase tracking-widest">Candidate</div>
            </div>
          </div>
        </div>

        {/* Main Content Skeleton Area */}
        <div className="flex-1 p-8 lg:p-12 space-y-6 overflow-y-auto relative z-10">
          {/* Cold start wake up indicator */}
          {isColdStarting ? (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 text-amber-200 "
            >
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <div>
                  <div className="text-xs font-bold text-amber-300 font-mono tracking-wide">CONNECTING TO SECURE CLOUD SERVER</div>
                  <div className="text-[11px] text-amber-200/70 font-sans mt-0.5">Render free instance is waking up (~15-20s on first load). Loading your verified dashboard...</div>
                </div>
              </div>
              <div className="hidden sm:block text-[10px] font-mono uppercase tracking-widest text-amber-400/80 px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/30">
                Waking Up
              </div>
            </motion.div>
          ) : (
            <div className="w-1/3 mb-6"><SkeletonLoader type="text" /></div>
          )}

          {/* Cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonLoader type="card" />
            <SkeletonLoader type="card" />
            <SkeletonLoader type="card" />
          </div>
          <div className="mt-8 h-72"><SkeletonLoader type="card" /></div>
        </div>
      </div>
    );
  }

  const completedTests = attempts.filter(a => a.status === 'completed').length;
  const avgScore = attempts.filter(a => a.score).reduce((sum, a) => sum + (a.score?.overall_score || 0), 0) / (attempts.filter(a => a.score).length || 1);
  const totalCategories = categories.length || 4;
  
  let narrative = allBadges.length === totalCategories 
    ? "All core skills verified — your profile is complete."
    : `You've verified ${allBadges.length} of ${totalCategories} core skills — continue your assessments to complete your profile.`;
    
  if (followersCount > 0) {
    if (latestFollowerCompany) {
      narrative = `${latestFollowerCompany} is following your profile — ${allBadges.length === totalCategories ? 'keep your skills sharp to stay on top.' : 'complete more assessments to stand out further.'}`;
    } else {
      narrative = `${followersCount} recruiter${followersCount === 1 ? '' : 's'} ${followersCount === 1 ? 'is' : 'are'} following your profile — ${allBadges.length === totalCategories ? 'keep your skills sharp to stay on top.' : 'complete more assessments to stand out further.'}`;
    }
  }

  const sidebarItems = [
    {
      category: 'OVERVIEW',
      items: [
        { id: 'Dashboard', icon: '📊', label: 'Dashboard' },
        { id: 'Skill Insights', icon: '🧠', label: 'Skill Insights' },
        { id: 'Activity', icon: '🔥', label: 'Activity' },
      ]
    },
    {
      category: 'NETWORK',
      items: [
        { id: 'Feed', icon: '📰', label: 'Feed' },
        { id: 'Explore Network', icon: '🔍', label: 'Explore Network' },
        { id: 'Messages', icon: '💬', label: 'Messages', badge: totalUnreadMessages },
      ]
    },
    {
      category: 'CAREER',
      items: [
        { id: 'Jobs', icon: '💼', label: 'Jobs' },
        { id: 'Interviews', icon: '🗓️', label: 'Interviews' },
      ]
    },
    {
      category: 'CREDENTIALS',
      items: [
        { id: 'Certificates', icon: '🏅', label: 'Assessments & Badges' },
        { id: 'Resume', icon: '📄', label: 'Resume' },
      ]
    },
    {
      category: 'PROFILE',
      items: [
        { id: 'Profile', icon: '👤', label: 'My Profile' },
      ]
    },
    {
      category: 'SYSTEM',
      items: [
        { id: 'Settings', icon: '⚙️', label: 'Settings' },
      ]
    }
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0A0A0B] text-white">
      <div className="absolute inset-0 hidden opacity-100 pointer-events-none"></div>
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 md:hidden "
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 w-72 bg-[#111113] border-r border-[#2A2A2D] flex flex-col h-full shrink-0  `}>
        <div className="p-8 pb-6 flex justify-between items-center md:block">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center  ">
               <span className="font-sans tracking-tight text-[#0A0A0B] font-bold text-sm">S</span>
             </div>
             <h3 className="font-sans tracking-tight text-2xl font-bold text-white tracking-tight">SkillProof</h3>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-[#D4D4D8] hover:text-white p-2">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-8 scrollbar-hide">
          {sidebarItems.map(group => (
            <div key={group.category}>
              <h4 className="font-mono text-[10px] text-[#6A6A6D] font-bold uppercase tracking-[0.25em] mb-3 px-4">{group.category}</h4>
              <ul className="space-y-1">
                {group.items.map(item => {
                  const isActive = activeTab === item.id;
                  return (
                    <li key={item.id} className="relative px-2">
                      {/* Active Indicator Glow */}
                      {isActive && (
                        <motion.div 
                          layoutId="activeTabIndicatorCandidate" 
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/4 bg-white rounded-r-full " 
                        />
                      )}
                      <button
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsSidebarOpen(false); // Close sidebar on mobile when navigating
                        }}
                        className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group ${
                          isActive
                            ? 'bg-[#1E1E21]  text-white border border-[#1E1E21]' 
                            : 'text-[#A0A0A3] hover:bg-[#141415] hover:text-white'
                        }`}
                      >
                        <span className={`text-xl transition-all duration-300 ${isActive ? 'scale-110 drop-' : 'group-hover:scale-110 opacity-70 group-hover:opacity-100'}`}>
                          {item.icon}
                        </span>
                        <span className={`tracking-wide ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="ml-auto w-5 h-5 bg-[#EF4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        
        {/* User Profile Snippet */}
        <div className="p-3.5 mx-4 mb-6 rounded-2xl bg-[#111113] border border-[#2A2A2D] flex items-center justify-between group hover:bg-[#1E1E21] transition-all duration-300 relative overflow-hidden">
          {/* Subtle hover gradient mask */}
          <div className="absolute inset-0 hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          <div 
            className="flex items-center gap-3 relative z-10 cursor-pointer flex-1 min-w-0" 
            onClick={() => { setActiveTab('Profile'); setIsSidebarOpen(false); }}
            title="View Profile"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-primary to-emerald-400 p-[1.5px]  shrink-0">
               <div className="w-full h-full bg-[#0A0A0B] rounded-full flex items-center justify-center text-white font-sans tracking-tight font-bold text-lg">
                 {user?.email?.charAt(0).toUpperCase() || 'U'}
               </div>
            </div>
            <div className="truncate">
              <div className="text-sm font-bold text-white truncate tracking-tight">{user?.email ? user.email.split('@')[0] : 'User'}</div>
              <div className="text-[9.5px] font-mono font-bold text-[#A0A0A3] uppercase tracking-widest mt-0.5">Candidate</div>
            </div>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              logout();
              navigate('/');
              toast.success('Logged out successfully');
            }}
            className="text-[#6A6A6D] hover:text-red-400 hover:bg-red-500/10 p-2 rounded-xl transition-all relative z-20 shrink-0 ml-1"
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 h-full flex flex-col min-w-0 relative bg-transparent overflow-hidden">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-[#2A2A2D] bg-[#111113] z-30">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-gradient-to-tr from-brand-primary to-brand-secondary rounded-lg flex items-center justify-center">
               <span className="font-sans tracking-tight font-bold text-ink text-sm">S</span>
             </div>
             <h3 className="font-sans tracking-tight text-xl font-bold text-white tracking-tight">SkillProof</h3>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-[#D4D4D8] hover:text-white rounded-lg hover:bg-[#1E1E21] transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto relative p-0 scrollbar-hide">
        
        {/* Messages Toggle (Fixed Floating Action Button) */}
        <div className="fixed top-8 right-12 z-[100]">
          <button 
            onClick={() => setActiveTab('Messages')}
            className="relative w-12 h-12 md:w-14 md:h-14 bg-[#0A0A0B] text-white hover:bg-[#0A0A0B]/90 rounded-full transition-transform hover:scale-105  border border-[#2A2A2D] flex items-center justify-center"
          >
            <span className="text-xl">✉️</span>
            {totalUnreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#EF4444] text-white text-[11px] font-bold rounded-full border-2 border-ink flex items-center justify-center shadow-sm">
                {totalUnreadMessages}
              </span>
            )}
          </button>
        </div>

        <AnimatePresence mode="wait">
        {/* Dashboard Tab */}
        {activeTab === 'Dashboard' && (
          <motion.div key="dashboard" variants={tabVariants} initial="hidden" animate="show" exit="exit">
            {!resume ? (
              <div className="flex-1 h-full overflow-y-auto p-8 lg:p-12 relative scrollbar-hide">
                <div className="max-w-6xl mx-auto h-full flex flex-col pt-12">
                  <div className="mb-10">
                    <h1 className="font-sans tracking-tight text-5xl font-bold text-white mb-2 tracking-tight">Welcome back, <span className="text-white">{user?.email ? user.email.split('@')[0] : 'Alex'}</span></h1>
                    <p className="font-mono text-sm text-[#A0A0A3] uppercase tracking-[0.2em]">Dashboard Overview</p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-[160px] flex-1">
                    
                    {/* Bento Box 1: Activity Streak */}
                    <div className="col-span-1 row-span-1">
                      <ActivityStreakWidget attempts={attempts} />
                    </div>

                    {/* Bento Box 2: Job Matches */}
                    <div className="col-span-1 row-span-1">
                      <RecentJobMatchesWidget jobs={jobs} />
                    </div>

                    {/* Bento Box 3: Interviews Panel */}
                    <div className="col-span-1 row-span-2 lg:row-span-3">
                      <UpcomingInterviewsWidget invites={invites} />
                    </div>

                    {/* Main CTA Bento Box (Center) */}
                    <div className="col-span-1 lg:col-span-2 row-span-2 relative">
                      
                      <div className="w-full h-full bg-[#111113] border border-[#2A2A2D]  rounded-3xl p-10 flex flex-col items-center justify-center text-center relative overflow-hidden z-10 group transition-all duration-500 hover: hover:border-emerald-500/30">
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 hidden -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
                        
                        <div className="relative w-32 h-32 mx-auto mb-8 cursor-pointer group/icon" onClick={() => setActiveTab('Resume')}>
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-brand-primary rounded-[2.5rem] rotate-3 group-hover/icon:rotate-6 transition-transform duration-500 " />
                          <div className="absolute inset-0 bg-[#0A0A0B]/80   border border-[#3A3A3D] rounded-[2.5rem] -rotate-3 group-hover/icon:rotate-0 transition-transform duration-500 flex items-center justify-center">
                            <svg className="w-14 h-14 text-emerald-400 group-hover/icon:scale-110 transition-transform duration-300 drop-" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16v-4m0 0l-2 2m2-2l2 2" className="animate-bounce" />
                            </svg>
                          </div>
                        </div>
                        
                        <h1 className="font-sans tracking-tight text-4xl font-bold text-white mb-3 tracking-tight drop-shadow-md">GET STARTED</h1>
                        
                        <p className="font-sans tracking-tight text-sm text-[#A0A0A3] mb-8 max-w-md mx-auto leading-relaxed">
                          Upload your resume to activate your dashboard. Our AI will analyze your experience and map out your perfect verification path.
                        </p>
                        
                        <button 
                          onClick={() => setActiveTab('Resume')}
                          className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 hover:text-white transition-colors flex items-center gap-2 group/btn"
                        >
                          <span className="border-b border-emerald-400/30 group-hover/btn:border-[#1E1E21]0 pb-1">Start New Profile</span>
                          <span className="text-lg leading-none mt-[-2px] group-hover/btn:translate-x-1 transition-transform">&rsaquo;</span>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            ) : (
              <>
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden bg-[#0A0A0B] text-white mb-8 rounded-b-3xl  mx-4 mt-0"
                >
                  {/* Abstract Background pattern */}
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, #ffffff 40px, #ffffff 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, #ffffff 40px, #ffffff 41px)`,
                  }} />
                  <div className="absolute -top-40 -right-40 w-96 h-96 hidden opacity-20 blur-3xl rounded-full" />
                  
                  <div className="relative max-w-5xl mx-auto px-8 py-12">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h1 className="text-sm font-mono tracking-[0.3em] text-[#A0A0A3] uppercase">Candidate Dossier &mdash; {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric'})}</h1>
                          {isSyncing && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono text-emerald-400 tracking-wider">
                              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                              SYNCING
                            </span>
                          )}
                        </div>
                        <h2 className="text-4xl md:text-5xl font-sans tracking-tight font-bold text-white mb-4">Welcome back</h2>
                        <p className="max-w-xl text-[#D4D4D8] font-sans tracking-tight leading-relaxed text-sm">
                          Complete AI-proctored assessments to build a cryptographically verified profile. 
                          Your credentials will serve as immutable proof of your skills to recruiters worldwide.
                        </p>
                      </div>
                      
                      {/* High Level Stats */}
                      <div className="flex gap-8 shrink-0 bg-[#141415] p-6 rounded-2xl  border border-[#2A2A2D]">
                        <div className="text-center">
                          <div className="font-sans tracking-tight text-3xl text-verification"><AnimatedCounter target={followersCount} /></div>
                          <div className="font-mono text-[9px] text-[#A0A0A3] uppercase tracking-[0.2em] mt-2">Followers</div>
                        </div>
                        <div className="w-px bg-[#1E1E21]" />
                        <div className="text-center">
                          <div className="font-sans tracking-tight text-3xl text-white"><AnimatedCounter target={Math.round(avgScore)} /></div>
                          <div className="font-mono text-[9px] text-[#A0A0A3] uppercase tracking-[0.2em] mt-2">Verification Score</div>
                        </div>
                        <div className="w-px bg-[#1E1E21]" />
                        <div className="text-center">
                          <div className="font-sans tracking-tight text-3xl text-white"><AnimatedCounter target={allBadges.length} /></div>
                          <div className="font-mono text-[9px] text-[#A0A0A3] uppercase tracking-[0.2em] mt-2">Badges Earned</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress Narrative */}
                    <div className="mt-8 border-t border-[#2A2A2D] pt-4">
                      <p className="font-mono text-[11px] text-verification uppercase tracking-widest flex items-center gap-2">
                        <span className="text-sm">{followersCount > 0 ? '👀' : '✦'}</span> {narrative}
                      </p>
                    </div>
                  </div>
                </motion.div>
                
                {allBadges.length === 0 && (
                  <div className="max-w-5xl mx-auto px-8 mb-8">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 ">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">Resume Analyzed! 🎯</h3>
                        <p className="font-mono text-xs text-emerald-300/80 uppercase tracking-widest">Take AI-proctored assessments to earn verified badges and start ranking.</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('Certificates')}
                        className="shrink-0 bg-white hover:bg-[#E8E8EA] text-slate-950 font-mono text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-xl transition-transform hover:scale-105 shadow-lg shadow-emerald-500/20"
                      >
                        Take First Assessment
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="max-w-5xl mx-auto px-8 pb-16 space-y-8">
                  <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                    <div className="col-span-1 md:col-span-2 lg:col-span-1"><ActivityStreakWidget attempts={attempts} /></div>
                    <div className="col-span-1 md:col-span-2 lg:col-span-1"><RecentJobMatchesWidget jobs={jobs} /></div>
                    <div className="col-span-1 md:col-span-2 lg:col-span-1"><UpcomingInterviewsWidget invites={invites} /></div>
                  </motion.div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    {/* Radar Chart Component */}
                    <motion.div 
                      whileHover={{ y: -5 }}
                      className="bg-[#111113] border border-[#2A2A2D] rounded-3xl p-8 transition-all shadow-sm hover:shadow-lg hover:border-[#3A3A3D]"
                    >
                      <h3 className="font-sans tracking-tight font-bold text-white mb-1">Core Competencies</h3>
                      <p className="font-mono text-[9px] uppercase tracking-widest text-[#A0A0A3] mb-6">Radar Analysis</p>
                      <div className="h-[300px]">
                        {analytics?.radar && analytics.radar.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={analytics.radar} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                              <PolarGrid stroke="rgba(255,255,255,0.1)" />
                              <PolarAngleAxis dataKey="category" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10, fontFamily: 'monospace' }} />
                              <PolarRadiusAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} axisLine={false} />
                              <Radar name="Score" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                              <RechartsTooltip 
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                                itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                              />
                            </RadarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <p className="font-mono text-xs text-[#6A6A6D] uppercase tracking-widest">Complete tests to unlock radar</p>
                          </div>
                        )}
                      </div>
                    </motion.div>

                    <motion.div 
                      whileHover={{ y: -5 }}
                      className="bg-[#111113] border border-[#2A2A2D] rounded-3xl p-8 transition-all shadow-sm hover:shadow-lg hover:border-[#3A3A3D] flex flex-col"
                    >
                      <h3 className="font-sans tracking-tight font-bold text-white mb-1">Performance Trend</h3>
                      <p className="font-mono text-[9px] uppercase tracking-widest text-[#A0A0A3] mb-6">Last 5 Assessments</p>
                      <div className="flex-1 min-h-[300px]">
                        {analytics?.trends && analytics.trends.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analytics.trends}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                              <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} fontFamily="monospace" tickLine={false} axisLine={false} />
                              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} fontFamily="monospace" tickLine={false} axisLine={false} domain={[0, 100]} />
                              <RechartsTooltip 
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                                itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                              />
                              <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#0f172a', stroke: '#10b981', strokeWidth: 2 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <p className="font-mono text-xs text-[#6A6A6D] uppercase tracking-widest">Not enough data points</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Activity Tab */}
        {activeTab === 'Activity' && (
          <motion.div key="activity" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-5xl mx-auto px-8 py-10 space-y-8">
            <h2 className="font-sans tracking-tight text-2xl font-bold text-white tracking-tight drop-shadow-md">Activity</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="col-span-1">
                <ActivityStreakWidget attempts={attempts} />
              </div>
              <div className="col-span-1 lg:col-span-2">
                <div className="bg-[#111113] border border-[#2A2A2D] rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 h-full group">
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/20 rounded-full blur-3xl group-hover:bg-white/30 transition-colors duration-500 pointer-events-none" />
                  <h3 className="font-sans tracking-tight text-lg font-bold text-white mb-1">Recent Assessments</h3>
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A0A0A3] mb-6">Your test history</p>
                  
                  <div className="space-y-4 relative z-10">
                    {attempts.length > 0 ? attempts.map((attempt, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-[#141415] rounded-2xl border border-[#2A2A2D] hover:bg-[#1E1E21] transition-colors">
                        <div>
                          <h4 className="font-sans tracking-tight font-bold text-white text-sm tracking-tight">{attempt.test?.title || 'Assessment'}</h4>
                          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A0A0A3] mt-1">
                            {new Date(attempt.started_at).toLocaleDateString()} • {attempt.status}
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          {attempt.score ? (
                            <div className="font-sans tracking-tight text-xl font-bold text-emerald-400 drop-">{attempt.score.overall_score}%</div>
                          ) : (
                            <div className="font-mono text-[9px] uppercase tracking-widest text-gold font-bold border border-gold/30 bg-gold/10 px-3 py-1.5 rounded-full">Pending</div>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="flex-1 flex flex-col justify-center items-center py-12 bg-[#141415] rounded-2xl border border-dashed border-[#3A3A3D] h-full">
                        <span className="text-3xl mb-3 opacity-50">📝</span>
                        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#A0A0A3]">No assessments taken yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Skill Insights Tab */}
        {activeTab === 'Skill Insights' && (
          <motion.div key="skill-insights" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-5xl mx-auto px-8 py-10 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-sans tracking-tight text-2xl font-bold text-white tracking-tight drop-shadow-md">Skill Insights</h2>
                <p className="font-mono text-[9px] text-[#A0A0A3] font-bold uppercase tracking-[0.25em] mt-1">AI-Powered Gap Analysis & Learning Roadmap</p>
              </div>
            </div>
            <ErrorBoundary>
              <SkillInsights onStartTest={handleStartTest} />
            </ErrorBoundary>
          </motion.div>
        )}

        {/* Feed Tab */}
        {activeTab === 'Feed' && (
          <motion.div key="feed" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-5xl mx-auto px-8 py-10 space-y-8">
            <h2 className="font-sans tracking-tight text-2xl font-bold text-white">Network Feed</h2>
            <FeedWidget />
          </motion.div>
        )}

        {/* Explore Network Tab */}
        {activeTab === 'Explore Network' && (
          <motion.div key="explore" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-5xl mx-auto px-8 py-10">
            <h2 className="font-sans tracking-tight text-2xl font-bold text-white">Explore Network</h2>
            <NetworkDiscoveryWidget />
          </motion.div>
        )}

        {/* Messages Tab */}
        {activeTab === 'Messages' && (
          <motion.div key="messages" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-6xl mx-auto px-4 sm:px-8 py-6 h-full">
            <MessagesView />
          </motion.div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'Jobs' && (
          <motion.div key="jobs" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-5xl mx-auto px-8 py-10 space-y-8">
            <h2 className="font-sans tracking-tight text-2xl font-bold text-white tracking-tight">Job Matches</h2>
            <div className="bg-[#111113] border border-[#2A2A2D] rounded-3xl p-8 shadow-sm min-h-[400px]">
              {jobs.length > 0 ? (
                <div className="space-y-4">
                  {jobs.map((job, i) => (
                    <div key={i} className="flex justify-between items-start border border-[#2A2A2D] rounded-2xl p-6 bg-[#141415] hover:border-brand-primary/50 transition-all group">
                      <div>
                        <h3 className="font-sans tracking-tight text-xl font-bold text-white group-hover:text-brand-primary transition-colors">{job.title}</h3>
                        <p className="font-mono text-[10px] text-[#A0A0A3] uppercase tracking-widest mt-1 mb-4">{job.company_name}</p>
                        <div className="flex gap-2">
                          <span className="bg-white/20 text-brand-primary px-3 py-1 rounded-lg font-mono text-[9px] uppercase font-bold tracking-widest border border-brand-primary/30">High Match</span>
                          <span className="bg-[#1E1E21] text-[#D4D4D8] px-3 py-1 rounded-lg font-mono text-[9px] uppercase tracking-widest">Active</span>
                        </div>
                      </div>
                      <button className="bg-white text-white px-6 py-2.5 rounded-lg font-mono text-[10px] uppercase tracking-widest font-bold hover:bg-brand-secondary transition-colors">Apply</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 flex flex-col items-center justify-center h-full border border-dashed border-[#3A3A3D] rounded-2xl bg-[#141415]">
                  <span className="text-4xl opacity-50 block mb-4">💼</span>
                  <h3 className="font-sans tracking-tight text-lg font-bold text-white mb-2">No Job Matches Yet</h3>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#A0A0A3]">Complete more assessments to unlock job matches.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Interviews Tab */}
        {activeTab === 'Interviews' && (
          <motion.div key="interviews" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-5xl mx-auto px-8 py-10 space-y-8">
            <h2 className="font-sans tracking-tight text-2xl font-bold text-white tracking-tight">Upcoming Interviews</h2>
            <div className="bg-[#111113] border border-[#2A2A2D] rounded-3xl p-8 shadow-sm min-h-[400px]">
              {invites.length > 0 ? (
                <div className="space-y-4">
                  {invites.map((invite, i) => (
                    <div key={i} className="flex flex-col md:flex-row md:justify-between md:items-center border border-[#2A2A2D] rounded-2xl p-6 bg-[#141415] hover:border-brand-primary/50 transition-all gap-4 group">
                      <div className="flex gap-6 items-center">
                        <div className="w-16 h-16 rounded-xl bg-[#1E1E21] text-white flex flex-col items-center justify-center leading-none border border-[#3A3A3D]">
                          <span className="font-mono text-[10px] uppercase tracking-widest opacity-70">
                            {new Date(invite.proposed_time).toLocaleDateString(undefined, { month: 'short' })}
                          </span>
                          <span className="font-sans tracking-tight font-bold text-xl mt-0.5">
                            {new Date(invite.proposed_time).getDate()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-sans tracking-tight text-xl font-bold text-white group-hover:text-brand-primary transition-colors">{invite.recruiter_company || 'Tech Company'}</h3>
                          <p className="font-mono text-[10px] text-white/80 uppercase tracking-widest mt-1 mb-1">{invite.job_role || 'Open Role'}</p>
                          <p className="font-mono text-[9px] text-[#A0A0A3] uppercase tracking-widest">
                            Time: {new Date(invite.proposed_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                          <div className="mt-2 inline-block px-3 py-1 rounded-lg font-mono text-[9px] uppercase tracking-widest font-bold border border-[#2A2A2D] bg-[#141415]">
                            Status: <span className={invite.status === 'accepted' ? 'text-brand-primary' : invite.status === 'declined' ? 'text-red-400' : 'text-gold'}>{invite.status}</span>
                          </div>
                        </div>
                      </div>
                      
                      {invite.status === 'proposed' && (
                        <div className="flex gap-3 md:flex-col md:w-32">
                          <button 
                            onClick={async () => {
                              try {
                                await api.post(`/jobs/interviews/${invite.id}/respond/`, { status: 'accepted' });
                                toast.success('Interview accepted!');
                                const res = await api.get('/jobs/interviews/my-interviews/');
                                setInvites(res.data.results || res.data);
                              } catch(e) { toast.error('Failed to accept'); }
                            }}
                            className="flex-1 bg-white text-white px-4 py-2.5 rounded-lg font-mono text-[10px] uppercase tracking-widest font-bold hover:bg-brand-secondary transition-colors"
                          >
                            Accept
                          </button>
                          <button 
                             onClick={async () => {
                              try {
                                await api.post(`/jobs/interviews/${invite.id}/respond/`, { status: 'declined' });
                                toast.success('Interview declined.');
                                const res = await api.get('/jobs/interviews/my-interviews/');
                                setInvites(res.data.results || res.data);
                              } catch(e) { toast.error('Failed to decline'); }
                            }}
                            className="flex-1 border border-[#3A3A3D] text-[#D4D4D8] px-4 py-2.5 rounded-lg font-mono text-[10px] uppercase tracking-widest hover:text-white hover:border-white transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 flex flex-col items-center justify-center h-full border border-dashed border-[#3A3A3D] rounded-2xl bg-[#141415]">
                  <span className="text-4xl opacity-50 block mb-4">🗓️</span>
                  <h3 className="font-sans tracking-tight text-lg font-bold text-white mb-2">No Upcoming Interviews</h3>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#A0A0A3]">When a recruiter invites you, it will appear here.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Certificates Tab */}
        {activeTab === 'Certificates' && (
          <motion.div key="certificates" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-5xl mx-auto px-8 py-10 space-y-8">
            <h2 className="font-sans tracking-tight text-2xl font-bold text-white tracking-tight">Assessments & Badges</h2>
            <div className="bg-[#111113] border border-[#2A2A2D] rounded-3xl p-8 shadow-sm">
              <h2 className="font-mono text-[10px] text-brand-primary uppercase tracking-[0.3em] mb-6 font-bold">Badge Showcase</h2>
              
              {allBadges.length === 0 ? (
                <div className="text-center py-12 bg-[#141415] rounded-2xl border border-dashed border-[#3A3A3D]">
                  <span className="text-4xl mb-4 block opacity-50">🏅</span>
                  <h3 className="font-sans tracking-tight text-lg font-bold text-white mb-2">No badges earned yet</h3>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#A0A0A3]">Complete a core skill assessment below to earn your first verified credential.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {allBadges.map((badge) => (
                    <div key={badge.id} className="group relative bg-[#141415] rounded-3xl p-6 border border-[#2A2A2D] shadow-sm hover:shadow-xl hover:border-[#3A3A3D] transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative flex flex-col items-center text-center">
                        <div className="mb-4 transform group-hover:scale-110 transition-transform duration-500">
                          <BadgeIcon level={(badge.badge_level?.toLowerCase() || 'bronze') as BadgeLevel} size={120} />
                        </div>
                        <h4 className="font-sans tracking-tight font-bold text-white text-sm mb-1">{badge.skill_category?.name || 'General Skill'}</h4>
                        <div className="font-mono text-[9px] uppercase tracking-widest text-brand-primary mb-4 font-bold bg-[#1E1E21] border border-brand-primary/20 px-3 py-1 rounded-full">
                          Verified
                        </div>
                        <div className="text-xs text-[#A0A0A3] font-mono uppercase tracking-widest mb-1">Score</div>
                        <div className="font-sans tracking-tight text-2xl font-bold text-white mb-3">{badge.overall_score || 0}/100</div>
                        <p className="text-[10px] font-mono text-[#6A6A6D] uppercase tracking-wider">
                          Earned {new Date(badge.issued_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#111113] border border-[#2A2A2D] rounded-3xl p-8 shadow-sm">
              <h2 className="font-mono text-[10px] text-brand-primary uppercase tracking-[0.3em] mb-4 font-bold">Core Competency Ledger</h2>
              {categories.map((category) => (
                <div key={category.id} className="mb-10 last:mb-0">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-2xl bg-[#1E1E21] p-2 rounded-xl border border-[#3A3A3D] shadow-inner">
                      {CATEGORY_ICONS[category.name] || '⌨'}
                    </span>
                    <div>
                      <h3 className="font-sans tracking-tight text-xl font-bold text-white leading-none">{category.name}</h3>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-[#A0A0A3] mt-1">{category.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    {testsByCategory[category.id]?.map((test) => {
                      const passed = attempts.some(a => a.test?.title === test.title && a.status === 'completed' && a.score && a.score.overall_score >= 70);
                      return (
                        <button 
                          key={test.id} 
                          onClick={(e) => {
                            e.preventDefault();
                            if (!passed) handleStartTest(test.id);
                          }}
                          className={`flex w-full text-left flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border transition-all duration-300 group hover:-translate-y-0.5 ${
                          passed ? 'bg-[#1E1E21] border-brand-primary/30 cursor-default' : 'bg-[#141415] border-[#2A2A2D] hover:bg-[#1E1E21] hover:border-[#3A3A3D] cursor-pointer'
                        }`}>
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-xl bg-[#1E1E21] text-white flex items-center justify-center font-bold text-lg shadow-sm border border-[#3A3A3D]">
                              {test.title[0]}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-sans tracking-tight font-bold text-white group-hover:text-brand-primary transition-colors text-lg">{test.title}</h4>
                                {passed && <span className="text-brand-primary" title="Verified">✓</span>}
                              </div>
                              <p className="font-mono text-[9px] text-[#A0A0A3] uppercase tracking-widest mt-1">
                                {test.duration_minutes} MIN • {test.difficulty}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-4 sm:mt-0 flex items-center gap-4">
                            {passed ? (
                              <div className="flex items-center gap-2">
                                <span className="bg-white/20 text-brand-primary px-3 py-1.5 rounded-lg font-mono text-[9px] uppercase tracking-widest font-bold border border-brand-primary/30">Score: {attempts.find(a => a.test?.title === test.title && a.status === 'completed')?.score?.overall_score || 0}%</span>
                              </div>
                            ) : (
                              <span className="text-brand-primary font-mono text-[9px] uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-[#1E1E21] px-4 py-2 rounded-lg border border-brand-primary/20">
                                Verify Now <span>→</span>
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Resume Tab */}
        {activeTab === 'Resume' && (
          <motion.div key="resume" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-5xl mx-auto px-6 lg:px-8 py-10 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2A2A2D] pb-6">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-emerald-400 font-bold mb-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Neural Competency Engine
                </div>
                <h2 className="font-sans tracking-tight text-3xl font-bold text-white tracking-tight">Executive Resume Dossier</h2>
                <p className="font-sans tracking-tight text-sm text-[#A0A0A3] mt-1 max-w-xl">
                  Upload your CV to automatically benchmark your skills against verified proctored assessments.
                </p>
              </div>

              {resume && (
                <div className="flex flex-wrap items-center gap-3">
                  {resume.parsing_status === 'failed' && (
                    <button
                      onClick={handleReparseResume}
                      disabled={isReparsing}
                      className="px-4 py-2 bg-white hover:bg-[#E8E8EA] text-[#0A0A0B] font-mono text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all  flex items-center gap-2 disabled:opacity-50"
                    >
                      <span className={isReparsing ? 'animate-spin' : ''}>🔄</span>
                      {isReparsing ? 'Analyzing...' : 'Re-Analyze with AI'}
                    </button>
                  )}
                  {resume.file && (
                    <a
                      href={resume.file.startsWith('http') ? resume.file : `${api.defaults.baseURL?.replace('/api', '') || ''}${resume.file}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#1E1E21] hover:bg-white/15 text-white font-mono text-[11px] font-bold uppercase tracking-widest rounded-xl border border-[#2A2A2D] transition-colors flex items-center gap-2"
                    >
                      <span>👁️</span> Preview Document
                    </a>
                  )}
                  <button
                    onClick={handleDeleteResume}
                    className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-mono text-[11px] font-bold uppercase tracking-widest rounded-xl border border-rose-500/20 transition-colors flex items-center gap-2"
                  >
                    <span>🗑️</span> Remove
                  </button>
                </div>
              )}
            </div>

            <div id="tests-section" className="space-y-8">
              {!resume ? (
                <div className="bg-[#141415]  p-8 lg:p-12 rounded-3xl border border-[#2A2A2D] ">
                  <div className="max-w-2xl mx-auto">
                    <ResumeUploader 
                      onUploadSuccess={handleResumeUploadSuccess}
                      title="Upload Your Executive Resume"
                      subtitle="PDF OR DOCX • MAX 5MB • PROCESSED BY GROQ AI"
                      buttonText="SELECT RESUME FILE"
                    />
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center border-t border-[#2A2A2D] pt-6">
                      <div className="p-3.5 rounded-2xl bg-[#141415] border border-[#1E1E21]">
                        <div className="text-2xl mb-1">⚡</div>
                        <div className="font-sans tracking-tight font-bold text-sm text-white">Instant AI Extraction</div>
                        <div className="font-mono text-[9px] text-[#6A6A6D] uppercase mt-0.5">Top skills parsed in seconds</div>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-[#141415] border border-[#1E1E21]">
                        <div className="text-2xl mb-1">🎯</div>
                        <div className="font-sans tracking-tight font-bold text-sm text-white">Assessment Mapping</div>
                        <div className="font-mono text-[9px] text-[#6A6A6D] uppercase mt-0.5">Tests matched to your stack</div>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-[#141415] border border-[#1E1E21]">
                        <div className="text-2xl mb-1">🛡️</div>
                        <div className="font-sans tracking-tight font-bold text-sm text-white">Verified Proof</div>
                        <div className="font-mono text-[9px] text-[#6A6A6D] uppercase mt-0.5">Showcase verified skill scores</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Resume Overview Card */}
                  <div className="bg-[#141415]  border border-[#2A2A2D] rounded-3xl p-8 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-[#2A2A2D] relative z-10">
                      <div className="flex gap-4 items-center">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-brand-primary/20 border border-[#3A3A3D] flex items-center justify-center text-3xl shadow-lg">
                          📄
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="font-sans tracking-tight text-xl text-white font-bold leading-tight">Active Resume Record</h3>
                            <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border font-bold ${
                              resume.parsing_status === 'completed' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 ' :
                              resume.parsing_status === 'failed' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' : 
                              'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse'
                            }`}>
                              {resume.parsing_status === 'completed' && <span>✓</span>}
                              {resume.parsing_status === 'processing' && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />}
                              {resume.parsing_status === 'failed' && <span>⚠️</span>}
                              {resume.parsing_status === 'completed' ? 'AI Parsed & Verified' :
                               resume.parsing_status === 'processing' ? 'Analyzing Competencies...' :
                               'Analysis Interrupted'}
                            </span>
                          </div>
                          <p className="font-mono text-[10px] text-[#A0A0A3] uppercase tracking-widest mt-1">
                            Uploaded on {new Date(resume.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        {resume.file && (
                          <a
                            href={resume.file.startsWith('http') ? resume.file : `${api.defaults.baseURL?.replace('/api', '') || ''}${resume.file}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-[#1E1E21] hover:bg-white/20 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl border border-[#2A2A2D] transition-all flex items-center gap-2 shadow-sm hover:scale-[1.02]"
                          >
                            <span>👁️</span> Preview PDF
                          </a>
                        )}
                        <button
                          onClick={handleDeleteResume}
                          className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-mono text-xs font-bold uppercase tracking-wider rounded-xl border border-rose-500/20 transition-all flex items-center gap-2 hover:scale-[1.02]"
                        >
                          <span>🗑️</span> Remove
                        </button>
                      </div>
                    </div>

                    {/* Failed Recovery Banner */}
                    {resume.parsing_status === 'failed' && (
                      <div className="mt-6 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-white">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                            <h4 className="font-sans tracking-tight font-bold text-base text-amber-300 flex items-center gap-2">
                              <span>⚡</span> AI Skills Extraction Ready to Re-Run
                            </h4>
                            <p className="font-mono text-[11px] text-[#D4D4D8] mt-1 max-w-xl">
                              Our AI parser can extract skills from this file immediately, or you can drop in a clean updated copy below.
                            </p>
                          </div>
                          <button
                            onClick={handleReparseResume}
                            disabled={isReparsing}
                            className="shrink-0 px-6 py-2.5 bg-white hover:bg-[#E8E8EA] text-[#0A0A0B] font-mono text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg hover:scale-105 disabled:opacity-50 flex items-center gap-2"
                          >
                            <span className={isReparsing ? 'animate-spin' : ''}>🔄</span>
                            {isReparsing ? 'Analyzing...' : 'Re-Analyze with AI'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Extracted Skills Section */}
                    {resume.parsing_status === 'completed' && resume.extracted_skills && (
                      <div className="mt-6 pt-6 border-t border-[#2A2A2D]">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-sans tracking-tight text-lg font-bold text-white">Extracted Technical Competencies</h4>
                            <p className="font-mono text-[10px] text-[#A0A0A3] uppercase tracking-widest mt-0.5">
                              {resume.extracted_skills.length} Hard Skills Identified by Neural AI
                            </p>
                          </div>
                          <span className="font-mono text-[10px] uppercase tracking-widest px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold">
                            Live Match Active
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                          {resume.extracted_skills.map((skill: string, i: number) => (
                            <span 
                              key={i} 
                              className="font-mono text-xs font-bold tracking-wide px-3.5 py-1.5 bg-[#141415] hover:bg-[#1E1E21] border border-[#2A2A2D] hover:border-emerald-500/50 text-white rounded-xl shadow-sm transition-all duration-300 hover:scale-105 flex items-center gap-2 group cursor-default"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 group-hover:scale-125 transition-transform" />
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI Suggested Assessments */}
                  {suggestedTests.length > 0 && (
                    <div className="bg-[#141415]  border border-[#2A2A2D] rounded-3xl p-8 shadow-xl">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
                        <div>
                          <div className="font-mono text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-1">
                            Recommended Next Steps
                          </div>
                          <h3 className="font-sans tracking-tight text-2xl font-bold text-white">AI-Matched Skill Assessments</h3>
                        </div>
                        <span className="font-mono text-xs text-[#A0A0A3]">
                          {suggestedTests.length} Tests Ready
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {suggestedTests.map((st) => (
                          <div
                            key={st.id} 
                            onClick={(e) => {
                              e.preventDefault();
                              handleStartTest(st.id);
                            }}
                            className="text-left flex items-center justify-between p-5 bg-[#141415] hover:bg-[#1E1E21] rounded-2xl border border-[#2A2A2D] hover:border-emerald-500/40 transition-all duration-300 group cursor-pointer shadow-sm hover:shadow-lg hover:scale-[1.01]"
                          >
                            <div className="flex items-center gap-4">
                              <span className="text-3xl bg-[#1E1E21] p-3 rounded-2xl border border-[#3A3A3D] group-hover:scale-110 transition-transform">
                                {CATEGORY_ICONS[st.test_type] || '🧠'}
                              </span>
                              <div>
                                <div className="font-mono text-[9px] uppercase tracking-widest text-emerald-400 font-bold mb-1">
                                  {st.category} • {st.difficulty || 'Intermediate'}
                                </div>
                                <h4 className="font-sans tracking-tight font-bold text-white text-base group-hover:text-emerald-300 transition-colors">
                                  {st.title}
                                </h4>
                                <div className="font-mono text-[10px] text-[#6A6A6D] mt-1 flex items-center gap-2">
                                  <span>⏱ {st.duration_minutes} Mins</span>
                                  <span>•</span>
                                  <span className="text-emerald-400/80">Proctored Proof</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center pl-4">
                              <span className="w-10 h-10 rounded-xl bg-[#141415] group-hover:bg-emerald-500 group-hover:text-[#0A0A0B] text-white flex items-center justify-center font-bold text-lg transition-all duration-300 group-hover:translate-x-1 shadow-sm">
                                →
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Replace Resume Card */}
                  <div className="bg-[#111113] border border-[#2A2A2D] rounded-3xl p-8 hover:border-[#3A3A3D] transition-all">
                    <h4 className="font-sans tracking-tight text-lg font-bold text-white mb-2">Update or Replace Resume</h4>
                    <p className="font-mono text-[10px] text-[#A0A0A3] uppercase tracking-widest mb-6">
                      Upload an updated version to re-sync your profile and refresh skill matches
                    </p>
                    <ResumeUploader 
                      onUploadSuccess={handleResumeUploadSuccess}
                      title="Upload Replacement Resume"
                      subtitle="PDF OR DOCX • MAX 5MB"
                      buttonText="REPLACE CURRENT RESUME"
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Profile Tab */}
        {activeTab === 'Profile' && (profile || user) && (
          <motion.div key="profile" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-5xl mx-auto pt-6">
            <ErrorBoundary>
              <ProfileView 
                profile={profile || user} 
                isOwnProfile={true} 
                onProfileUpdate={(updated) => setProfile(updated as any)}
                badges={badges}
                categories={categories}
                testsByCategory={testsByCategory}
                attempts={attempts}
              />
            </ErrorBoundary>
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === 'Settings' && (
          <motion.div key="settings" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-5xl mx-auto px-8 py-10 space-y-8">
            <h2 className="font-sans tracking-tight text-3xl font-bold text-white tracking-tight mb-2">Settings</h2>
            
            <div className="p-8 bg-[#111113] border border-[#2A2A2D] rounded-3xl shadow-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
              
              <h3 className="font-sans tracking-tight text-xl font-bold text-white mb-6 relative z-10 flex items-center gap-3">
                <span className="p-2 bg-[#1E1E21] border border-[#3A3A3D] text-white rounded-xl shadow-md">⚙️</span>
                Account Preferences
              </h3>
              
              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between p-5 border border-[#2A2A2D] bg-[#141415] hover:bg-[#1E1E21] rounded-2xl shadow-sm hover:border-[#3A3A3D] transition-all duration-300 group/row">
                  <div>
                    <h4 className="font-bold text-white text-sm group-hover/row:text-brand-primary transition-colors">Email Notifications</h4>
                    <p className="font-mono text-[10px] text-[#A0A0A3] uppercase tracking-widest mt-1">Receive updates about jobs and connections.</p>
                  </div>
                  <PremiumToggle checked={true} onChange={() => {}} />
                </div>
                
                <div className="flex items-center justify-between p-5 border border-[#2A2A2D] bg-[#141415] hover:bg-[#1E1E21] rounded-2xl shadow-sm hover:border-[#3A3A3D] transition-all duration-300 group/row">
                  <div>
                    <h4 className="font-bold text-white text-sm group-hover/row:text-brand-primary transition-colors">Profile Visibility</h4>
                    <p className="font-mono text-[10px] text-[#A0A0A3] uppercase tracking-widest mt-1">Make your profile discoverable by recruiters.</p>
                  </div>
                  <PremiumToggle checked={true} onChange={() => {}} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
