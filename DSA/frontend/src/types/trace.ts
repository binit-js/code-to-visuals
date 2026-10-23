export interface ObjectDescriptor {
  id: string;
  type: string;
  class_name: string;
  value_repr: string;
  elements?: any[];
  fields?: Record<string, any>;
  entries?: [any, any][];
}

export interface VariableDescriptor {
  name: string;
  type: string;
  value_repr: string;
  is_primitive: boolean;
  value?: any;
  ref_id?: string | null;
}

export interface StackFrameDescriptor {
  frame_id: string;
  function_name: string;
  line: number;
  variables: Record<string, VariableDescriptor>;
}

export interface MutationEvent {
  target_id: string;
  target_name?: string | null;
  operation: string; // "append" | "pop" | "setitem" | "setattr" | "assign"
  index_or_key?: number | string | null;
  value?: any;
  description?: string | null;
}

export interface StepExplanation {
  what: string;
  why: string;
  visual_change: string;
  action_type: string;
  highlighted_keys: string[];
}

export interface DetectedStructure {
  name: string;
  kind: 'array' | 'matrix' | 'linked_list' | 'binary_tree' | 'graph' | 'stack' | 'queue' | 'generic';
  root_id?: string | null;
  payload: Record<string, any>;
}

export interface TraceStep {
  step_index: number;
  line: number;
  event_type: 'line' | 'call' | 'return' | 'exception';
  function_name: string;
  call_depth: number;
  stack_frames: StackFrameDescriptor[];
  variables: Record<string, VariableDescriptor>;
  heap: Record<string, ObjectDescriptor>;
  mutations: MutationEvent[];
  detected_structures: DetectedStructure[];
  explanation?: StepExplanation | null;
  stdout: string;
  exception?: string | null;
  return_value?: string | null;
}

export interface ExecutionResult {
  success: boolean;
  total_steps: number;
  steps: TraceStep[];
  stdout: string;
  error?: string | null;
  truncated: boolean;
  execution_time_ms: number;
}

export interface InferredVariable {
  name: string;
  inferred_type: string;
  preview_value?: string | null;
  line: number;
}

export interface InferredStructure {
  name: string;
  kind: string;
  description: string;
  sample_data?: any;
}

export interface StaticAnalysisResult {
  valid_syntax: boolean;
  error?: string | null;
  error_line?: number | null;
  variables: InferredVariable[];
  functions: string[];
  classes: string[];
  structures: InferredStructure[];
}
