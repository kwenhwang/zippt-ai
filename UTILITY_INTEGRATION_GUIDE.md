# Utility Integration Guide

Quick reference for using migrated utilities in zippt-ai components.

## Import Pattern

```typescript
// All utilities available from $lib
import { cn, LocalStorage, IsMobile, getLock, BREAKPOINTS } from '$lib';
```

## Common Use Cases

### 1. Responsive Design with IsMobile

**Before:**
```typescript
let windowWidth = $state(0);
$effect(() => {
  windowWidth = window.innerWidth;
});
const isMobile = windowWidth < 768;
```

**After:**
```typescript
import { IsMobile } from '$lib';
const isMobile = new IsMobile();

{#if isMobile.matches}
  <MobileView />
{:else}
  <DesktopView />
{/if}
```

### 2. Class Name Merging with cn()

**Before:**
```typescript
<div class="base-class {isActive ? 'active-class' : ''} {error ? 'error-class' : ''}">
```

**After:**
```typescript
import { cn } from '$lib';

<div class={cn(
  'base-class',
  isActive && 'active-class',
  error && 'error-class'
)}>
```

### 3. Persistent State with LocalStorage

**Before:**
```typescript
let sidebar = $state(true);

function toggleSidebar() {
  sidebar = !sidebar;
  localStorage.setItem('sidebar', JSON.stringify(sidebar));
}

onMount(() => {
  const stored = localStorage.getItem('sidebar');
  if (stored) sidebar = JSON.parse(stored);
});
```

**After:**
```typescript
import { LocalStorage } from '$lib';

const sidebar = new LocalStorage('sidebar', true);

function toggleSidebar() {
  sidebar.value = !sidebar.value; // Auto-saves
}
```

### 4. Preventing Duplicate Submissions with Lock

**Before:**
```typescript
let isSubmitting = $state(false);

async function handleSubmit() {
  if (isSubmitting) return;
  isSubmitting = true;
  try {
    await sendMessage();
  } finally {
    isSubmitting = false;
  }
}
```

**After:**
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

## Integration with Existing Components

### Update multimodal-input.svelte

Replace hardcoded classes with `cn()`:

```typescript
import { cn } from '$lib';

<textarea
  class={cn(
    'max-h-[calc(75dvh)] resize-none rounded-md bg-muted p-4 pb-12',
    'w-full border-input pr-16 outline-none placeholder:text-muted-foreground',
    'text-base leading-relaxed tracking-wide',
    className
  )}
/>
```

### Update message components

Use `cn()` for conditional styling:

```typescript
import { cn } from '$lib';

<div class={cn(
  'flex gap-4 group/message',
  message.role === 'user' && 'justify-end',
  message.role === 'assistant' && 'justify-start'
)}>
```

### Mobile-specific layouts

```typescript
import { IsMobile } from '$lib';

const isMobile = new IsMobile();

<div class={cn(
  'chat-container',
  isMobile.matches ? 'px-4' : 'px-8'
)}>
```

## TypeScript Utilities

### Component Props with Element Refs

```typescript
import type { WithElementRef } from '$lib';

interface ButtonProps {
  variant: 'primary' | 'secondary';
  disabled?: boolean;
}

// Add ref support
type ButtonPropsWithRef = WithElementRef<ButtonProps, HTMLButtonElement>;

export function Button({ variant, disabled, ref }: ButtonPropsWithRef) {
  return <button bind:this={ref} {disabled} class={variant}></button>;
}
```

## Best Practices

1. **Use cn() everywhere**: Replace all manual className concatenation
2. **IsMobile for responsiveness**: Better than window.innerWidth checks
3. **LocalStorage for persistence**: Auto-syncs across tabs
4. **Lock for async operations**: Prevents race conditions
5. **BREAKPOINTS for consistency**: Use these instead of hardcoded pixel values

## Migration Checklist

- [ ] Replace manual className concatenation with `cn()`
- [ ] Replace localStorage.setItem/getItem with `LocalStorage` class
- [ ] Replace window.innerWidth checks with `IsMobile`
- [ ] Replace isLoading/isSubmitting with `Lock`
- [ ] Use `BREAKPOINTS` constant instead of hardcoded values
- [ ] Update component props to use TypeScript utilities from `types.ts`
