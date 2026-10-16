import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface AIPrepGuideViewProps {
  guideText: string;
  onDismiss?: () => void;
}

interface ParsedQuestion {
  qNum: string;
  qText: string;
  tip: string;
}

function formatInline(text: string): string {
  if (!text) return '';
  return text
    .replace(/->/g, '→')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*([^*\n]+?)\*/g, '<em class="text-emerald-300 not-italic font-medium">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-[#0A0A0B] text-emerald-400 font-mono text-xs rounded border border-[#2A2A2D]">$1</code>');
}

function parseQuestions(text: string): ParsedQuestion[] | null {
  if (!text) return null;

  // Split by horizontal rules if present, or detect "**Interview Question" pattern
  const sections = text.split(/\n\s*---\s*\n/).map(s => s.trim()).filter(Boolean);

  if (sections.length < 2 && !text.includes('**Interview Question')) {
    // Try splitting by "**Interview Question" or "Interview Question"
    const regexSplit = text.split(/(?=\*\*(?:Interview )?Question\s*\d+\*\*)/i).map(s => s.trim()).filter(Boolean);
    if (regexSplit.length >= 2) {
      return parseSections(regexSplit);
    }
    return null;
  }

  return parseSections(sections);
}

function parseSections(sections: string[]): ParsedQuestion[] {
  return sections.map((sec, i) => {
    // Extract Question Number
    const qMatch = sec.match(/\*\*(?:Interview )?Question\s*(\d+)\*\*/i) || sec.match(/(?:Interview )?Question\s*(\d+)/i);
    const qNum = qMatch ? `Question ${qMatch[1]}` : `Question ${i + 1}`;

    // Extract Tip
    const tipMatch = sec.match(/\*\*Tip:\*\*\s*([\s\S]*)/i) || sec.match(/Tip:\s*([\s\S]*)/i);
    let tip = tipMatch ? tipMatch[1].trim() : '';

    // Extract Question Text (everything before the tip, without the title)
    let qText = sec
      .replace(/\*\*(?:Interview )?Question\s*\d+\*\*/gi, '')
      .replace(/(?:Interview )?Question\s*\d+/gi, '')
      .replace(/\*\*Tip:\*\*[\s\S]*/gi, '')
      .replace(/Tip:[\s\S]*/gi, '')
      .trim();

    // Clean up surrounding quotes and asterisks
    qText = qText.replace(/^[\*\"\s]+|[\*\"\s]+$/g, '').trim();

    // If question is still in quotation marks inside italics
    qText = qText.replace(/^"|"$/g, '').trim();

    return { qNum, qText, tip };
  });
}

export function AIPrepGuideView({ guideText, onDismiss }: AIPrepGuideViewProps) {
  const [copied, setCopied] = useState(false);
  const parsedQuestions = parseQuestions(guideText);

  const handleCopy = () => {
    // Strip markdown asterisks for clean text copy
    const cleanText = guideText.replace(/\*\*/g, '').replace(/\*/g, '');
    navigator.clipboard.writeText(cleanText);
    setCopied(true);
    toast.success('Interview guide copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 p-6 bg-[#18181B] border border-emerald-500/30 rounded-3xl shadow-xl space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2A2A2D] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AI Interview Preparation Guide
            </span>
          </div>
          <h4 className="font-sans font-bold text-lg text-white">
            Targeted Technical Questions & Strategy
          </h4>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopy}
            className="px-3.5 py-1.5 rounded-xl bg-[#27272A] hover:bg-[#3F3F46] border border-[#3F3F46] font-mono text-xs text-[#D4D4D8] hover:text-white transition-all flex items-center gap-1.5"
          >
            <span>{copied ? '✓' : '📋'}</span>
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="w-8 h-8 rounded-xl bg-[#27272A] hover:bg-[#3F3F46] border border-[#3F3F46] text-[#A0A0A3] hover:text-white transition-all flex items-center justify-center font-bold text-sm"
              title="Close guide"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Structured Questions View */}
      {parsedQuestions && parsedQuestions.length > 0 ? (
        <div className="space-y-4">
          {parsedQuestions.map((q, idx) => (
            <div
              key={idx}
              className="p-5 bg-[#141415] border border-[#2A2A2D] hover:border-emerald-500/40 rounded-2xl transition-all duration-300 space-y-3"
            >
              {/* Question Header */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {q.qNum}
                </span>
                <span className="font-mono text-[10px] text-[#71717A] uppercase tracking-wider">
                  Technical Drill
                </span>
              </div>

              {/* Question Statement */}
              <h5 className="font-sans font-bold text-base sm:text-lg text-white leading-snug">
                "{q.qText}"
              </h5>

              {/* Tip / Strategic Response Guide */}
              {q.tip && (
                <div className="p-4 bg-[#1E1E21] border border-emerald-500/20 rounded-xl space-y-1.5">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                    <span>💡</span> Pro-Tip & Strategic Approach
                  </div>
                  <p
                    className="text-xs sm:text-sm text-[#D4D4D8] leading-relaxed font-sans"
                    dangerouslySetInnerHTML={{ __html: formatInline(q.tip) }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Fallback Formatted View with Clean Inline Styling (No raw **) */
        <div className="p-5 bg-[#141415] border border-[#2A2A2D] rounded-2xl space-y-3">
          {guideText.split('\n').map((line, i) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={i} className="h-1" />;
            if (trimmed === '---') {
              return <hr key={i} className="border-[#2A2A2D] my-3" />;
            }

            return (
              <p
                key={i}
                className="text-sm text-[#D4D4D8] leading-relaxed font-sans"
                dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }}
              />
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
