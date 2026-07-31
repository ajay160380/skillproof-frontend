import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { CodingTest } from '../components/tests/CodingTest';
import { CommunicationTest } from '../components/tests/CommunicationTest';
import { Loader } from '../components/Loader';
import toast from 'react-hot-toast';

export function TestScreen() {
  const { id } = useParams<{ id: string }>();
  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchAttempt() {
      try {
        // Fetch full attempt detail (includes test info with test_type)
        const res = await api.get(`/assessments/${id}/`);
        
        // If already completed or processing, jump to score reveal
        if (res.data.status === 'completed' || res.data.status === 'processing' || res.data.status === 'failed') {
          navigate(`/score/${id}`);
          return;
        }
        
        setAttempt(res.data);
      } catch (err: any) {
        console.error('Failed to load test:', err);
        toast.error('Failed to load test session');
      } finally {
        setLoading(false);
      }
    }
    fetchAttempt();
  }, [id, navigate]);

  const handleSubmit = async (payload: any) => {
    setSubmitting(true);
    let retries = 3;
    let success = false;
    
    while (retries > 0 && !success) {
      try {
        const testType = attempt?.test?.test_type;
        const config = {
          timeout: 90000, // 90 seconds timeout for Render cold start
        };
        
        if (testType === 'communication') {
          await api.post(`/assessments/${id}/submit/`, payload, {
            ...config,
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } else {
          await api.post(`/assessments/${id}/submit/`, payload, config);
        }
        
        success = true;
        // Go to score reveal (which will poll for processing)
        navigate(`/score/${id}`);
      } catch (err: any) {
        retries -= 1;
        console.error(`Submit failed. Retries left: ${retries}`, err);
        
        // If it's a client error (4xx) from the server, do not retry
        if (err.response && err.response.status >= 400 && err.response.status < 500) {
           toast.error('Failed to submit test');
           break;
        }
        
        if (retries === 0) {
          toast.error('Failed to submit test. Network error or server unreachable.');
        } else {
          // Wait 3 seconds before retrying
          await new Promise(res => setTimeout(res, 3000));
        }
      }
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center">
        <Loader text="Initializing Secure Environment..." size="lg" />
      </div>
    );
  }

  if (!attempt || !attempt.test) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="border border-seal/30 rounded-lg p-8 max-w-md text-center">
          <div className="font-serif text-2xl mb-3">Session Not Found</div>
          <p className="font-mono text-xs text-data mb-6">This test session does not exist or you do not have access to it.</p>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-ink text-vellum font-mono text-xs uppercase tracking-widest hover:bg-verification transition-colors rounded-md">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const testType = attempt.test.test_type;

  return (
    <div className="flex-1 flex flex-col bg-ink text-vellum">
      <header className="px-6 py-4 border-b border-structure/20 flex justify-between items-center">
        <div className="font-mono text-xs uppercase tracking-widest text-data">
          Active Session: <span className="text-vellum">{attempt.test.title}</span>
        </div>
        <div className="font-mono text-[10px] uppercase text-verification flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-verification animate-pulse"></div>
          Recording Active
        </div>
      </header>

      <div className="flex-1 flex flex-col relative">
        {submitting && (
          <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <Loader text="Connecting to server, this may take a moment on first request..." size="lg" />
          </div>
        )}
        {testType === 'coding' ? (
          <CodingTest testId={id!} testData={attempt.test} onSubmit={handleSubmit} />
        ) : (
          <CommunicationTest testId={id!} testData={attempt.test} onSubmit={handleSubmit} />
        )}
      </div>
    </div>
  );
}
