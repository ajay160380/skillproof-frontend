export function IntegrityNotice() {
  return (
    <div className="mb-6 p-4 bg-[#1E1E21] border border-amber-500/30 rounded-2xl shadow-lg flex items-start gap-3.5">
      <div className="mt-1 flex items-center justify-center shrink-0">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
      </div>
      <div>
        <h3 className="font-mono text-xs uppercase tracking-wider text-amber-400 font-bold mb-1 flex items-center gap-2">
          <span>🛡️</span> Authenticity Monitoring Active
        </h3>
        <p className="font-mono text-xs text-[#A0A0A3] leading-relaxed">
          This assessment is actively monitored by SkillProof AI. Tab switching, copy-pasting full code, and suspicious activities are logged and factored into your verified rating.
        </p>
      </div>
    </div>
  );
}

