# Active Issues

## Current State
- Total issues: 0
- Active issues: 0
- Resolved issues: 0

## Issue Categories
- Build: Webpack, Express, TypeScript, lint issues
- Runtime: Console, uncaught exceptions, network issues
- Tests: Unit, integration, E2E, component test failures
- Performance: FPS, memory, load issues
- Structure: File organization, centralization issues
- Quality: Code duplication, DRY violations
- Patterns: LLM-specific issues

## Active Issues

No active issues.

## Issue Format
```typescript
interface IssueState {
  error: string;        // Error message or description
  file: string;         // File where the issue occurred
  created: Date;        // When the issue was created
  completed?: Date;     // When the issue was resolved
  category: string;     // Issue category from above
  context: string;      // LLM-readable context
  priority: number;     // 1 (highest) to 5 (lowest)
  impact: string;       // Impact assessment
  resolution?: string;  // Resolution steps if completed
}
```

## Resolution Steps
1. Issue is detected and logged with context
2. LLM analyzes and categorizes the issue
3. Impact is assessed and priority assigned
4. Resolution steps are suggested
5. Issue is tracked until resolved
6. Resolution is verified and documented

## LLM Context Guidelines
- Provide clear error messages
- Include relevant code snippets
- Describe the expected behavior
- List steps to reproduce
- Note any related issues
- Document attempted solutions
- Tag with relevant categories 
