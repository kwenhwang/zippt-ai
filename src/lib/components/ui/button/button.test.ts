import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Button from './button.svelte';

describe('Button Component (Apple HIG)', () => {
	it('should have active:scale-95 for touch feedback', () => {
		const { container } = render(Button, {
			props: {
				children: () => 'Test Button'
			}
		});
		const button = container.querySelector('button');
		expect(button).toBeInTheDocument();

		// Check if the button has active:scale-95 class for touch feedback
		const classes = button?.className || '';
		expect(classes).toContain('active:scale-95');
	});

	it('should have transition-transform for smooth animation', () => {
		const { container } = render(Button, {
			props: {
				children: () => 'Test Button'
			}
		});
		const button = container.querySelector('button');
		expect(button).toBeInTheDocument();

		// Check if the button has transition-transform class
		const classes = button?.className || '';
		expect(classes).toContain('transition-transform');
	});

	it('should have 44px touch target for icon size', () => {
		const { container } = render(Button, {
			props: {
				size: 'icon',
				children: () => 'Icon'
			}
		});
		const button = container.querySelector('button');
		expect(button).toBeInTheDocument();

		// Check if icon size variant has size-11 class (44px = 11 * 4px)
		const classes = button?.className || '';
		expect(classes).toContain('size-11');
	});

	it('should render as anchor tag when href is provided', () => {
		const { container } = render(Button, {
			props: {
				href: '/test',
				children: () => 'Link Button'
			}
		});
		const link = container.querySelector('a');
		const button = container.querySelector('button');

		expect(link).toBeInTheDocument();
		expect(button).not.toBeInTheDocument();
		expect(link?.getAttribute('href')).toBe('/test');
	});

	it('should apply active:scale-95 to anchor tag as well', () => {
		const { container } = render(Button, {
			props: {
				href: '/test',
				children: () => 'Link Button'
			}
		});
		const link = container.querySelector('a');
		expect(link).toBeInTheDocument();

		// Check if the anchor also has active:scale-95 class
		const classes = link?.className || '';
		expect(classes).toContain('active:scale-95');
	});

	it('should apply transition-transform to anchor tag as well', () => {
		const { container } = render(Button, {
			props: {
				href: '/test',
				children: () => 'Link Button'
			}
		});
		const link = container.querySelector('a');
		expect(link).toBeInTheDocument();

		// Check if the anchor has transition-transform class
		const classes = link?.className || '';
		expect(classes).toContain('transition-transform');
	});
});
