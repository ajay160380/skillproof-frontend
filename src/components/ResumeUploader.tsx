import React, { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { uploadResume } from '../services/resumeService';
import { Loader } from './Loader';

interface Props {
  onUploadSuccess: () => void;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  className?: string;
}

export function ResumeUploader({ 
  onUploadSuccess, 
  title = "Upload your resume",
  subtitle = "PDF OR DOCX • MAX 5MB",
  buttonText = "BROWSE FILES",
  className = ""
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    const validExtensions = ['.pdf', '.docx'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!hasValidExt) {
      toast.error('Only PDF and DOCX files are allowed.');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size must be under 5MB.');
      return;
    }

    try {
      setIsUploading(true);
      await uploadResume(file);
      toast.success('Resume uploaded & analyzed successfully!');
      onUploadSuccess();
    } catch (err: any) {
      console.error(err);
      const errorMsg = err?.response?.data?.detail || err?.response?.data?.message || 'Failed to upload resume. Please try again.';
      toast.error(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 overflow-hidden ${
        isDragging
          ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_40px_rgba(16,185,129,0.25)] scale-[1.01]'
          : 'border-white/15 bg-white/5 backdrop-blur-xl hover:bg-white/[0.08] hover:border-emerald-500/40 hover:shadow-[0_8px_32px_-8px_rgba(16,185,129,0.15)]'
      } ${className}`}
    >
      <input
        type="file"
        id="resume-upload"
        className="hidden"
        accept=".pdf,.docx"
        onChange={handleChange}
        disabled={isUploading}
      />
      
      <div className="flex flex-col items-center gap-4">
        {isUploading ? (
          <div className="py-4 flex flex-col items-center gap-3">
            <Loader text="Uploading & AI Parsing..." size="sm" />
            <p className="font-mono text-[10px] text-white/50 tracking-wider animate-pulse">
              Extracting skills & mapping assessments...
            </p>
          </div>
        ) : (
          <>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 bg-gradient-to-tr from-emerald-500/20 to-brand-primary/20 border border-white/20 shadow-lg group-hover:scale-105`}>
              <span className="text-3xl drop-shadow-md">📄</span>
            </div>
            
            <div>
              <h3 className="font-serif text-xl text-white font-bold mb-1">
                {title}
              </h3>
              <p className="font-mono text-[10px] text-emerald-400/80 font-bold uppercase tracking-widest mb-4">
                {subtitle}
              </p>
              
              <label 
                htmlFor="resume-upload" 
                className="cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-ink font-mono text-xs font-bold uppercase tracking-widest px-7 py-3 rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.3)] transition-all duration-300 inline-flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>↑</span> {buttonText}
              </label>
              
              <div className="mt-4 font-mono text-[9px] text-white/40 uppercase tracking-[0.25em]">
                DRAG & DROP RESUME HERE
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

