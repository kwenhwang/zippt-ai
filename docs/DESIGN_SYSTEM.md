# Design System Documentation

## Token Sheet

### Colors
| Name | Value | Description |
|------|-------|-------------|
| `--bg-primary` | `#f8fafc` (Light) / `#000000` (Dark) | Main background |
| `--bg-secondary` | `#ffffff` (Light) / `#0f172a` (Dark) | Card/Panel background |
| `--text-primary` | `#0f172a` (Light) / `#f1f5f9` (Dark) | Primary text |
| `--text-secondary` | `#475569` (Light) / `#94a3b8` (Dark) | Secondary text |
| `--accent-primary` | `#f97316` | Primary action color (Orange) |
| `--accent-highlight`| `#fb923c` | Lighter accent for hover |

### Typography
| Token | Value | usage |
|-------|-------|-------|
| `--font-sans` | `Inter, sans-serif` | Global font family |
| `--text-sm` | `0.875rem` / `1.25rem` | Helper text |
| `--text-base` | `1rem` / `1.5rem` | Body text |
| `--text-lg` | `1.125rem` / `1.75rem` | Subtitles |
| `--text-xl` | `1.25rem` / `1.75rem` | Titles |
| `--tracking-tight`| `-0.025em` | Headings |

### Spacing & Radius
| Token | Value |
|-------|-------|
| `--spacing-unit` | `4px` |
| `--radius-sm` | `0.375rem` (6px) |
| `--radius-md` | `0.5rem` (8px) |
| `--radius-lg` | `0.75rem` (12px) |
| `--radius-full` | `9999px` |

### Shadows
| Token | Value |
|-------|-------|
| `--shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` |
| `--shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1)` |
| `--shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1)` |
| `--shadow-glass`| `0 8px 32px 0 rgba(31, 38, 135, 0.07)` |

### Animation
| Token | Value | Role |
|-------|-------|------|
| `--duration-fast` | `150ms` | Buttons, Toggles, Micro-interactions |
| `--duration-normal`| `300ms` | Modals, Panels, Tooltips |
| `--duration-slow` | `500ms` | Page transitions, Complex movements |
| `--ease-out` | `cubic-bezier(0.2, 0.0, 0, 1)` | Entering, Hovering |
| `--ease-in-out` | `cubic-bezier(0.4, 0.0, 0.2, 1)` | Moving, Changing state |

## Motion Guidelines

### Context Rules
1.  **Buttons & Inputs**: Use **Fast (150ms)** with **Ease-Out**. The feedback should feel instant and snappy.
2.  **Modals & Panels**: Use **Normal (300ms)** with **Ease-In-Out**. They occupy significant screen space and need smooth entrance/exit.
3.  **Page Transitions**: Use **Normal to Slow (300-400ms)** with **Ease-In-Out**. Avoid jarring jumps between routes.
4.  **Cards**:
    *   Hover: **200ms Ease-Out**, Scale 1.02, Lift -4px.
    *   Click: **100ms Ease-Out**, Scale 0.98.

### Accessibility
*   Respect `prefers-reduced-motion`.
*   If reduced motion is requested:
    *   Set durations to `0ms` or minimal fade only.
    *   Disable large movements (slide, scale).

## Performance Budget
*   **LCP (Largest Contentful Paint)**: < 2.0s
*   **FID (First Input Delay)**: < 100ms
*   **CLS (Cumulative Layout Shift)**: < 0.1
*   **TTI (Time to Interactive)**: < 3.5s
*   **INP (Interaction to Next Paint)**: < 200ms
*   **JS Bundle Size**: < 200KB initial chunk
