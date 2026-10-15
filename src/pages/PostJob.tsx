import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

interface SkillTest {
  id: number;
  title: string;
  category: {
    name: string;
  };
}

export function PostJob() {
  const [roleTitle, setRoleTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Remote');
  const [salaryRange, setSalaryRange] = useState('$120,000 - $160,000');
  const [minScore, setMinScore] = useState<number>(70);
  const [availableTests, setAvailableTests] = useState<SkillTest[]>([]);
  const [selectedTests, setSelectedTests] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
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
    api.get('/skills/tests/')
      .then(res => setAvailableTests(res.data.results || res.data))
      .catch(() => toast.error('Failed to load available tests'));
  }, [user, navigate]);

  const toggleTest = (id: number) => {
    setSelectedTests(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const generateAIDescription = async () => {
    if (!roleTitle) {
      toast.error('Please enter a role title first');
      return;
    }
    setIsGenerating(true);
    try {
      const res = await api.post('/jobs/generate-description/', {
        role_title: roleTitle,
        company_name: companyName
      });
      if (res.data.description) {
        setDescription(res.data.description);
        toast.success('AI generated description successfully');
      }
    } catch (err) {
      toast.error('Failed to generate description via AI');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTests.length === 0) {
      toast.error('Please select at least one required assessment');
      return;
    }
    
    try {
      await api.post('/jobs/create/', {
        role_title: roleTitle,
        company_name: companyName,
        description,
        location,
        salary_range: salaryRange,
        min_score: minScore,
        required_test_ids: selectedTests,
        is_active: true
      });
      toast.success('Job listing created successfully with verified score requirement!');
      navigate('/jobs/my-listings');
    } catch (err) {
      toast.error('Failed to create job listing');
    }
  };

  return (
    <div className="flex-1 bg-[#0A0A0B] text-white flex flex-col md:flex-row min-h-[calc(100vh-73px)]">
      {/* Left Hero Panel */}
      <div className="w-full md:w-1/3 bg-[#141415] border-r border-[#2A2A2D] p-8 md:p-12 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-mono text-[10px] uppercase tracking-wider mb-6 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Recruiter Suite
          </div>
          <h1 className="font-sans font-bold text-4xl sm:text-5xl text-white mb-6 tracking-tight">Post a Role</h1>
          <p className="text-[#A0A0A3] font-sans leading-relaxed text-sm">
            Create a targeted competency-based job listing. Candidates will need to complete the AI-proctored skill tests you select and meet your minimum verified score threshold to unlock direct application.
          </p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full md:w-2/3 p-8 md:p-12 flex items-center justify-center bg-[#0A0A0B]">
        <div className="w-full max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-[#A0A0A3] mb-2 font-bold">Role Title</label>
                <input
                  type="text"
                  required
                  value={roleTitle}
                  onChange={e => setRoleTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-[#141415] border border-[#2A2A2D] rounded-xl focus:outline-none focus:border-emerald-500 font-sans text-sm text-white placeholder-[#71717A] transition-colors"
                  placeholder="e.g. Senior AI Platform Engineer"
                />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-[#A0A0A3] mb-2 font-bold">Company Name</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#141415] border border-[#2A2A2D] rounded-xl focus:outline-none focus:border-emerald-500 font-sans text-sm text-white placeholder-[#71717A] transition-colors"
                  placeholder={user?.company_name || 'Anthropic Core'}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-[#A0A0A3] mb-2 font-bold">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full px-4 py-3 bg-[#141415] border border-[#2A2A2D] rounded-xl focus:outline-none focus:border-emerald-500 font-sans text-sm text-white placeholder-[#71717A] transition-colors"
                  placeholder="e.g. Remote / SF"
                />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-[#A0A0A3] mb-2 font-bold">Salary Range</label>
                <input
                  type="text"
                  value={salaryRange}
                  onChange={e => setSalaryRange(e.target.value)}
                  className="w-full px-4 py-3 bg-[#141415] border border-[#2A2A2D] rounded-xl focus:outline-none focus:border-emerald-500 font-sans text-sm text-white placeholder-[#71717A] transition-colors"
                  placeholder="e.g. $140,000 - $180,000"
                />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-emerald-400 mb-2 font-bold">
                  Min Score Threshold
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={40}
                    max={100}
                    value={minScore}
                    onChange={e => setMinScore(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-[#141415] border border-emerald-500/40 rounded-xl focus:outline-none focus:border-emerald-400 font-mono text-sm font-bold text-emerald-400 transition-colors"
                  />
                  <span className="font-mono text-sm font-bold text-emerald-400">%</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block font-mono text-xs uppercase tracking-widest text-[#A0A0A3] font-bold">Job Description</label>
                <button
                  type="button"
                  onClick={generateAIDescription}
                  disabled={isGenerating || !roleTitle}
                  className="font-mono text-xs flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                >
                  <span className="text-sm">✨</span>
                  {isGenerating ? 'Generating...' : 'AI Generate'}
                </button>
              </div>
              <textarea
                required
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-[#141415] border border-[#2A2A2D] rounded-xl focus:outline-none focus:border-emerald-500 font-sans text-sm text-white placeholder-[#71717A] transition-colors resize-none leading-relaxed"
                placeholder="Briefly describe the responsibilities and requirements..."
              />
            </div>

            <div className="pt-4 border-t border-[#2A2A2D]">
              <div className="flex justify-between items-center mb-4">
                <label className="block font-mono text-xs uppercase tracking-widest text-[#A0A0A3] font-bold">
                  Required Skill Assessments ({selectedTests.length} selected)
                </label>
                <input
                  type="text"
                  placeholder="Filter skills..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="px-3.5 py-1.5 bg-[#141415] border border-[#2A2A2D] rounded-xl focus:outline-none focus:border-emerald-500 font-mono text-xs text-white placeholder-[#71717A] transition-colors w-48"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                {availableTests
                  .filter(test => 
                    test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    test.category.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(test => {
                  const isSelected = selectedTests.includes(test.id);
                  return (
                    <button
                      type="button"
                      key={test.id}
                      onClick={() => toggleTest(test.id)}
                      className={`text-left p-3.5 rounded-xl border transition-all ${
                        isSelected 
                          ? 'bg-emerald-500/10 border-emerald-500 text-white' 
                          : 'bg-[#141415] border-[#2A2A2D] text-[#D4D4D8] hover:border-[#3A3A3D]'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-sans font-bold text-sm text-white">{test.title}</span>
                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-[#2A2A2D]'}`}>
                          {isSelected && <span className="text-[#0A0A0B] text-xs font-bold">✓</span>}
                        </div>
                      </div>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-400 mt-1 block">
                        {test.category.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0A0A0B] py-4 rounded-xl font-mono text-xs uppercase tracking-widest font-bold shadow-xl shadow-emerald-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              Publish Job Listing with Score Requirement &rarr;
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}



