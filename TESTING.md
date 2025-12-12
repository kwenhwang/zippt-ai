# Testing Guide

## Overview

This project uses Vitest for unit and component testing with Svelte 5 support.

## Setup

All testing dependencies are installed:
- `vitest` - Test runner
- `@testing-library/svelte` - Svelte component testing utilities
- `@testing-library/jest-dom` - DOM matchers
- `jsdom` - DOM environment for tests

## Configuration Files

### vitest.config.ts
Main Vitest configuration with:
- Svelte 5 plugin integration
- jsdom environment
- Path aliases ($lib, $app/*)
- Test file patterns

### src/setupTests.ts
Global test setup:
- Jest-DOM matchers
- Mock configurations (e.g., mode-watcher)

## Running Tests

```bash
# Run all tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI (requires @vitest/ui)
pnpm test:ui
```

## Writing Tests

### Testing Utilities

Example: `/home/ubuntu/zippt-ai/src/lib/utils.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    const result = cn('foo', 'bar');
    expect(result).toBe('foo bar');
  });
});
```

### Testing Svelte 5 Components

Example: `/home/ubuntu/zippt-ai/src/lib/components/Sample.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Sample from './Sample.svelte';

describe('Sample Component', () => {
  it('should render with props', () => {
    render(Sample, { message: 'Hello' });
    const element = screen.getByTestId('sample-component');
    expect(element).toHaveTextContent('Hello');
  });
});
```

## Svelte 5 Testing Notes

### Props
Pass props directly to the render function:
```typescript
render(Component, { propName: 'value' });
```

### Snippets (children)
Testing components with snippets/children is complex in Svelte 5.
For components using `{@render children?.()}`, prefer:
1. Testing without children
2. Testing the component's visual output
3. Using data-testid attributes for queries

### Known Limitations
- Components with complex snippet usage may require wrapper components for testing
- The `children` prop doesn't accept plain strings when using `{@render children?.()}`
- Consider using integration/E2E tests for complex component interactions

## Mocking

### External Libraries
Mock external libraries in `src/setupTests.ts`:

```typescript
import { vi } from 'vitest';

vi.mock('mode-watcher', () => ({
  ModeWatcher: vi.fn(),
  toggleMode: vi.fn(),
  setMode: vi.fn()
}));
```

### SvelteKit Modules
$app/* modules are aliased in vitest.config.ts to point to SvelteKit runtime files.

## Best Practices

1. **Use data-testid** for reliable element queries
2. **Test behavior, not implementation** - Focus on what users see
3. **Keep tests simple** - Each test should verify one thing
4. **Mock external dependencies** - Tests should be isolated
5. **Use descriptive test names** - Should explain what is being tested

## Troubleshooting

### "lifecycle_function_unavailable" Error
This means Svelte is running in server mode. Ensure:
- `vitest.config.ts` has `conditions: ['browser']` in resolve
- Test environment is set to 'jsdom'

### Module Not Found
Check that path aliases in `vitest.config.ts` match your project structure.

### TypeScript Errors
Run `pnpm check` to verify TypeScript configuration is correct.

## Examples

See these files for working examples:
- `/home/ubuntu/zippt-ai/src/lib/utils.test.ts` - Utility function tests
- `/home/ubuntu/zippt-ai/src/lib/components/Sample.test.ts` - Component tests

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library - Svelte](https://testing-library.com/docs/svelte-testing-library/intro/)
- [Svelte 5 Documentation](https://svelte.dev/)
