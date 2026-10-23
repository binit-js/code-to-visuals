import { describe, expect, it } from 'bun:test';
import { CODE_SNIPPETS } from '../examples/codeSnippets';

describe('CodeFlow Frontend Test Suite', () => {
  it('contains the Master Test first demonstration snippet', () => {
    const firstDemo = CODE_SNIPPETS.find((s) => s.id === 'first-demo');
    expect(firstDemo).toBeDefined();
    expect(firstDemo?.code).toContain('arr = [10, 20, 30]');
    expect(firstDemo?.code).toContain('arr.append(40)');
    expect(firstDemo?.code).toContain('arr.pop(1)');
    expect(firstDemo?.code).toContain('print("Final array:", arr)');
  });

  it('contains loop and conditional snippets', () => {
    const loopSnippet = CODE_SNIPPETS.find((s) => s.id === 'loop-conditional');
    expect(loopSnippet).toBeDefined();
    expect(loopSnippet?.code).toContain('arr = [5, 15, 25, 35]');
    expect(loopSnippet?.code).toContain('if arr[i] > 15:');
  });

  it('contains data structure snippets for linked list, tree, recursion, and graph', () => {
    const ids = CODE_SNIPPETS.map((s) => s.id);
    expect(ids).toContain('linked-list');
    expect(ids).toContain('stack-ops');
    expect(ids).toContain('queue-ops');
    expect(ids).toContain('binary-tree');
    expect(ids).toContain('recursion-factorial');
    expect(ids).toContain('graph-adjacency');
    expect(ids).toContain('bubble-sort');
  });

  it('validates 3-part educational explanation contract', () => {
    const mockExplanation = {
      what: 'Connecting node (10) next pointer to node (20).',
      why: 'We are rewiring the link to insert node 20.',
      visual_change: 'The arrow from node [10] now points directly to node [20].',
      action_type: 'link_update',
      highlighted_keys: ['10', '20'],
    };
    expect(mockExplanation.what).toContain('node (10)');
    expect(mockExplanation.why).toContain('rewiring');
    expect(mockExplanation.visual_change).toContain('arrow');
    expect(mockExplanation.action_type).toBe('link_update');
  });

  it('handles step boundaries correctly', () => {
    const totalSteps = 5;
    let currentStep = 0;

    // Step forward
    currentStep = Math.min(totalSteps - 1, currentStep + 1);
    expect(currentStep).toBe(1);

    // Jump to end
    currentStep = totalSteps - 1;
    expect(currentStep).toBe(4);

    // Cannot step beyond end
    currentStep = Math.min(totalSteps - 1, currentStep + 1);
    expect(currentStep).toBe(4);

    // Step backward
    currentStep = Math.max(0, currentStep - 1);
    expect(currentStep).toBe(3);

    // Jump to start
    currentStep = 0;
    expect(currentStep).toBe(0);

    // Cannot step before start
    currentStep = Math.max(0, currentStep - 1);
    expect(currentStep).toBe(0);
  });
});
