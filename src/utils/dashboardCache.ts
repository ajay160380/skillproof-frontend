/**
 * Local cache utility for Instant (0ms) Dashboard Rendering.
 * Implements the Stale-While-Revalidate (SWR) pattern:
 * 1. UI renders instantly from cache without waiting for network.
 * 2. Fresh data is fetched silently in the background and updates the screen.
 */

export interface CandidateCachedData {
  categories?: any[];
  testsByCategory?: Record<number, any[]>;
  badges?: Record<number, any>;
  allBadges?: any[];
  attempts?: any[];
  followersCount?: number;
  latestFollowerCompany?: string;
  invites?: any[];
  analytics?: any;
  jobs?: any[];
  profile?: any;
  projects?: any[];
  resume?: any;
  suggestedTests?: any[];
}

export interface RecruiterCachedData {
  stats?: any;
  allCategories?: any[];
  reqCompany?: string;
  reqDesc?: string;
  reqMinScore?: string | number;
  reqSkills?: string[];
  savedCandidates?: any[];
  jobs?: any[];
  profile?: any;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export function getCachedCandidateData(userId?: number | string): CandidateCachedData | null {
  try {
    const key = `sp_cache_candidate_${userId || 'current'}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.data || null;
  } catch (err) {
    console.warn('Failed to load candidate cache:', err);
    return null;
  }
}

export function setCachedCandidateData(userId: number | string | undefined, data: CandidateCachedData): void {
  try {
    const key = `sp_cache_candidate_${userId || 'current'}`;
    localStorage.setItem(
      key,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    );
  } catch (err) {
    console.warn('Failed to save candidate cache:', err);
  }
}

export function getCachedRecruiterData(userId?: number | string): RecruiterCachedData | null {
  try {
    const key = `sp_cache_recruiter_${userId || 'current'}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.data || null;
  } catch (err) {
    console.warn('Failed to load recruiter cache:', err);
    return null;
  }
}

export function setCachedRecruiterData(userId: number | string | undefined, data: RecruiterCachedData): void {
  try {
    const key = `sp_cache_recruiter_${userId || 'current'}`;
    localStorage.setItem(
      key,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    );
  } catch (err) {
    console.warn('Failed to save recruiter cache:', err);
  }
}
