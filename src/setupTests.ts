import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock mode-watcher to avoid issues in tests
vi.mock('mode-watcher', () => ({
	ModeWatcher: vi.fn(),
	toggleMode: vi.fn(),
	setMode: vi.fn(),
	mode: {
		current: 'dark'
	}
}));
