import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { Button } from '../Button';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { describe } from 'node:test';

// Mock the hooks
vi.mock('../../hooks/useResponsiveDesign', () => ({
  useResponsiveDesign: () => ({
    isMobile: false,
    touchDevice: false,
    prefersReducedMotion: false,
  }),
}));

vi.mock('../../hooks/useAccessibility', () => ({
  useAccessibility: () => ({
    announce: vi.fn(),
  }),
}));

describe('Button Basic Tests', () => {
  it('renders correctly', () => {
    render(<Button>Test Button</Button>);
    expect(screen.getByRole('button', { name: /test button/i })).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    render(<Button variant="primary">Primary Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary-600');
  });

  it('shows loading state', () => {
    render(<Button loading>Loading Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button.querySelector('svg')).toBeInTheDocument();
  });
});