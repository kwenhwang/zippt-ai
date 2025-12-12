# Utility/Hook Migration Summary

**Date**: 2025-12-09
**Source**: `/home/ubuntu/ai-chatbot-template/src/lib/`
**Destination**: `/home/ubuntu/zippt-ai/src/lib/`

## Migrated Files

### Hooks (`/src/lib/hooks/`)

1. **local-storage.svelte.ts**
   - `LocalStorage<T>` class for reactive localStorage
   - Supports: get/set value, delete, cross-tab sync
   - Usage: `const theme = new LocalStorage('theme', 'dark')`

2. **lock.ts**
   - `Lock` class and `getLock()` helper
   - Prevents concurrent operations
   - Svelte context-based locking mechanism
   - Usage: `const lock = getLock('submit'); if (!lock.locked) { ... }`

3. **is-mobile.svelte.ts**
   - `IsMobile` class extends Svelte's MediaQuery
   - Detects mobile screens (< 768px)
   - Usage: `const isMobile = new IsMobile(); if (isMobile.matches) { ... }`

### Utils (`/src/lib/utils/`)

1. **constants.ts**
   - `BREAKPOINTS` - Tailwind-compatible breakpoints
   - sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px

2. **shadcn.ts**
   - `cn()` - Class name merger (clsx + tailwind-merge)
   - TypeScript utilities: `WithoutChild`, `WithoutChildren`, `WithElementRef`
   - Usage: `cn('base-class', condition && 'conditional-class')`

3. **reactivity.svelte.ts**
   - `Box<T>` - Reactive value container
   - `SynchronizedCookie` - Cookie sync with backend (not used yet)
   - Usage: `const count = new Box(0); count.value++`

4. **types.ts**
   - `WithElementRef<T, U>` - Add ref prop to component types
   - `WithElementRefAndChild<T, U>` - Add ref + child snippet props

## Exports (`/src/lib/index.ts`)

All migrated utilities are exported from `$lib`:

```typescript
// Hooks
export { LocalStorage } from './hooks/local-storage.svelte';
export { Lock, getLock } from './hooks/lock';
export { IsMobile } from './hooks/is-mobile.svelte';

// Utils
export { cn } from './utils/shadcn';
export { Box, SynchronizedCookie } from './utils/reactivity.svelte';
export { BREAKPOINTS } from './utils/constants';
export type { WithElementRef, WithElementRefAndChild } from './utils/types';
```

## Dependencies

Already installed in zippt-ai:
- clsx: ^2.1.1
- tailwind-merge: ^3.4.0

## Not Migrated

### Excluded Files
- `chat-history.svelte.ts` - DB-dependent
- `selected-model.svelte.ts` - Requires backend `/api/synchronized-cookie` route
- `chat.ts` - DB and AI SDK specific utilities we don't need

## Usage Examples

### LocalStorage
```typescript
import { LocalStorage } from '$lib';

const chatHistory = new LocalStorage<string[]>('chat-history', []);
chatHistory.value.push('New message');
chatHistory.delete();
```

### Lock Pattern
```typescript
import { getLock } from '$lib';

const submitLock = getLock('chat-submit');

async function handleSubmit() {
  if (submitLock.locked) return;
  submitLock.locked = true;
  try {
    await sendMessage();
  } finally {
    submitLock.locked = false;
  }
}
```

### Mobile Detection
```typescript
import { IsMobile } from '$lib';

const isMobile = new IsMobile();

{#if isMobile.matches}
  <MobileLayout />
{:else}
  <DesktopLayout />
{/if}
```

### Class Names
```typescript
import { cn } from '$lib';

<button
  class={cn(
    'px-4 py-2 rounded',
    disabled && 'opacity-50 cursor-not-allowed',
    variant === 'primary' && 'bg-blue-500'
  )}
>
  Submit
</button>
```

## Next Steps

1. Update existing components to use `cn()` for className merging
2. Use `LocalStorage` for persistent UI state (e.g., sidebar collapsed state)
3. Use `IsMobile` for responsive layouts
4. Use `Lock` for preventing duplicate API calls
5. Consider implementing `/api/synchronized-cookie/:key` route if needed for `SynchronizedCookie`

## Testing

TypeScript check confirms no errors in migrated files. Existing errors are from other components that need separate dependencies (svelte-sonner, svelte-exmarkdown, etc.).
