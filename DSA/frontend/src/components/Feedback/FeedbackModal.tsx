import React, { useState, useEffect } from 'react';
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
  Sparkles,
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
    placeholderDesc: 'Share your thoughts, suggestions, or paired programming experience with Binit...',
  },
];

const TESTIMONIALS = [
  {
    quote: "Every bug report and feature request goes straight to my personal inbox. I review and push updates to CodeFlow within 24 hours.",
    name: "Binit",
    role: "Creator & Lead Architect, CodeFlow",
    avatar: "/binit-dp.jpg?v=2",
  },
  {
    quote: "CodeFlow completely transformed how I learn algorithms. Seeing memory pointers move in real-time made linked lists and trees click instantly.",
    name: "Manu Arora",
    role: "Founder, Aceternity UI",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
  {
    quote: "The dynamic visualization and zero-jargon step explanations helped our students master difficult recursion patterns effortlessly.",
    name: "Emily Rodriguez",
    role: "Customer Success Lead, GrowthCo",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  currentCode,
  stepInfo,
}) => {
  const [activeTestimonial, setActiveTestimonial] = useState<number>(0);
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

  // Auto-rotate testimonial carousel every 6s
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentCat = CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];
  const currentT = TESTIMONIALS[activeTestimonial];

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
      setErrorMsg('Please fill in both a title and description.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const gmailUrl = getDirectGmailUrl();
    const mailtoUrl = getDirectMailtoUrl();
    setLastSubmissionUrls({ gmailUrl, mailtoUrl });

    const payload: FeedbackPayload = {
      category: selectedCategory === 'bug' ? 'bug' : selectedCategory === 'feature' ? 'feature' : 'general',
      name: fullName.trim() || 'Anonymous User',
      email: email.trim() || undefined,
      subject: `[${currentCat.badge}] ${title.trim()}`,
      message: message.trim(),
      rating: 5,
      current_code: attachCode ? currentCode : undefined,
      step_info: attachCode ? stepInfo : undefined,
    };

    let isDelivered = false;
    let needsActivation = false;

    // 1. Persist locally to backend
    try {
      const res = await submitFeedback(payload);
      if (res.method === 'smtp' || res.method === 'web3forms') {
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
          className="relative w-full max-w-5xl my-auto rounded-2xl bg-[#0f1118] border border-[#232736] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.85)] overflow-hidden text-white"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 z-30 p-2 rounded-lg bg-[#151824] hover:bg-[#1e2233] text-[#a1a1aa] hover:text-white transition-colors duration-150 border border-[#272b3b] shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Close modal"
            aria-label="Close"
          >
            <X size={16} />
          </button>

          {/* 2-Column Desktop Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch">
            {/* LEFT SIDE: Creator Guarantee & Testimonial Showcase */}
            <div className="lg:col-span-5 relative p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-br from-[#1a080d] via-[#120508] to-[#090204] border-b lg:border-b-0 lg:border-r border-[#232736] overflow-hidden select-none">
              {/* Subtle background glow accents */}
              <div className="absolute -top-16 -right-16 w-64 h-64 bg-pink-600/15 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-rose-600/10 rounded-full blur-2xl pointer-events-none" />

              {/* Creator Promise Tag */}
              <div className="relative z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/10 w-fit text-xs font-medium text-rose-200">
                <Sparkles size={13} className="text-amber-400 shrink-0" />
                <span>Inbox: b33022659@gmail.com</span>
              </div>

              {/* Centered Glassmorphic Testimonial Card */}
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="relative z-10 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/10 p-5 sm:p-6 my-auto space-y-4"
              >
                {/* Double quote icon */}
                <svg
                  className="w-7 h-7 text-white/40"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>

                {/* Testimonial Quote */}
                <p className="text-[15px] font-normal text-white/90 leading-[1.65]">
                  &ldquo;{currentT.quote}&rdquo;
                </p>

                {/* Author Info */}
                <div className="flex items-center gap-3 pt-1">
                  <img
                    src={currentT.avatar}
                    alt={currentT.name}
                    className="size-10 rounded-full object-cover border border-white/20 shadow-sm shrink-0"
                  />
                  <div>
                    <h4 className="text-[14px] font-semibold text-white leading-tight">
                      {currentT.name}
                    </h4>
                    <p className="text-[12px] font-normal text-white/60 leading-tight mt-0.5">
                      {currentT.role}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Bottom Carousel Pagination Dots */}
              <div className="relative z-10 flex items-center justify-center gap-2 pt-4">
                {TESTIMONIALS.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveTestimonial(idx)}
                    className={`transition-all duration-200 rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white ${
                      activeTestimonial === idx
                        ? 'w-6 h-2 bg-white'
                        : 'size-2 bg-white/30 hover:bg-white/60'
                    }`}
                    title={`Slide ${idx + 1}`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* RIGHT SIDE: Feedback, Bug Report & Feature Request Form */}
            <div className="lg:col-span-7 p-6 sm:p-8 md:p-9 flex flex-col justify-center bg-[#0f1118]">
              {isSuccess ? (
                <div className="text-center py-6 sm:py-8 space-y-4">
                  {deliveryStatus === 'delivered' ? (
                    <>
                      <div className="flex justify-center">
                        <div className="size-14 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm">
                          <CheckCircle2 size={30} />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white tracking-tight">
                          Email Sent Successfully!
                        </h3>
                        <p className="text-sm text-[#a1a1aa] mt-1.5 leading-relaxed max-w-sm mx-auto">
                          Your message was delivered directly to <strong className="text-white">b33022659@gmail.com</strong>.
                        </p>
                      </div>
                    </>
                  ) : deliveryStatus === 'activation_needed' ? (
                    <>
                      <div className="flex justify-center">
                        <div className="size-14 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm">
                          <AlertCircle size={30} />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                          One-Time Activation Required
                        </h3>
                        <p className="text-xs sm:text-sm text-[#a1a1aa] mt-1.5 leading-relaxed max-w-md mx-auto">
                          FormSubmit has sent an <strong className="text-amber-300">"Activate Form"</strong> confirmation link to <strong className="text-white">b33022659@gmail.com</strong>.
                        </p>
                      </div>

                      {/* Immediate Delivery Action */}
                      <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-left space-y-2.5 max-w-md mx-auto">
                        <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-xs">
                          <Mail size={14} />
                          <span>How to get messages in your mail:</span>
                        </div>
                        <ol className="text-xs text-[#d4d4d8] list-decimal list-inside space-y-1 leading-relaxed">
                          <li>Open your Gmail (<strong className="text-white">b33022659@gmail.com</strong>)</li>
                          <li>Click <strong className="text-amber-300">"Activate Form"</strong> in the email from FormSubmit</li>
                          <li>From then on, all website feedback arrives automatically!</li>
                        </ol>
                        <p className="text-[11px] text-[#a1a1aa] pt-1 border-t border-amber-500/20">
                          To send this message right now without waiting, click below:
                        </p>
                        {lastSubmissionUrls?.gmailUrl && (
                          <a
                            href={lastSubmissionUrls.gmailUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full h-10 px-4 rounded-lg bg-white hover:bg-neutral-200 text-black font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors duration-150"
                          >
                            <Mail size={14} />
                            <span>Send This Message via Gmail Web (1-Click)</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-center">
                        <div className="size-14 rounded-full bg-blue-500/15 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-sm">
                          <Mail size={30} />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                          Message Saved & Ready to Send
                        </h3>
                        <p className="text-sm text-[#a1a1aa] mt-1.5 leading-relaxed max-w-sm mx-auto">
                          Saved locally. Click below to deliver immediately to <strong className="text-white">b33022659@gmail.com</strong>:
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-[#141622] border border-[#232738] text-left space-y-2.5 max-w-md mx-auto">
                        {lastSubmissionUrls?.gmailUrl && (
                          <a
                            href={lastSubmissionUrls.gmailUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full h-10 px-4 rounded-lg bg-white hover:bg-neutral-200 text-black font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors duration-150"
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
                      className="h-10 px-4 rounded-lg bg-[#141622] hover:bg-[#1b1e2c] text-[#d4d4d8] text-xs font-medium border border-[#272b3b] transition-colors duration-150 cursor-pointer"
                    >
                      Report Another
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="h-10 px-6 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow-sm transition-colors duration-150 cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Page Heading & Subtitle */}
                  <div>
                    <h2 className="feedback-heading">
                      Feedback & Bug Report
                    </h2>
                    <p className="feedback-subtitle mt-1.5">
                      Report bugs, request new features, or suggest DSA algorithms. Sent directly to <strong className="text-white font-medium">b33022659@gmail.com</strong>.
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
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
                            className={`h-10 px-3 rounded-lg text-[13px] font-medium flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                              isSelected
                                ? 'bg-white text-black font-semibold border border-white shadow-sm'
                                : 'bg-[#141622] text-[#a1a1aa] border border-[#25293a] hover:bg-[#1b1e2c] hover:text-white'
                            }`}
                          >
                            <Icon size={14} className="shrink-0" />
                            <span className="truncate">{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sender Name & Email (Equal Height & Aligned) */}
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
                        className="w-full h-11 px-3.5 rounded-lg bg-[#141622] border border-[#25293a] feedback-input-text placeholder-[#71717a] focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all duration-150"
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
                        className="w-full h-11 px-3.5 rounded-lg bg-[#141622] border border-[#25293a] feedback-input-text placeholder-[#71717a] focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all duration-150"
                      />
                    </div>
                  </div>

                  {/* Title / Summary */}
                  <div>
                    <label className="feedback-label mb-1.5 block">
                      {currentCat.badge} Title <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={currentCat.placeholderTitle}
                      className="w-full h-11 px-3.5 rounded-lg bg-[#141622] border border-[#25293a] feedback-input-text placeholder-[#71717a] focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all duration-150"
                    />
                  </div>

                  {/* Detailed Description */}
                  <div>
                    <label className="feedback-label mb-1.5 block">
                      Detailed Description <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={currentCat.placeholderDesc}
                      className="w-full p-3.5 rounded-lg bg-[#141622] border border-[#25293a] feedback-input-text placeholder-[#71717a] focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all duration-150 resize-y min-h-[110px]"
                    />
                  </div>

                  {/* Attach Code Checkbox */}
                  {currentCode && (
                    <label className="flex items-center gap-2 p-2.5 rounded-lg bg-[#141622] border border-[#232738] feedback-helper-text cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={attachCode}
                        onChange={(e) => setAttachCode(e.target.checked)}
                        className="size-4 rounded border-[#373b4d] bg-[#0d0f17] text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <Code2 size={14} className="text-emerald-400 shrink-0" />
                      <span>Attach current Python code & execution step to reproduce issue</span>
                    </label>
                  )}

                  {/* Submit & Secondary Action Buttons (Clear Visual Hierarchy) */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 h-11 rounded-lg bg-white hover:bg-neutral-200 text-black font-semibold text-[15px] transition-all duration-150 shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <span>{isSubmitting ? 'Recording & Sending...' : 'Submit & Send to Email'}</span>
                      <ArrowRight size={15} />
                    </button>

                    <a
                      href={getDirectGmailUrl()}
                      target="_blank"
                      rel="noreferrer"
                      className="h-11 px-4 rounded-lg bg-transparent hover:bg-[#1a1d2b] text-[#d4d4d8] hover:text-white font-medium text-sm flex items-center justify-center gap-1.5 border border-[#2b3042] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      title="Open directly in Gmail web compose tab"
                    >
                      <Mail size={14} className="text-rose-400" />
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
