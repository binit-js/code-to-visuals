import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { CodeEditor } from './components/Editor/CodeEditor';
import { AdaptiveVisualizer } from './components/Visualizer/AdaptiveVisualizer';
import { StepExplainer } from './components/Explainer/StepExplainer';
import { TimelineControls } from './components/Timeline/TimelineControls';
import { AnswerOutput } from './components/Output/AnswerOutput';
import { AboutSection } from './components/About/AboutSection';
import { FloatingCreatorButton } from './components/About/FloatingCreatorButton';
import { DemoModal, DEMO_SEEN_STORAGE_KEY } from './components/Demo/DemoModal';
import { FeedbackModal } from './components/Feedback/FeedbackModal';
import { Click } from '@animate-ui/react/primitives/effects/click';
import { CODE_SNIPPETS, type CodeSnippet } from './examples/codeSnippets';
import { executeCode, previewCode } from './services/api';
import type { ExecutionResult, StaticAnalysisResult, TraceStep } from './types/trace';

export const App: React.FC = () => {
  const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet>(CODE_SNIPPETS[0]);
  const [code, setCode] = useState<string>(CODE_SNIPPETS[0].code);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isOutputOpen, setIsOutputOpen] = useState<boolean>(false);
  const [showAbout, setShowAbout] = useState<boolean>(false);
  const [showDemo, setShowDemo] = useState<boolean>(false);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [isVisualizerMaximized, setIsVisualizerMaximized] = useState<boolean>(false);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  const [staticAnalysis, setStaticAnalysis] = useState<StaticAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const playTimerRef = useRef<any>(null);

  // One-time automatic demo walkthrough popup for first-time visitors
  useEffect(() => {
    try {
      const hasSeen = localStorage.getItem(DEMO_SEEN_STORAGE_KEY);
      if (!hasSeen) {
        const timer = setTimeout(() => {
          setShowDemo(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }
  }, []);

  // Debounced static analysis preview while typing
  useEffect(() => {
    setIsAnalyzing(true);
    const timer = setTimeout(async () => {
      try {
        const analysis = await previewCode(code);
        setStaticAnalysis(analysis);
      } catch (err) {
        console.warn('Preview analysis warning:', err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [code]);

  // Execute Code Handler
  const handleRunCode = useCallback(async () => {
    setIsRunning(true);
    setIsPlaying(false);
    try {
      const res = await executeCode(code, 1000, 5.0);
      setExecutionResult(res);
      setCurrentStepIndex(0);
      setIsOutputOpen(true); // Open output when execution succeeds
      // Auto-start playback on successful execution
      if (res.steps.length > 0) {
        setIsPlaying(true);
      }
    } catch (err: any) {
      setExecutionResult({
        success: false,
        total_steps: 0,
        steps: [],
        stdout: '',
        error: err.message || 'Execution failed',
        truncated: false,
        execution_time_ms: 0,
      });
      setIsOutputOpen(true);
    } finally {
      setIsRunning(false);
    }
  }, [code]);

  // Reset Handler
  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setExecutionResult(null);
    setCurrentStepIndex(0);
    setIsOutputOpen(false);
  }, []);

  // Replay Handler
  const handleReplay = useCallback(() => {
    setCurrentStepIndex(0);
    setIsPlaying(true);
  }, []);

  // Preset Selection
  const handleSelectSnippet = (snippet: CodeSnippet) => {
    setSelectedSnippet(snippet);
    setCode(snippet.code);
    setExecutionResult(null);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setIsOutputOpen(false);
  };

  // Playback timer loop
  useEffect(() => {
    if (isPlaying && executionResult && executionResult.steps.length > 0) {
      const intervalMs = Math.max(80, 800 / playbackSpeed);

      playTimerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= executionResult.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
      }
    }

    return () => {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, executionResult]);

  // Step Navigation
  const handleStepForward = useCallback(() => {
    setIsPlaying(false);
    if (!executionResult) return;
    setCurrentStepIndex((prev) => Math.min(executionResult.steps.length - 1, prev + 1));
  }, [executionResult]);

  const handleStepBackward = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleJumpToStart = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  }, []);

  const handleJumpToEnd = useCallback(() => {
    setIsPlaying(false);
    if (!executionResult) return;
    setCurrentStepIndex(executionResult.steps.length - 1);
  }, [executionResult]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter or Cmd+Enter to Run
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunCode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRunCode]);

  const currentStep: TraceStep | null =
    executionResult && executionResult.steps.length > 0
      ? executionResult.steps[currentStepIndex] || null
      : null;

  const previousStep: TraceStep | null =
    executionResult && currentStepIndex > 0
      ? executionResult.steps[currentStepIndex - 1] || null
      : null;

  return (
    <Click variant="crosshair" color="#10b981" size={80} duration={400}>
      <div className="app-shell">
      {/* Top Header */}
      <Header
        onRun={handleRunCode}
        onReset={handleReset}
        onReplay={handleReplay}
        onOpenDemo={() => setShowDemo(true)}
        onOpenFeedback={() => setShowFeedback(true)}
        onOpenAbout={() => setShowAbout(true)}
        isRunning={isRunning}
        hasTrace={Boolean(executionResult && executionResult.steps.length > 0)}
        selectedSnippetId={selectedSnippet.id}
        onSelectSnippet={handleSelectSnippet}
      />

      {/* Main Workspace (3-column layout) */}
      <div className={`workspace-grid ${isVisualizerMaximized ? 'visualizer-maximized' : ''}`}>
        {/* Left Panel: Code Editor + Output Button + Answer Display */}
        <section className="panel panel-editor">
          <CodeEditor
            code={code}
            onChange={(val) => {
              setCode(val);
              // Clear previous execution trace if user modifies code
              if (executionResult) {
                setExecutionResult(null);
                setCurrentStepIndex(0);
                setIsPlaying(false);
              }
            }}
            activeLine={currentStep?.line}
            errorLine={executionResult?.error && !currentStep ? 1 : null}
            onRunCode={handleRunCode}
            onToggleOutput={() => setIsOutputOpen((prev) => !prev)}
            isOutputOpen={isOutputOpen}
            hasOutput={Boolean(executionResult && (executionResult.stdout || executionResult.error))}
            isRunning={isRunning}
            outputContent={
              <AnswerOutput
                executionResult={executionResult}
                isRunning={isRunning}
                onRunCode={handleRunCode}
                onClose={() => setIsOutputOpen(false)}
              />
            }
          />
        </section>

        {/* Center Panel: Adaptive Visualizer + Timeline Controls */}
        <section className="panel panel-visualizer">
          <div className="visualizer-content-flex">
            <AdaptiveVisualizer
              currentStep={currentStep}
              staticAnalysis={staticAnalysis}
              isAnalyzing={isAnalyzing}
              onRunCode={handleRunCode}
              onOpenDemo={() => setShowDemo(true)}
              isMaximized={isVisualizerMaximized}
              onToggleMaximize={() => setIsVisualizerMaximized((prev) => !prev)}
            />
            <TimelineControls
              currentStepIndex={currentStepIndex}
              totalSteps={executionResult?.steps.length || 0}
              isPlaying={isPlaying}
              playbackSpeed={playbackSpeed}
              onPlayPause={() => setIsPlaying((p) => !p)}
              onStepForward={handleStepForward}
              onStepBackward={handleStepBackward}
              onJumpToStart={handleJumpToStart}
              onJumpToEnd={handleJumpToEnd}
              onSeek={(step) => {
                setIsPlaying(false);
                setCurrentStepIndex(step);
              }}
              onChangeSpeed={setPlaybackSpeed}
            />
          </div>
        </section>

        {/* Right Panel: Step-by-Step Explainer & Runtime Inspector */}
        <section className="panel panel-inspector">
          <StepExplainer
            currentStep={currentStep}
            previousStep={previousStep}
            totalSteps={executionResult?.steps.length || 0}
            code={code}
          />
        </section>
      </div>

      {/* Attractive Floating Circular Creator Button (Accessible by all) */}
      <FloatingCreatorButton onClick={() => setShowAbout(true)} />

      {/* About Creator Section Modal */}
      <AboutSection
        isOpen={showAbout}
        onClose={() => setShowAbout(false)}
        onOpenFeedback={() => setShowFeedback(true)}
      />

      {/* Interactive Demo Video Walkthrough Modal (1-time on first visit or via Demo button) */}
      <DemoModal
        isOpen={showDemo}
        onClose={() => setShowDemo(false)}
        onSelectPreset={(presetId) => {
          const s = CODE_SNIPPETS.find((item) => item.id === presetId);
          if (s) handleSelectSnippet(s);
        }}
      />

      {/* Feedback & Complaint Direct Email Modal */}
      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        currentCode={code}
        stepInfo={currentStep ? `Step ${currentStep.step_index + 1}: Line ${currentStep.line} (${currentStep.event_type})` : undefined}
      />
      </div>
    </Click>
  );
};

export default App;
