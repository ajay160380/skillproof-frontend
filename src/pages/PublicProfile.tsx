import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { BadgeIcon, type BadgeLevel } from '../components/BadgeIcon';
import { EmptyState } from '../components/EmptyState';
import { Loader } from '../components/Loader';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface CandidateProfile {
  id: string;
  email: string;
  full_name?: string;
  public_badges: Array<{
    id: string;
    skill_category: { name: string; slug: string };
    badge_level: string;
    overall_score?: number;
    sub_scores?: Record<string, number>;
    ai_feedback_text?: string;
    cheating_flags?: any;
    issued_at: string;
  }>;
}

export function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const { user } = useAuthStore();
  const isRecruiter = user?.role === 'recruiter';

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await api.get(`/marketplace/candidates/${id}/`);
        setProfile(res.data);
        
        if (isRecruiter) {
          const followsRes = await api.get('/network/my-follows/');
          const follows = followsRes.data.results || followsRes.data || [];
          setIsFollowing(follows.some((s: any) => s.candidate_detail.id.toString() === id));
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [id, isRecruiter]);

  const toggleFollow = async () => {
    try {
      if (isFollowing) {
        await api.delete(`/network/unfollow/${id}/`);
        setIsFollowing(false);
        toast.success('Unfollowed candidate');
      } else {
        await api.post('/network/follow/', { candidate_id: id });
        setIsFollowing(true);
        toast.success('Following candidate');
      }
    } catch (err) {
      toast.error('Failed to update follow status');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Dossier link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLinkedInShare = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex justify-center items-center min-h-[60vh]">
        <Loader text="Decrypting Dossier..." size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 p-8 flex justify-center items-center">
        <div className="font-mono text-sm text-seal">Error 404: Dossier not found or not public.</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
      
      {/* Back navigation */}
      {isRecruiter && (
        <div className="mb-6">
          <Link to="/recruiter" className="font-mono text-xs uppercase tracking-widest text-data hover:text-ink transition-colors">
            &larr; Back to Terminal
          </Link>
        </div>
      )}

      <div className="border border-structure bg-vellum shadow-2xl relative overflow-hidden">
        {/* Seal watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
          <BadgeIcon level="platinum" size={400} />
        </div>

        {/* Header */}
        <div className="p-12 border-b border-structure bg-structure/5 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div>
              <div className="font-mono text-xs text-data uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-verification animate-pulse rounded-full"></div>
                Official Verification Dossier
              </div>
              <h1 className="font-serif text-4xl md:text-5xl mb-3 text-ink">{profile.full_name || profile.email}</h1>
              <p className="font-mono text-sm text-data">Candidate ID: {profile.id} | Email: {profile.email}</p>
              
              {/* Share Actions - Hidden on print */}
              <div className="flex flex-wrap items-center gap-3 mt-6 print:hidden">
                <button 
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 px-4 py-2 border border-structure bg-white/50 text-ink font-mono text-[10px] uppercase tracking-widest hover:border-ink transition-all rounded-md"
                >
                  {copied ? <span className="text-verification font-bold">✓ Copied</span> : <span>🔗 Copy Link</span>}
                </button>
                <button 
                  onClick={handleLinkedInShare}
                  className="flex items-center gap-2 px-4 py-2 border border-blue-200 bg-blue-50 text-blue-700 font-mono text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-all rounded-md"
                >
                  <span>in Share on LinkedIn</span>
                </button>
                <button 
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 border border-structure bg-white/50 text-ink font-mono text-[10px] uppercase tracking-widest hover:border-ink transition-all rounded-md"
                >
                  <span>🖨 Save PDF</span>
                </button>
              </div>
            </div>
            {isRecruiter && (
              <div className="flex flex-col gap-3 shrink-0 print:hidden">
                <button 
                  onClick={toggleFollow}
                  className={`px-6 py-3 font-mono text-xs uppercase tracking-widest transition-colors rounded-lg flex items-center justify-center gap-2 shadow-sm ${isFollowing ? 'bg-ink text-vellum border border-ink hover:bg-ink/90' : 'bg-white/50 text-ink border border-structure hover:border-ink'}`}
                >
                  {isFollowing ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-verification fill-current" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
                      Following
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 text-data" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
                      Follow
                    </>
                  )}
                </button>
                <div className="text-center">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-data">
                    Candidates can see that you're following them
                  </span>
                </div>
                <a 
                  href={`mailto:${profile.email}`}
                  className="px-6 py-3 border border-structure bg-white/50 text-ink text-center font-mono text-xs uppercase tracking-widest hover:border-ink transition-colors rounded-lg shadow-sm"
                >
                  Contact Candidate
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Badges / Timeline */}
        <div className="p-12 relative z-10">
          <h2 className="font-mono text-sm uppercase tracking-widest text-ink mb-8 border-b border-structure pb-4 flex items-center gap-3">
            <span>Verified Credentials Timeline</span>
            <span className="bg-structure/20 text-data px-2 py-0.5 rounded text-[10px]">{profile.public_badges?.length || 0} Records</span>
          </h2>
          
          {!profile.public_badges || profile.public_badges.length === 0 ? (
            <div className="py-8">
              <EmptyState 
                title="No credentials found" 
                description="This candidate has not yet earned any verified credentials."
              />
            </div>
          ) : (
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-[39px] top-4 bottom-4 w-[2px] bg-structure/40 z-0"></div>

              <div className="space-y-12">
                {profile.public_badges.map((badge, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    key={badge.id} 
                    className="flex gap-8 items-start relative z-10 group"
                  >
                    
                    {/* Badge Icon with white background to cover line */}
                    <div className="bg-vellum p-2 rounded-full shadow-sm border border-structure group-hover:border-verification transition-colors">
                      <BadgeIcon level={badge.badge_level.toLowerCase() as BadgeLevel} size={48} />
                    </div>

                    <div className="flex-1 border border-structure/50 bg-white/40 p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                      {/* Decorative corner */}
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-structure/20 rounded-tr-xl"></div>
                      
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-serif text-3xl text-ink">{badge.skill_category.name}</h3>
                            <span className="font-mono text-xs font-bold uppercase tracking-widest px-3 py-1 bg-ink text-vellum rounded-md">
                              {badge.badge_level}
                            </span>
                          </div>
                          <div className="font-mono text-[10px] text-data uppercase tracking-widest">
                            Verified on: {new Date(badge.issued_at).toLocaleString()}
                          </div>
                        </div>

                        {badge.overall_score !== undefined && (
                          <div className="text-center">
                            <span className="block font-mono text-xs text-data uppercase tracking-widest mb-1">Score</span>
                            <span className="font-serif text-4xl text-verification leading-none">{badge.overall_score}</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Left col: Sub-scores */}
                        <div className="md:col-span-1">
                          <h4 className="font-mono text-[10px] text-data uppercase tracking-widest mb-4 border-b border-structure pb-2">Competency Breakdown</h4>
                          {badge.sub_scores ? (
                            <div className="space-y-3">
                              {Object.entries(badge.sub_scores).map(([key, value]) => (
                                <div key={key}>
                                  <div className="flex justify-between font-mono text-xs mb-1">
                                    <span className="text-ink/80 capitalize">{key.replace(/_/g, ' ')}</span>
                                    <span className="text-ink font-bold">{value}/100</span>
                                  </div>
                                  <div className="h-1.5 bg-structure/30 rounded-full overflow-hidden">
                                    <div className="h-full bg-verification" style={{ width: `${value}%` }}></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-data font-mono">No sub-scores available.</div>
                          )}
                        </div>

                        {/* Right col: Complete AI Feedback */}
                        <div className="md:col-span-2">
                          <h4 className="font-mono text-[10px] text-data uppercase tracking-widest mb-4 border-b border-structure pb-2">AI Proctored Feedback</h4>
                          
                          {badge.cheating_flags && badge.cheating_flags.ai_suspicion_level === 'high' && (
                            <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded p-3">
                              <span className="font-mono text-[10px] text-red-500 uppercase font-bold tracking-widest block mb-1">⚠️ Integrity Consideration Flag</span>
                              <span className="font-mono text-xs text-red-800/80">This score reflects an AI-detected integrity consideration during assessment (e.g. solution pasting, tab switching).</span>
                            </div>
                          )}

                          {badge.ai_feedback_text ? (
                            <div className="text-sm text-ink/80 leading-relaxed font-serif whitespace-pre-wrap">
                              {badge.ai_feedback_text}
                            </div>
                          ) : (
                            <div className="text-sm text-ink/80 leading-relaxed border-l-2 border-verification pl-4 italic">
                              "This candidate has successfully passed a live, AI-proctored evaluation demonstrating proficiency in this skill category."
                            </div>
                          )}
                        </div>
                      </div>
                      
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-structure bg-structure/5 text-center relative z-10">
          <p className="font-mono text-[10px] text-data uppercase tracking-widest">
            Cryptographically signed by SkillProof &bull; Verified AI Assessment
          </p>
        </div>

      </div>
    </div>
  );
}
