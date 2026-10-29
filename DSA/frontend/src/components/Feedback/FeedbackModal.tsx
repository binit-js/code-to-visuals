import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Bug,
  Lightbulb,
  Zap,
  MessageSquare,
  Mail,
  ExternalLink,
  Code2,
  ArrowRight,
} from 'lucide-react';
import { submitFeedback, type FeedbackPayload } from '../../services/api';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCode?: string;
  stepInfo?: string;
}

type FeedbackCategory = 'bug' | 'feature' | 'algorithm' | 'general';

interface CategoryOption {
  id: FeedbackCategory;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge: string;
  placeholderTitle: string;
  placeholderDesc: string;
}

const CATEGORIES: CategoryOption[] = [
  {
    id: 'bug',
    label: 'Report a Bug',
    icon: Bug,
    badge: 'Bug Report',
    placeholderTitle: 'e.g. Linked list pointer arrow points backward on step 5',
    placeholderDesc: 'Describe the bug:\n1. What went wrong?\n2. What line or step did it occur on?\n3. What was the expected visual behavior?',
  },
  {
    id: 'feature',
    label: 'Request Feature',
    icon: Lightbulb,
    badge: 'Feature Request',
    placeholderTitle: 'e.g. Export step execution to animated GIF or video',
    placeholderDesc: 'Describe the feature you would love to see added to CodeFlow and how it will help students learn DSA...',
  },
  {
    id: 'algorithm',
    label: 'DSA Preset Request',
    icon: Zap,
    badge: 'New Algorithm',
    placeholderTitle: 'e.g. Add Red-Black Tree balancing / Dijkstra shortest path',
    placeholderDesc: 'Which data structure or algorithm would you like to see visualized? You can also paste sample Python code below...',
  },
  {
    id: 'general',
    label: 'General Feedback',
    icon: MessageSquare,
    badge: 'Feedback',
    placeholderTitle: 'e.g. Great experience, here are a few ideas to make it faster',
    placeholderDesc: 'Share your thoughts, suggestions, or feedback directly with Binit...',
  },
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  currentCode,
  stepInfo,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory>('bug');
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [attachCode, setAttachCode] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [deliveryStatus, setDeliveryStatus] = useState<'delivered' | 'activation_needed' | 'fallback'>('fallback');
  const [lastSubmissionUrls, setLastSubmissionUrls] = useState<{
    gmailUrl: string;
    mailtoUrl: string;
  } | null>(null);

  if (!isOpen) return null;

  const currentCat = CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];

  // Construct structured email body for direct Gmail / mail client compose
  const buildEmailBody = () => {
    const lines = [
      `CodeFlow ${currentCat.badge} Submission`,
      `----------------------------------------------`,
      `Category: ${currentCat.badge}`,
      `From: ${fullName.trim() || 'Anonymous User'} <${email.trim() || 'No email provided'}>`,
      `Title: ${title.trim()}`,
      ``,
      `Details & Description:`,
      message.trim(),
    ];

    if (stepInfo) {
      lines.push(``, `Runtime Step:`, stepInfo);
    }
    if (currentCode && attachCode) {
      lines.push(``, `Active DSA Python Code:`, currentCode);
    }
    lines.push(``, `----------------------------------------------`, `Delivered to: b33022659@gmail.com`);
    return lines.join('\n');
  };

  const getDirectGmailUrl = () => {
    const subject = `[CodeFlow ${currentCat.badge}] ${title.trim() || 'Bug Report / Feature Request'}`;
    const body = buildEmailBody();
    return `https://mail.google.com/mail/?view=cm&fs=1&to=b33022659@gmail.com&su=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  };

  const getDirectMailtoUrl = () => {
    const subject = `[CodeFlow ${currentCat.badge}] ${title.trim() || 'Bug Report / Feature Request'}`;
    const body = buildEmailBody();
    return `mailto:b33022659@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setErrorMsg('Please enter both a title and description.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const gmailUrl = getDirectGmailUrl();
    const mailtoUrl = getDirectMailtoUrl();
    setLastSubmissionUrls({ gmailUrl, mailtoUrl });

    let isDelivered = false;
    let needsActivation = false;

    // 1. Record via backend API if reachable
    try {
      const payload: FeedbackPayload = {
        name: fullName.trim() || 'Anonymous User',
        email: email.trim() || 'noreply@codeflow.dev',
        category: (selectedCategory === 'algorithm' ? 'feature' : selectedCategory) as 'bug' | 'feature' | 'general',
        subject: title.trim(),
        message: message.trim(),
        step_info: stepInfo,
        current_code: attachCode ? currentCode : undefined,
      };
      const apiRes = await submitFeedback(payload);
      if (apiRes.success) {
        isDelivered = true;
      }
    } catch (err: any) {
      console.warn('Backend feedback recording warning:', err);
    }

    // 2. Dispatch via FormSubmit directly from browser to b33022659@gmail.com
    if (!isDelivered) {
      try {
        const fsRes = await fetch('https://formsubmit.co/ajax/b33022659@gmail.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            name: fullName.trim() || 'Anonymous User',
            email: email.trim() || 'noreply@codeflow.dev',
            _subject: `[CodeFlow ${currentCat.badge}] ${title.trim()}`,
            category: currentCat.badge,
            title: title.trim(),
            message: message.trim(),
            runtime_step: stepInfo || 'N/A',
            python_code: attachCode && currentCode ? currentCode : 'None',
            _captcha: 'false',
          }),
        });

        if (fsRes.ok) {
          const fsData = await fsRes.json();
          if (fsData.success === 'true' || fsData.success === true) {
            isDelivered = true;
          } else if (
            fsData.message &&
            fsData.message.toLowerCase().includes('activation')
          ) {
            needsActivation = true;
          }
        }
      } catch (err: any) {
        console.warn('FormSubmit attempt failed:', err);
      }
    }

    if (isDelivered) {
      setDeliveryStatus('delivered');
    } else if (needsActivation) {
      setDeliveryStatus('activation_needed');
    } else {
      setDeliveryStatus('fallback');
    }

    setIsSuccess(true);
    setIsSubmitting(false);
  };

  const handleReset = () => {
    setIsSuccess(false);
    setTitle('');
    setMessage('');
    setErrorMsg(null);
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-4 sm:p-6 md:p-8 flex justify-center items-center font-sans"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-5xl my-auto rounded-2xl bg-[#0a0d0b] border border-[#222b26] shadow-2xl overflow-hidden text-white"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 z-30 p-2 rounded-lg bg-[#111513] hover:bg-[#171d19] text-[#95a49c] hover:text-white transition-colors border border-[#222b26] shadow-sm cursor-pointer"
            title="Close modal"
            aria-label="Close"
          >
            <X size={16} />
          </button>

          {/* 2-Column Desktop Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch">
            {/* LEFT SIDE: Creator Guarantee & Direct Inbox Details */}
            <div className="lg:col-span-5 relative p-6 sm:p-8 flex flex-col justify-between bg-[#0a0d0b] border-b lg:border-b-0 lg:border-r border-[#222b26] select-none">
              {/* Creator Promise Tag */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#111513] border border-[#222b26] w-fit text-xs font-mono text-[#0eb37c]">
                <span>Inbox: b33022659@gmail.com</span>
              </div>

              {/* Creator Statement Card */}
              <div className="rounded-xl bg-[#111513] border border-[#222b26] p-5 sm:p-6 my-auto space-y-4">
                <p className="text-[14px] font-normal text-[#c5d2cb] leading-relaxed">
                  &ldquo;Every bug report and feature request goes straight to my personal inbox. I review and push updates to CodeFlow within 24 hours.&rdquo;
                </p>

                {/* Author Info */}
                <div className="flex items-center gap-3 pt-2 border-t border-[#222b26]">
                  <img
                    src="/binit-dp.jpg?v=2"
                    alt="Binit"
                    className="size-10 rounded-full object-cover border border-[#0eb37c] shrink-0"
                  />
                  <div>
                    <h4 className="text-[14px] font-semibold text-white leading-tight font-heading">
                      Binit
                    </h4>
                    <p className="text-[12px] font-normal text-[#95a49c] leading-tight mt-0.5">
                      Creator & Lead Architect, CodeFlow
                    </p>
                  </div>
                </div>
              </div>

              {/* Response Time Info */}
              <div className="pt-4 border-t border-[#222b26] text-xs font-mono text-[#728279] flex items-center justify-between">
                <span>Personal SLA: &lt; 24h</span>
                <span>Active Release: v2.0</span>
              </div>
            </div>

            {/* RIGHT SIDE: Feedback, Bug Report & Feature Request Form */}
            <div className="lg:col-span-7 p-6 sm:p-8 md:p-9 flex flex-col justify-center bg-[#0e120f]">
              {isSuccess ? (
                <div className="text-center py-6 sm:py-8 space-y-4">
                  {deliveryStatus === 'delivered' ? (
                    <>
                      <div className="flex justify-center">
                        <div className="size-14 rounded-full bg-[#111513] border border-[#0eb37c] flex items-center justify-center text-[#0eb37c] shadow-sm">
                          <CheckCircle2 size={28} />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white tracking-tight font-heading">
                          Email Sent Successfully!
                        </h3>
                        <p className="text-sm text-[#95a49c] mt-1.5 leading-relaxed max-w-sm mx-auto">
                          Your message was delivered directly to <strong className="text-white">b33022659@gmail.com</strong>.
                        </p>
                      </div>
                    </>
                  ) : deliveryStatus === 'activation_needed' ? (
                    <>
                      <div className="flex justify-center">
                        <div className="size-14 rounded-full bg-[#111513] border border-[#e69500] flex items-center justify-center text-[#e69500] shadow-sm">
                          <AlertCircle size={28} />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-heading">
                          One-Time Activation Required
                        </h3>
                        <p className="text-xs sm:text-sm text-[#95a49c] mt-1.5 leading-relaxed max-w-md mx-auto">
                          FormSubmit has sent an <strong className="text-[#e69500]">&quot;Activate Form&quot;</strong> confirmation link to <strong className="text-white">b33022659@gmail.com</strong>.
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-[#111513] border border-[#222b26] text-left space-y-2.5 max-w-md mx-auto">
                        <div className="flex items-center gap-1.5 text-[#e69500] font-semibold text-xs">
                          <Mail size={14} />
                          <span>Delivery instructions:</span>
                        </div>
                        <ol className="text-xs text-[#c5d2cb] list-decimal list-inside space-y-1 leading-relaxed">
                          <li>Open Gmail (<strong className="text-white">b33022659@gmail.com</strong>)</li>
                          <li>Click <strong className="text-[#e69500]">&quot;Activate Form&quot;</strong> from FormSubmit</li>
                          <li>Future website submissions will arrive automatically</li>
                        </ol>
                        <p className="text-[11px] text-[#95a49c] pt-1 border-t border-[#222b26]">
                          To deliver this message right now, open in Gmail:
                        </p>
                        {lastSubmissionUrls?.gmailUrl && (
                          <a
                            href={lastSubmissionUrls.gmailUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full h-10 px-4 rounded-lg bg-[#0eb37c] hover:bg-[#12c286] text-black font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                          >
                            <Mail size={14} />
                            <span>Send via Gmail Web</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-center">
                        <div className="size-14 rounded-full bg-[#111513] border border-[#0eb37c] flex items-center justify-center text-[#0eb37c] shadow-sm">
                          <Mail size={28} />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-heading">
                          Message Ready to Send
                        </h3>
                        <p className="text-sm text-[#95a49c] mt-1.5 leading-relaxed max-w-sm mx-auto">
                          Click below to deliver directly to <strong className="text-white">b33022659@gmail.com</strong>:
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-[#111513] border border-[#222b26] text-left space-y-2.5 max-w-md mx-auto">
                        {lastSubmissionUrls?.gmailUrl && (
                          <a
                            href={lastSubmissionUrls.gmailUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full h-10 px-4 rounded-lg bg-[#0eb37c] hover:bg-[#12c286] text-black font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                          >
                            <Mail size={14} />
                            <span>Send via Gmail Web</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </>
                  )}

                  <div className="pt-2 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="h-10 px-4 rounded-lg bg-[#111513] hover:bg-[#171d19] text-[#c5d2cb] text-xs font-medium border border-[#222b26] transition-colors cursor-pointer"
                    >
                      Report Another
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="h-10 px-6 rounded-lg bg-[#0eb37c] hover:bg-[#12c286] text-black text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Page Heading & Subtitle */}
                  <div>
                    <h2 className="feedback-heading font-heading">
                      Feedback & Bug Report
                    </h2>
                    <p className="feedback-subtitle mt-1.5">
                      Report bugs, request new features, or suggest DSA algorithms. Sent directly to <strong className="text-white font-medium">b33022659@gmail.com</strong>.
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-lg bg-[#171d19] border border-[#ea3954] text-[#ea3954] text-xs flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Category Selector Tabs */}
                  <div>
                    <label className="feedback-label mb-1.5 block">
                      What are you submitting?
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = selectedCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`h-10 px-3 rounded-lg text-[13px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#0eb37c] text-black font-semibold border border-[#0eb37c]'
                                : 'bg-[#111513] text-[#95a49c] border border-[#222b26] hover:bg-[#171d19] hover:text-white'
                            }`}
                          >
                            <Icon size={14} className="shrink-0" />
                            <span className="truncate">{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sender Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="feedback-label mb-1.5 block">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full h-11 px-3.5 rounded-lg bg-[#111513] border border-[#222b26] feedback-input-text placeholder-[#728279] focus:outline-none focus:border-[#0eb37c] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="feedback-label mb-1.5 block">
                        Your Email (for reply)
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="w-full h-11 px-3.5 rounded-lg bg-[#111513] border border-[#222b26] feedback-input-text placeholder-[#728279] focus:outline-none focus:border-[#0eb37c] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Title / Summary */}
                  <div>
                    <label className="feedback-label mb-1.5 block">
                      {currentCat.badge} Title <span className="text-[#ea3954]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={currentCat.placeholderTitle}
                      className="w-full h-11 px-3.5 rounded-lg bg-[#111513] border border-[#222b26] feedback-input-text placeholder-[#728279] focus:outline-none focus:border-[#0eb37c] transition-colors"
                    />
                  </div>

                  {/* Detailed Description */}
                  <div>
                    <label className="feedback-label mb-1.5 block">
                      Detailed Description <span className="text-[#ea3954]">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={currentCat.placeholderDesc}
                      className="w-full p-3.5 rounded-lg bg-[#111513] border border-[#222b26] feedback-input-text placeholder-[#728279] focus:outline-none focus:border-[#0eb37c] transition-colors resize-y min-h-[110px]"
                    />
                  </div>

                  {/* Attach Code Checkbox */}
                  {currentCode && (
                    <label className="flex items-center gap-2 p-2.5 rounded-lg bg-[#111513] border border-[#222b26] feedback-helper-text cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={attachCode}
                        onChange={(e) => setAttachCode(e.target.checked)}
                        className="size-4 rounded border-[#222b26] bg-[#0a0d0b] text-[#0eb37c] focus:ring-0 cursor-pointer"
                      />
                      <Code2 size={14} className="text-[#0eb37c] shrink-0" />
                      <span>Attach current Python code & execution step to reproduce issue</span>
                    </label>
                  )}

                  {/* Submit & Secondary Action Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 h-11 rounded-lg bg-[#0eb37c] hover:bg-[#12c286] text-black font-semibold text-[15px] transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <span>{isSubmitting ? 'Recording & Sending...' : 'Submit & Send to Email'}</span>
                      <ArrowRight size={15} />
                    </button>

                    <a
                      href={getDirectGmailUrl()}
                      target="_blank"
                      rel="noreferrer"
                      className="h-11 px-4 rounded-lg bg-[#111513] hover:bg-[#171d19] text-[#c5d2cb] hover:text-white font-medium text-sm flex items-center justify-center gap-1.5 border border-[#222b26] transition-colors cursor-pointer"
                      title="Open directly in Gmail web compose tab"
                    >
                      <Mail size={14} className="text-[#0eb37c]" />
                      <span>Open in Gmail</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
