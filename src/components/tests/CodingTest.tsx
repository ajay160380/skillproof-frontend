import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import { useIntegrityMonitor } from '../../hooks/useIntegrityMonitor';
import { IntegrityNotice } from '../IntegrityNotice';

interface CodingTestProps {
  testId: string;
  testData?: any;
  onSubmit: (payload: any) => void;
}

export function CodingTest({ testData, onSubmit }: CodingTestProps) {
  const [code, setCode] = useState('# Write your solution here\n\n');
  const [submitting, setSubmitting] = useState(false);
  const [pasteCount, setPasteCount] = useState(0);
  const { tabSwitches, devtoolsDetected } = useIntegrityMonitor(true);

  const title = testData?.title || 'Coding Challenge';
  const statement = testData?.problem_statement || testData?.instructions || 'Solve the problem below.';
  const testCases = testData?.test_cases || [];

  // Removed hardcoded auto-submit logic. Relying entirely on Groq backend scoring.

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit({
      code_submission: code,
      keystroke_log: {
        paste_count: pasteCount,
        tab_switches: tabSwitches,
        devtools_detected: devtoolsDetected,
      }
    });
    setSubmitting(false);
  };

  const handleEditorDidMount = (editor: any) => {
    editor.onDidPaste(() => {
      setPasteCount(prev => prev + 1);
      toast('⚠️ Code Paste Detected! Copy-pasting is logged for AI proctoring audit.', {
        icon: '📋',
        style: { background: '#FFFBEB', color: '#D97706', border: '1px solid #F59E0B' }
      });
    });
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#0A0A0B] text-white min-h-[calc(100vh-65px)]">
      <div className="w-full md:w-1/3 border-r border-[#2A2A2D] bg-[#141415] p-6 flex flex-col overflow-y-auto">
        <IntegrityNotice />
        {/* Proctoring Active Banner */}
        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
              AI Proctor Active
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px] text-[#A0A0A3]">
            <span>Switches: <strong className={tabSwitches > 0 ? 'text-red-400' : 'text-white'}>{tabSwitches}</strong></span>
            <span>Pastes: <strong className={pasteCount > 0 ? 'text-amber-400' : 'text-white'}>{pasteCount}</strong></span>
          </div>
        </div>

        <h2 className="font-sans font-bold text-2xl text-white mb-2">{title}</h2>
        {testData?.difficulty && (
          <span className={`inline-block w-fit font-mono text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-4 border ${
            testData.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            testData.difficulty === 'hard' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            {testData.difficulty} • {testData.duration_minutes || 45}min
          </span>
        )}
        <div className="font-mono text-xs text-[#D4D4D8] leading-relaxed mb-6 bg-[#0A0A0B] p-4 rounded-xl border border-[#2A2A2D]">
          <p>{statement}</p>
        </div>

        {testCases.length > 0 && (
          <div className="mb-6 space-y-3">
            <div className="font-mono text-[10px] text-[#A0A0A3] uppercase tracking-widest font-bold">Sample Test Cases</div>
            {testCases.map((tc: any, i: number) => (
              <div key={i} className="bg-[#0A0A0B] border border-[#2A2A2D] rounded-xl p-3 font-mono text-xs text-[#D4D4D8] space-y-1">
                <div><span className="text-[#A0A0A3]">Input:</span> <code className="text-emerald-400">{tc.input}</code></div>
                <div><span className="text-[#A0A0A3]">Expected:</span> <code className="text-white font-bold">{tc.expected_output}</code></div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-auto pt-4">
          <button 
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0A0A0B] py-3.5 font-mono text-xs uppercase tracking-widest transition-all rounded-xl disabled:opacity-50 font-bold shadow-lg shadow-emerald-500/10 hover:scale-[1.02] active:scale-[0.98]"
          >
            {submitting ? 'Verifying Sandbox Execution...' : 'Submit for AI Verification'}
          </button>
        </div>
      </div>
      
      <div className="flex-1 bg-[#1E1E1E]">
        <Editor
          height="100%"
          defaultLanguage="python"
          theme="vs-dark"
          value={code}
          onChange={(val) => setCode(val || '')}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'JetBrains Mono, monospace',
            padding: { top: 24 },
          }}
        />
      </div>
    </div>
  );
}
