import type { ExecutionResult, StaticAnalysisResult } from '../types/trace';

const API_BASE = import.meta.env.VITE_API_URL || ''; // Uses relative /api on Vercel or local proxy, or external VITE_API_URL if configured

export async function executeCode(
  code: string,
  maxSteps: number = 1000,
  timeoutSeconds: number = 5.0
): Promise<ExecutionResult> {
  const res = await fetch(`${API_BASE}/api/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      language: 'python',
      max_steps: maxSteps,
      timeout_seconds: timeoutSeconds,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Server returned ${res.status}: ${errorText}`);
  }

  return res.json();
}

export async function previewCode(code: string): Promise<StaticAnalysisResult> {
  const res = await fetch(`${API_BASE}/api/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (!res.ok) {
    throw new Error(`Preview failed with status ${res.status}`);
  }

  return res.json();
}

export interface FeedbackPayload {
  category: 'bug' | 'complaint' | 'feature' | 'general' | 'appreciation';
  name?: string;
  email?: string;
  subject: string;
  message: string;
  rating?: number;
  current_code?: string;
  step_info?: string;
}

export interface FeedbackResult {
  success: boolean;
  message: string;
  method: string;
  feedback_id?: string;
  mailto_url?: string;
}

export async function submitFeedback(payload: FeedbackPayload): Promise<FeedbackResult> {
  const res = await fetch(`${API_BASE}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to submit feedback: ${errorText}`);
  }

  return res.json();
}

