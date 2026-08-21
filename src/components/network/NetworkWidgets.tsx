import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../../services/api';

const itemVariants: any = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export const NetworkDiscoveryWidget = () => {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<'all' | 'candidate' | 'recruiter'>('all');
  const [users, setUsers] = useState<any[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUsers = async (searchQuery = '', searchRole = role) => {
    try {
      setLoading(true);
      const roleQuery = searchRole === 'all' ? '' : `&role=${searchRole}`;
      const res = await api.get(`/network/search/?q=${searchQuery}${roleQuery}`);
      setUsers(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowing = async () => {
    try {
      const res = await api.get('/network/my-following/');
      const ids = new Set<number>((res.data.results || res.data).map((f: any) => f.following_detail.id));
      setFollowingIds(ids);
    } catch (err) {
      console.error('Failed to fetch following:', err);
    }
  };

  useEffect(() => {
    fetchUsers(query, role);
    fetchFollowing();
  }, [role]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(query, role);
  };

  const toggleFollow = async (userId: number) => {
    try {
      if (followingIds.has(userId)) {
        await api.delete(`/network/unfollow-user/${userId}/`);
        const newIds = new Set(followingIds);
        newIds.delete(userId);
        setFollowingIds(newIds);
      } else {
        await api.post('/network/follow-user/', { user_id: userId });
        const newIds = new Set(followingIds);
        newIds.add(userId);
        setFollowingIds(newIds);
      }
    } catch (err) {
      console.error('Failed to follow/unfollow:', err);
    }
  };

  const handleMessage = async (userId: number) => {
    try {
      const res = await api.post('/messages/start-conversation/', { recipient_id: userId });
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.set('tab', 'Messages');
      currentParams.set('conversation', res.data.id);
      navigate(`?${currentParams.toString()}`);
    } catch (err) {
      console.error('Failed to start conversation:', err);
      alert('Unable to start conversation. Make sure you are following each other.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div className="flex bg-white/5 p-1 rounded-xl w-full md:w-auto border border-white/10">
            {['all', 'candidate', 'recruiter'].map((r) => (
              <button
                key={r}
                onClick={() => setRole(r as any)}
                className={`flex-1 md:px-6 py-2 rounded-lg font-mono text-[10px] uppercase tracking-widest font-bold transition-all ${
                  role === r
                    ? 'bg-white shadow-sm text-ink'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {r === 'all' ? 'All Users' : r === 'candidate' ? 'Candidates' : 'Recruiters'}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSearch} className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by name, company, or headline..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-24 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none text-white font-serif placeholder-white/30 transition-all"
          />
          <button type="submit" className="absolute inset-y-2 right-2 bg-white/10 text-white px-6 rounded-lg font-mono text-[10px] uppercase font-bold tracking-widest hover:bg-white/20 transition-colors">
            Search
          </button>
        </form>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="text-center py-20 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
          <div className="w-8 h-8 border-4 border-white/10 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-white/50">Discovering network...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 bg-white/5 backdrop-blur-md rounded-2xl border border-dashed border-white/10">
          <span className="text-5xl mb-4 block opacity-30">🌐</span>
          <h3 className="font-serif text-xl font-bold text-white mb-2">No users found</h3>
          <p className="font-mono text-[10px] uppercase tracking-widest text-white/50">Try adjusting your search terms or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <motion.div key={user.id} variants={itemVariants} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:border-white/20 hover:shadow-lg transition-all group">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center border border-white/20 text-xl font-serif text-white font-bold">
                    {(user.full_name || user.username)[0].toUpperCase()}
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-brand-primary rounded-full"></span>
                    <span className="font-mono text-[8px] uppercase tracking-widest text-white/70 font-bold">{user.role}</span>
                  </div>
                </div>
                <h3 className="font-serif text-lg font-bold text-white mb-1 group-hover:text-brand-primary transition-colors">{user.full_name || user.username}</h3>
                <p className="text-xs text-white/50 font-mono tracking-wide">{user.headline || 'Open to opportunities'}</p>
              </div>
              
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4 font-mono text-[9px] uppercase tracking-widest text-brand-primary opacity-80">
                  <span>🌐</span> {user.company_name || 'SkillProof Network'}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleFollow(user.id)}
                    className={`flex-1 py-2.5 rounded-xl font-mono text-[10px] uppercase font-bold tracking-widest transition-all ${
                      followingIds.has(user.id) 
                        ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20' 
                        : 'bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:border-brand-primary/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                    }`}
                  >
                    {followingIds.has(user.id) ? '✓ Following' : '+ Follow'}
                  </button>
                  <button onClick={() => handleMessage(user.id)} className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:bg-brand-primary hover:border-brand-primary hover:text-white transition-all">
                    💬
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export const PostComponent = ({ post, onLike, onDelete }: { post: any, onLike: (id: number) => void, onDelete: (id: number) => void }) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const currentUserStr = localStorage.getItem('user_info');
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const isAuthor = currentUser?.id === post.author;

  const fetchComments = async () => {
    try {
      const res = await api.get(`/network/feed/posts/${post.id}/comments/`);
      setComments(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to fetch comments', err);
    }
  };

  useEffect(() => {
    if (showComments) fetchComments();
  }, [showComments]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await api.post(`/network/feed/posts/${post.id}/comments/`, { content: newComment });
      setNewComment('');
      fetchComments();
    } catch (err) {
      console.error('Failed to add comment', err);
    }
  };

  return (
    <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-sm mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {post.author_detail?.avatar_url ? (
            <img src={post.author_detail.avatar_url} alt="author" className="w-10 h-10 rounded-full object-cover border border-white/20" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-serif font-bold text-white">
              {(post.author_detail?.full_name || post.author_detail?.username || 'U')[0].toUpperCase()}
            </div>
          )}
          <div>
            <a href={`/profile/${post.author_detail?.username}`} className="font-serif font-bold text-white text-sm hover:text-brand-primary transition-colors">
              {post.author_detail?.full_name || post.author_detail?.username}
            </a>
            <p className="font-mono text-[9px] text-white/50 uppercase tracking-widest">{post.author_detail?.company_name || 'Candidate'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[8px] text-white/50 uppercase tracking-widest">{new Date(post.created_at).toLocaleDateString()}</span>
          {isAuthor && (
            <button onClick={() => onDelete(post.id)} className="text-red-400 hover:text-red-600 transition-colors font-mono text-[9px] uppercase tracking-widest font-bold flex items-center gap-1">
              <span>🗑️</span> Delete
            </button>
          )}
        </div>
      </div>
      
      <p className="font-serif text-white/80 text-sm mb-4 whitespace-pre-wrap">{post.content}</p>
      
      {post.image && (
        <div className="mb-4 rounded-xl overflow-hidden border border-white/10">
          <img src={post.image} alt="Post content" className="w-full max-h-96 object-cover" />
        </div>
      )}
      
      {post.linked_badge_detail && (
        <div className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-2xl shadow-sm border border-white/10">
            🏅
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-brand-primary font-bold mb-0.5">Verified Credential</p>
            <p className="font-serif font-bold text-white text-sm">{post.linked_badge_detail.skill_category?.name}</p>
            <p className="font-mono text-[10px] text-white/50">Score: {post.linked_badge_detail.score}/100</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-6 border-t border-white/10 pt-4">
        <button onClick={() => onLike(post.id)} className={`flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest font-bold transition-colors ${post.is_liked ? 'text-pink-500' : 'text-white/50 hover:text-white'}`}>
          <span className="text-sm">{post.is_liked ? '❤️' : '🤍'}</span> {post.likes_count || 0}
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest font-bold text-white/50 hover:text-white transition-colors">
          <span className="text-sm">💬</span> {post.comments_count || 0}
        </button>
      </div>

      {showComments && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <form onSubmit={handleAddComment} className="flex gap-2 mb-4">
            <input 
              type="text" 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..." 
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 font-serif text-sm text-white focus:outline-none focus:border-brand-primary"
            />
            <button type="submit" className="bg-white text-black font-mono text-[9px] uppercase tracking-widest px-4 rounded-lg hover:bg-white/80 transition-colors">Post</button>
          </form>
          <div className="space-y-3">
            {comments.map(c => (
              <div key={c.id} className="flex gap-2 text-sm">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-1 text-white font-bold text-xs">
                  {(c.author_detail?.full_name || 'U')[0].toUpperCase()}
                </div>
                <div className="bg-white/5 rounded-xl rounded-tl-none p-3 flex-1 border border-white/10">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-serif font-bold text-xs text-white">{c.author_detail?.full_name}</span>
                    <span className="font-mono text-[8px] text-white/50">{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="font-serif text-sm text-white/80">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export const FeedWidget = ({ authorId, hidePostInput = false }: { authorId?: string | number, hidePostInput?: boolean }) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');

  const [image, setImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await api.get(authorId ? `/network/feed/posts/?author=${authorId}` : '/network/feed/posts/');
      setPosts(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to fetch posts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !image) return;
    try {
      const formData = new FormData();
      formData.append('content', content);
      if (image) {
        formData.append('image', image);
      }
      
      await api.post('/network/feed/posts/', formData);
      setContent('');
      setImage(null);
      fetchPosts();
    } catch (err) {
      console.error('Failed to create post', err);
    }
  };

  const handleLike = async (id: number) => {
    try {
      const post = posts.find(p => p.id === id);
      if (post.is_liked) {
        await api.delete(`/network/feed/posts/${id}/like/`);
      } else {
        await api.post(`/network/feed/posts/${id}/like/`);
      }
      fetchPosts(); // Refresh to get updated counts
    } catch (err) {
      console.error('Failed to toggle like', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await api.delete(`/network/feed/posts/${id}/`);
      fetchPosts();
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {!hidePostInput && (
        <div className="bg-white/60 backdrop-blur-xl border border-structure/30 rounded-2xl p-6 shadow-sm mb-8">
          <form onSubmit={handlePost}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share an update, achievement, or question..."
              className="w-full bg-white border border-structure/20 rounded-xl p-4 font-serif text-ink focus:outline-none focus:border-verification min-h-[100px] resize-none mb-4"
            />
            {image && (
              <div className="relative mb-4 inline-block">
                <img src={URL.createObjectURL(image)} alt="Preview" className="max-h-40 rounded-lg border border-structure/20" />
                <button 
                  type="button" 
                  onClick={() => setImage(null)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold shadow-md hover:bg-red-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="flex justify-between items-center">
              <div>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={(e) => e.target.files && setImage(e.target.files[0])}
                  className="hidden" 
                />
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-data hover:text-ink transition-colors flex items-center gap-2"
                >
                  <span className="text-xl">📷</span>
                  <span className="font-mono text-[10px] uppercase tracking-widest font-bold">Image</span>
                </button>
              </div>
              <button 
                type="submit" 
                disabled={!content.trim() && !image}
                className="bg-structure/10 text-ink font-mono text-[10px] font-bold uppercase tracking-widest px-6 py-2.5 rounded-xl hover:bg-structure/20 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                Post
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="font-mono text-[10px] uppercase tracking-widest text-data">Loading feed...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 bg-structure/5 rounded-2xl border border-dashed border-structure/20">
          <span className="text-4xl mb-4 block opacity-50">📭</span>
          <h3 className="font-serif text-lg font-bold text-ink mb-2">Your feed is empty</h3>
          <p className="font-mono text-[10px] uppercase tracking-widest text-data">Follow more candidates to see their updates here.</p>
        </div>
      ) : (
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1 } } }}>
          {posts.map(post => (
            <PostComponent key={post.id} post={post} onLike={handleLike} onDelete={handleDelete} />
          ))}
        </motion.div>
      )}
    </div>
  );
};

export const FollowersWidget = () => {
  const [followers, setFollowers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleMessage = async (userId: number) => {
    try {
      const res = await api.post('/messages/start-conversation/', { recipient_id: userId });
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.set('tab', 'Messages');
      currentParams.set('conversation', res.data.id);
      navigate(`?${currentParams.toString()}`);
    } catch (err) {
      console.error('Failed to start conversation:', err);
      alert('Unable to start conversation. Make sure you are following each other.');
    }
  };

  const fetchFollowers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/network/my-followers/');
      setFollowers(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to fetch followers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowers();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="font-mono text-[10px] uppercase tracking-widest text-data">Loading followers...</p>
      </div>
    );
  }

  if (followers.length === 0) {
    return (
      <div className="text-center py-12 bg-structure/5 rounded-2xl border border-dashed border-structure/20 shadow-sm">
        <span className="text-4xl mb-4 block opacity-50">👥</span>
        <h3 className="font-serif text-lg font-bold text-ink mb-2">No followers yet</h3>
        <p className="font-mono text-[10px] uppercase tracking-widest text-data">When recruiters or candidates follow you, they will appear here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-structure/30 rounded-2xl p-8 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {followers.map(follow => {
          const follower = follow.follower_detail;
          if (!follower) return null;
          return (
            <motion.div key={follow.id} variants={itemVariants} className="bg-white p-6 rounded-xl border border-structure/20 shadow-sm flex items-start gap-4 hover:border-verification transition-colors">
              {follower.avatar_url ? (
                <img src={follower.avatar_url} alt={follower.full_name} className="w-12 h-12 rounded-full object-cover border border-structure/20" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-structure/10 flex items-center justify-center font-serif font-bold text-ink shrink-0">
                  {(follower.full_name || follower.username || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <a href={`/profile/${follower.username}`} className="font-serif font-bold text-ink hover:text-verification transition-colors block truncate">
                  {follower.full_name || follower.username}
                </a>
                <p className="font-mono text-[10px] text-data mt-0.5 truncate capitalize">{follower.company_name || follower.role}</p>
                <p className="font-mono text-[8px] uppercase tracking-widest text-data mt-2">
                  Followed on {new Date(follow.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleMessage(follower.id)}
                className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-structure/10 text-ink hover:bg-structure/20 rounded-xl transition-colors active:scale-95 self-center"
                title="Message"
              >
                💬
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
