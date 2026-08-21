import React, { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { uploadResume } from '../services/resumeService';
import { Loader } from './Loader';

interface Props {
  onUploadSuccess: () => void;
}

export function ResumeUploader({ onUploadSuccess }: Props) {
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
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!validTypes.includes(file.type)) {
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
      toast.success('Resume uploaded successfully!');
      onUploadSuccess();
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload resume.');
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
      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
        isDragging
          ? 'border-brand-primary bg-brand-primary/10 shadow-[0_0_30px_rgba(59,130,246,0.15)] scale-[1.02]'
          : 'border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 hover:border-brand-primary/40 hover:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.5)]'
      }`}
    >
      <input
        type="file"
        id="resume-upload"
        className="hidden"
        accept=".pdf,.docx"
        onChange={handleChange}
        disabled={isUploading}
      />
      
      <div className="flex flex-col items-center gap-3">
        {isUploading ? (
          <Loader text="Uploading & Analyzing..." size="sm" />
        ) : (
          <>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 bg-white/10 shadow-sm border border-white/20`}>
              <span className="text-2xl drop-shadow-sm">📄</span>
            </div>
            
            <div>
              <h3 className="font-serif text-lg text-white font-bold mb-1">
                Upload your resume
              </h3>
              <p className="font-mono text-[9px] text-white/50 uppercase tracking-widest mb-4">
                PDF OR DOCX • MAX 5MB
              </p>
              
              <label 
                htmlFor="resume-upload" 
                className="cursor-pointer bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold uppercase tracking-widest px-6 py-2.5 rounded-lg border border-white/10 transition-colors inline-block"
              >
                BROWSE FILES
              </label>
              
              <div className="mt-4 font-mono text-[9px] text-white/40 uppercase tracking-[0.2em]">
                OR DRAG AND DROP HERE
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
