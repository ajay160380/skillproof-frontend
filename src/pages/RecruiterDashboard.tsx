import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { BadgeIcon, type BadgeLevel } from '../components/BadgeIcon';
import { EmptyState } from '../components/EmptyState';
import { Loader } from '../components/Loader';
import { Link } from 'react-router-dom';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { ScoreRing } from '../components/ScoreRing';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

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
  const [activeTab, setActiveTab] = useState<'search' | 'saved' | 'requirements'>('search');
  const [candidates, setCandidates] = useState<MarketplaceCandidate[]>([]);
  const [savedCandidates, setSavedCandidates] = useState<SavedCandidate[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [minScore, setMinScore] = useState<number>(0);
  const [sortBy, setSortBy] = useState('highest_score');
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Available options for filters
  const availableSkills = stats?.trending_skills.map(s => ({ value: s.slug, label: s.name })) || [
    { value: 'python', label: 'Python' },
    { value: 'react', label: 'React' },
    { value: 'sql', label: 'SQL' },
    { value: 'communication', label: 'Communication' }
  ];
  const badgeLevels = ['platinum', 'gold', 'silver', 'bronze'];

  // Requirements State
  const [reqCompany, setReqCompany] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqMinScore, setReqMinScore] = useState<number | ''>('');
  const [reqSkills, setReqSkills] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<{id: number, slug: string, name: string}[]>([]);
  const [savingReqs, setSavingReqs] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [statsRes, reqsRes, catsRes] = await Promise.all([
          api.get('/marketplace/dashboard-stats/'),
          api.get('/jobs/company-requirements/').catch(() => ({ data: null })),
          api.get('/skills/categories/').catch(() => ({ data: { results: [] } }))
        ]);
        setStats(statsRes.data);
        
        const cats = Array.isArray(catsRes.data) ? catsRes.data : catsRes.data.results || [];
        setAllCategories(cats);
        
        if (reqsRes.data) {
          setReqCompany(reqsRes.data.company_name || '');
          setReqDesc(reqsRes.data.company_description || '');
          setReqMinScore(reqsRes.data.preferred_min_score || '');
          setReqSkills(reqsRes.data.required_skills?.map((s: any) => s.id) || []);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      }
    }
    fetchStats();
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
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
      setLoading(false);
    }
  }, [debouncedQuery, selectedSkills, selectedLevels, minScore, sortBy]);

  const fetchSavedCandidates = useCallback(async () => {
    try {
      const res = await api.get('/network/my-follows/');
      setSavedCandidates(res.data.results || res.data || []);
    } catch (err) {
      console.error('Failed to fetch saved candidates:', err);
    }
  }, []);

  useEffect(() => {
    fetchSavedCandidates();
  }, [fetchSavedCandidates]);

  useEffect(() => {
    if (activeTab === 'search') {
      fetchCandidates();
    }
  }, [activeTab, fetchCandidates]);

  const toggleSkill = (slug: string) => {
    setSelectedSkills(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]);
  };

  const toggleLevel = (level: string) => {
    setSelectedLevels(prev => prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]);
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

  const updateNotes = async (candidateId: string, notes: string) => {
    try {
      await api.post('/network/follow/', { candidate_id: candidateId, notes });
      toast.success('Notes saved');
    } catch (err) {
      toast.error('Failed to save notes');
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
      toast.success('Company requirements updated');
    } catch (err) {
      toast.error('Failed to save requirements');
    } finally {
      setSavingReqs(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex-1 p-8 flex justify-center items-center min-h-[60vh]">
        <Loader text="SCANNING MARKETPLACE..." size="lg" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
      {/* Header & Overview Stats */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="font-mono text-xs text-data uppercase tracking-widest mb-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-verification animate-pulse"></div>
              Recruiter Terminal
            </div>
            <h1 className="font-serif text-4xl text-ink">Candidate Marketplace</h1>
          </div>
          <div className="flex bg-structure/20 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-6 py-2 rounded-md font-mono text-xs uppercase tracking-widest transition-colors ${activeTab === 'search' ? 'bg-vellum text-ink shadow-sm' : 'text-data hover:text-ink'}`}
            >
              Search
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-6 py-2 rounded-md font-mono text-xs uppercase tracking-widest transition-colors ${activeTab === 'saved' ? 'bg-vellum text-ink shadow-sm' : 'text-data hover:text-ink'}`}
            >
              Following ({stats?.candidates_saved || 0})
            </button>
            <button
              onClick={() => setActiveTab('requirements')}
              className={`px-6 py-2 rounded-md font-mono text-xs uppercase tracking-widest transition-colors ${activeTab === 'requirements' ? 'bg-vellum text-ink shadow-sm' : 'text-data hover:text-ink'}`}
            >
              Requirements
            </button>
          </div>
        </div>
        
        {stats && activeTab === 'search' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-vellum border border-structure p-6 rounded-xl shadow-sm">
                <div className="font-mono text-xs uppercase tracking-widest text-data mb-2">Total Verified</div>
                <div className="text-4xl text-ink font-serif"><AnimatedCounter target={stats.total_verified_candidates} /></div>
              </div>
              <div className="bg-vellum border border-structure p-6 rounded-xl shadow-sm">
                <div className="font-mono text-xs uppercase tracking-widest text-data mb-2">Following</div>
                <div className="text-4xl text-ink font-serif"><AnimatedCounter target={stats.candidates_saved} /></div>
              </div>
              <div className="bg-vellum border border-structure p-6 rounded-xl shadow-sm">
                <div className="font-mono text-xs uppercase tracking-widest text-data mb-2">Platform Avg Score</div>
                <div className="text-4xl text-ink font-serif flex items-baseline gap-1">
                  <AnimatedCounter target={stats.average_verified_score} />
                  <span className="text-lg text-data font-mono">/100</span>
                </div>
              </div>
            </div>

            {stats.trending_skills.length > 0 && (
              <div className="mb-8 p-4 bg-structure/5 border border-structure/50 rounded-lg flex items-center gap-4 overflow-x-auto">
                <span className="font-mono text-xs uppercase text-data whitespace-nowrap">🔥 Trending:</span>
                {stats.trending_skills.map((skill) => (
                  <div key={skill.slug} className="flex items-center gap-2 font-mono text-xs bg-white/60 px-3 py-1.5 rounded-full border border-structure whitespace-nowrap">
                    <span className="text-ink font-bold">{skill.name}</span>
                    <span className="text-data">({skill.count})</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {activeTab === 'search' && (
        <>
          {/* Enhanced Search & Filtering */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-data">🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search candidate by email or name..."
                  className="w-full pl-11 pr-4 py-4 bg-white/60 backdrop-blur-md border border-structure rounded-xl font-mono text-sm text-ink placeholder:text-data/60 focus:outline-none focus:border-verification focus:ring-1 focus:ring-verification transition-all shadow-sm"
                />
                {isSearching && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-data">
                    <div className="w-4 h-4 border-2 border-structure border-t-verification rounded-full animate-spin"></div>
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-6 py-4 border rounded-xl font-mono text-sm uppercase tracking-widest transition-all ${showFilters ? 'bg-ink text-vellum border-ink' : 'bg-vellum text-ink border-structure hover:border-ink hover:bg-structure/10'}`}
              >
                Filters { (selectedSkills.length > 0 || selectedLevels.length > 0 || minScore > 0) && '•' }
              </button>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 p-6 bg-vellum border border-structure rounded-xl grid grid-cols-1 md:grid-cols-3 gap-8 shadow-sm">
                    {/* Skills Filter */}
                    <div>
                      <h3 className="font-mono text-xs uppercase tracking-widest text-data mb-3">Skill Category</h3>
                      <div className="flex flex-wrap gap-2">
                        {availableSkills.map(s => (
                          <button
                            key={s.value}
                            onClick={() => toggleSkill(s.value)}
                            className={`px-3 py-1.5 rounded-md text-xs font-mono border transition-all ${selectedSkills.includes(s.value) ? 'bg-verification text-white border-verification' : 'bg-white/50 text-ink border-structure hover:border-verification'}`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Badge Level Filter */}
                    <div>
                      <h3 className="font-mono text-xs uppercase tracking-widest text-data mb-3">Badge Level</h3>
                      <div className="flex flex-wrap gap-2">
                        {badgeLevels.map(l => (
                          <button
                            key={l}
                            onClick={() => toggleLevel(l)}
                            className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase border transition-all flex items-center gap-1 ${selectedLevels.includes(l) ? 'bg-ink text-vellum border-ink' : 'bg-white/50 text-ink border-structure hover:border-ink'}`}
                          >
                            <BadgeIcon level={l as BadgeLevel} size={14} />
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Score & Sort */}
                    <div>
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-mono text-xs uppercase tracking-widest text-data">Min Score</h3>
                          <span className="font-mono text-sm text-ink font-bold">{minScore}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={minScore}
                          onChange={(e) => setMinScore(Number(e.target.value))}
                          className="w-full accent-verification cursor-pointer"
                        />
                      </div>

                      <div>
                        <h3 className="font-mono text-xs uppercase tracking-widest text-data mb-3">Sort By</h3>
                        <select 
                          value={sortBy} 
                          onChange={(e) => setSortBy(e.target.value)}
                          className="w-full p-2.5 bg-white border border-structure rounded-md font-mono text-sm text-ink focus:outline-none focus:border-verification"
                        >
                          <option value="highest_score">Highest Score</option>
                          <option value="recently_verified">Recently Verified</option>
                          <option value="alphabetical">Alphabetical</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="mt-4 flex justify-between items-center text-data">
              <div className="font-mono text-xs uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-verification inline-block"></span>
                <AnimatedCounter target={candidates.length} /> candidates match
              </div>
              {(selectedSkills.length > 0 || selectedLevels.length > 0 || minScore > 0 || searchQuery !== '') && (
                <button
                  onClick={() => {
                    setSelectedSkills([]);
                    setSelectedLevels([]);
                    setMinScore(0);
                    setSearchQuery('');
                  }}
                  className="font-mono text-xs hover:text-ink transition-colors underline"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>

          {/* Candidate List */}
          {candidates.length === 0 && !isSearching ? (
            <EmptyState 
              title="No candidates found" 
              description="Try adjusting your filters or search query to find verified candidates."
            />
          ) : (
            <div className="space-y-4 relative min-h-[200px]">
              {isSearching && candidates.length === 0 && (
                <div className="absolute inset-0 bg-vellum/50 backdrop-blur-sm z-10 flex justify-center items-center">
                  <Loader />
                </div>
              )}
              
              <AnimatePresence>
                {candidates.map((candidate, i) => {
                  const bestBadge = candidate.public_badges[0];
                  
                  return (
                    <motion.div 
                      key={candidate.id} 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ delay: i * 0.05, duration: 0.4, ease: "easeOut" }}
                      className="group bg-vellum border border-structure p-6 rounded-xl hover:border-ink hover:shadow-lg transition-all flex flex-col md:flex-row gap-6 items-start md:items-center relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-ink opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-ink opacity-0 group-hover:opacity-100 transition-opacity"></div>

                      <div className="flex items-center gap-6 md:w-1/3">
                        {bestBadge ? (
                          <ScoreRing percentage={bestBadge.overall_score || 0} size={80} strokeWidth={4} />
                        ) : (
                          <div className="w-[80px] h-[80px] rounded-full bg-structure/20 flex items-center justify-center font-mono text-xs text-data">N/A</div>
                        )}
                        <div>
                          <h3 className="font-serif text-xl truncate text-ink mb-1">{candidate.email}</h3>
                          <div className="font-mono text-[10px] uppercase text-data tracking-widest flex items-center gap-1">
                            Verified 
                            <span className="text-ink font-bold">
                              {bestBadge ? new Date(bestBadge.issued_at).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {candidate.public_badges.slice(0, 3).map(badge => {
                            const isFlagged = badge.cheating_flags?.ai_suspicion_level === 'high';
                            return (
                              <div key={badge.id} className={`flex items-center gap-1.5 border px-2.5 py-1 rounded-md ${isFlagged ? 'border-red-500/30 bg-red-500/10' : 'border-structure bg-white/60'}`}>
                                <BadgeIcon level={badge.badge_level.toLowerCase() as BadgeLevel} size={14} />
                                <span className={`font-mono text-[10px] uppercase font-bold truncate max-w-[120px] ${isFlagged ? 'text-red-600' : 'text-ink'}`}>
                                  {badge.skill_category.name}
                                </span>
                                {isFlagged && <span title="Integrity Consideration Flag" className="text-[10px]">⚠️</span>}
                              </div>
                            );
                          })}
                          {candidate.public_badges.length > 3 && (
                            <div className="flex items-center gap-1.5 border border-structure px-2.5 py-1 bg-structure/10 rounded-md font-mono text-[10px] uppercase text-data">
                              +{candidate.public_badges.length - 3} more
                            </div>
                          )}
                        </div>
                        
                        {bestBadge && bestBadge.ai_feedback_text && (
                          <div className="text-sm text-ink/70 italic border-l-2 border-verification pl-3 line-clamp-2">
                            "{bestBadge.ai_feedback_text}"
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 md:w-48 w-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity transform md:translate-x-4 group-hover:translate-x-0 duration-300">
                        <Link 
                          to={`/profile/${candidate.id}`} 
                          className="w-full py-2.5 bg-ink text-vellum text-center rounded-lg font-mono text-xs uppercase tracking-widest hover:bg-ink/90 transition-colors"
                        >
                          View Dossier &rarr;
                        </Link>
                        <button 
                          onClick={() => toggleFollow(candidate.id)}
                          className={`w-full py-2.5 border rounded-lg font-mono text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${savedCandidates.some(s => s.candidate_detail.id === candidate.id) ? 'bg-ink text-vellum border-ink hover:bg-ink/90' : 'bg-white/50 text-ink border-structure hover:border-ink'}`}
                        >
                          {savedCandidates.some(s => s.candidate_detail.id === candidate.id) ? (
                            <>
                              <svg className="w-3 h-3 text-verification fill-current" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
                              Following
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3 text-data" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
                              Follow
                            </>
                          )}
                        </button>
                        <div className="text-center w-full mt-1.5">
                          <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-data">
                            Public to candidate
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {activeTab === 'saved' && (
        <div>
          <h2 className="font-serif text-2xl mb-6">Your Saved Candidates</h2>
          {savedCandidates.length === 0 ? (
            <EmptyState 
              title="No saved candidates" 
              description="You haven't saved any candidates yet. Browse the marketplace and save candidates to review them here."
            />
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {savedCandidates.map((saved, i) => {
                const candidate = saved.candidate_detail;
                const bestBadge = candidate.public_badges[0];
                return (
                  <motion.div 
                    key={saved.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-vellum border border-structure rounded-xl p-6 shadow-sm flex flex-col md:flex-row gap-6"
                  >
                    <div className="flex items-center gap-6 md:w-1/3">
                      {bestBadge ? (
                        <ScoreRing percentage={bestBadge.overall_score || 0} size={80} strokeWidth={4} />
                      ) : (
                        <div className="w-[80px] h-[80px] rounded-full bg-structure/20 flex items-center justify-center font-mono text-xs text-data">N/A</div>
                      )}
                      <div>
                        <h3 className="font-serif text-xl truncate text-ink mb-1">{candidate.email}</h3>
                        <div className="font-mono text-[10px] uppercase text-data tracking-widest">
                          Saved: {new Date(saved.saved_at).toLocaleDateString()}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {candidate.public_badges.slice(0, 2).map(badge => (
                            <div key={badge.id} className="flex items-center gap-1.5 border border-structure px-2 py-0.5 bg-white/60 rounded text-[10px] uppercase font-bold text-ink">
                              <BadgeIcon level={badge.badge_level.toLowerCase() as BadgeLevel} size={12} />
                              {badge.skill_category.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col gap-3">
                      <label className="font-mono text-xs uppercase tracking-widest text-data">Recruiter Notes</label>
                      <textarea
                        className="w-full h-full min-h-[100px] p-3 bg-white/50 border border-structure rounded-lg font-mono text-sm text-ink focus:outline-none focus:border-verification resize-none"
                        placeholder="Add notes about this candidate..."
                        defaultValue={saved.notes}
                        onBlur={(e) => updateNotes(candidate.id, e.target.value)}
                      ></textarea>
                    </div>

                    <div className="md:w-48 flex flex-col gap-2 justify-center">
                       <Link 
                        to={`/profile/${candidate.id}`} 
                        className="w-full py-2.5 bg-ink text-vellum text-center rounded-lg font-mono text-xs uppercase tracking-widest hover:bg-ink/90 transition-colors"
                      >
                        View Dossier
                      </Link>
                      <a 
                        href={`mailto:${candidate.email}`}
                        className="w-full py-2.5 border border-structure bg-white/50 text-ink text-center rounded-lg font-mono text-xs uppercase tracking-widest hover:border-ink transition-colors"
                      >
                        Contact
                      </a>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {activeTab === 'requirements' && (
        <div className="max-w-3xl mx-auto py-8">
          <div className="bg-white border border-structure/30 p-8 shadow-sm">
            <h2 className="font-serif text-2xl text-ink mb-6">Company Requirements Profile</h2>
            <p className="text-sm text-data mb-8">
              Set standard requirements for your company. Candidates will see this profile when browsing your jobs.
            </p>
            
            <form onSubmit={handleSaveRequirements} className="space-y-6">
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-ink mb-2">Company Name</label>
                <input
                  type="text"
                  value={reqCompany}
                  onChange={e => setReqCompany(e.target.value)}
                  className="w-full border border-structure p-3 focus:outline-none focus:border-ink font-mono text-sm"
                  placeholder="e.g. TechCorp"
                  required
                />
              </div>
              
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-ink mb-2">Company Description</label>
                <textarea
                  value={reqDesc}
                  onChange={e => setReqDesc(e.target.value)}
                  className="w-full border border-structure p-3 focus:outline-none focus:border-ink text-sm min-h-[100px]"
                  placeholder="Tell candidates what you do..."
                />
              </div>
              
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-ink mb-2">Minimum Preferred Score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={reqMinScore}
                  onChange={e => setReqMinScore(e.target.value ? Number(e.target.value) : '')}
                  className="w-full md:w-1/3 border border-structure p-3 focus:outline-none focus:border-ink font-mono text-sm"
                  placeholder="e.g. 75"
                />
              </div>
              
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-ink mb-2">Required Skills</label>
                <div className="flex flex-wrap gap-2">
                  {allCategories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setReqSkills(prev => 
                          prev.includes(cat.id.toString()) 
                          ? prev.filter(id => id !== cat.id.toString()) 
                          : [...prev, cat.id.toString()]
                        );
                      }}
                      className={`px-3 py-1.5 border rounded-md font-mono text-[10px] uppercase tracking-widest transition-colors ${
                        reqSkills.includes(cat.id.toString()) 
                        ? 'bg-verification/10 border-verification text-verification' 
                        : 'bg-white border-structure text-data hover:border-ink'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 border-t border-structure/20">
                <button
                  type="submit"
                  disabled={savingReqs}
                  className="bg-ink text-white px-8 py-3 font-mono text-xs uppercase tracking-widest hover:bg-ink/90 disabled:opacity-50"
                >
                  {savingReqs ? 'Saving...' : 'Save Requirements'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
