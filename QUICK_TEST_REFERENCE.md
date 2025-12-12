# Quick Test Reference

## Commands

```bash
pnpm test           # Run all tests
pnpm test:watch     # Watch mode
pnpm check          # TypeScript check
```

## File Structure

```
/home/ubuntu/zippt-ai/
├── vitest.config.ts          # Vitest configuration
├── src/
│   ├── setupTests.ts         # Global test setup
│   └── **/*.{test,spec}.ts   # Test files
```

## Writing a Test

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import MyComponent from './MyComponent.svelte';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(MyComponent, { prop: 'value' });
    expect(screen.getByTestId('my-element')).toBeInTheDocument();
  });
});
```

## Common Matchers

```typescript
expect(element).toBeInTheDocument()
expect(element).toHaveTextContent('text')
expect(element).toHaveClass('class-name')
expect(element).toBeDisabled()
expect(value).toBe('expected')
```

## Mocking

Add to `src/setupTests.ts`:
```typescript
import { vi } from 'vitest';

vi.mock('library-name', () => ({
  functionName: vi.fn()
}));
```

## Svelte 5 Notes

- Pass props directly: `render(Component, { prop: value })`
- Use `data-testid` for queries
- Children/snippets need special handling
- All components compile for browser/DOM

## Current Status

- **Tests Passing**: 8/8 ✓
- **Test Files**: 2
- **Coverage**: utils.ts, Sample.svelte
- **Svelte Version**: 5.45.2
- **Vitest Version**: 4.0.15

## Documentation

Full guide: `/home/ubuntu/zippt-ai/TESTING.md`
Setup details: `/home/ubuntu/zippt-ai/VITEST_SETUP_COMPLETE.md`
