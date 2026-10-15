import { useState } from 'react';
import { motion } from 'framer-motion';

interface TestData {
  title: string;
  instructions?: string;
  problem_statement?: string;
}

interface PracticalTestProps {
  testId: string;
  testData: TestData;
  onSubmit: (data: { project_url: string }) => void;
}

export function PracticalTest({ testData, onSubmit }: PracticalTestProps) {
  const [projectUrl, setProjectUrl] = useState('');
  
  const submitTest = () => {
    if (!projectUrl) return;
    onSubmit({ project_url: projectUrl });
  };

  return (
    <div className="flex-1 overflow-auto bg-[#0A0A0B] text-white flex items-center justify-center p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-[#141415] border border-[#2A2A2D] p-8 rounded-3xl shadow-2xl"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-mono text-[10px] uppercase tracking-wider font-bold">
            Practical Project Challenge
          </span>
        </div>
        <h2 className="font-sans tracking-tight text-3xl font-bold text-white mb-4">{testData.title}</h2>
        
        <div className="bg-[#1E1E21] p-6 rounded-2xl font-mono text-xs mb-6 whitespace-pre-wrap text-[#D4D4D8] border border-[#2A2A2D]">
          <h3 className="uppercase tracking-widest text-emerald-400 font-bold mb-2 text-[10px]">Instructions</h3>
          {testData.instructions || "Please complete the project and submit the repository or portfolio URL below."}
        </div>

        {testData.problem_statement && (
           <div className="bg-[#1E1E21] p-6 rounded-2xl font-mono text-xs mb-6 whitespace-pre-wrap text-[#D4D4D8] border border-[#2A2A2D]">
             <h3 className="uppercase tracking-widest text-emerald-400 font-bold mb-2 text-[10px]">Problem Statement</h3>
             {testData.problem_statement}
           </div>
        )}

        <div className="mb-8">
          <label className="block font-mono text-xs uppercase tracking-widest text-[#A0A0A3] mb-2 font-bold">
            Project URL (GitHub, GitLab, Live Demo, etc.)
          </label>
          <input
            type="url"
            value={projectUrl}
            onChange={e => setProjectUrl(e.target.value)}
            className="w-full bg-[#1E1E21] border border-[#2A2A2D] rounded-xl p-4 font-mono text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
            placeholder="https://github.com/username/project"
            required
          />
        </div>
        
        <div className="flex justify-end pt-6 border-t border-[#2A2A2D]">
          <button
            onClick={submitTest}
            disabled={!projectUrl}
            className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-[#0A0A0B] font-mono text-xs uppercase tracking-widest font-bold shadow-lg transition-all rounded-xl disabled:opacity-50 hover:scale-[1.02]"
          >
            Submit Project &rarr;
          </button>
        </div>
      </motion.div>
    </div>
  );
}

