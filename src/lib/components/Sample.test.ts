import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Sample from './Sample.svelte';

describe('Sample Component', () => {
	it('should render with default message', () => {
		render(Sample);
		const element = screen.getByTestId('sample-component');
		expect(element).toBeInTheDocument();
		expect(element).toHaveTextContent('Hello');
	});

	it('should render with custom message', () => {
		render(Sample, { message: 'Custom Message' });
		const element = screen.getByTestId('sample-component');
		expect(element).toHaveTextContent('Custom Message');
	});
});
