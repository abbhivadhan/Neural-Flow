import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

// Mock the responsive design hook
jest.mock('../../hooks/useResponsiveDesign', () => ({
  useResponsiveDesign: () => ({
    isMobile: false,
    touchDevice: false,
  }),
}));

// Mock the accessibility hook
jest.mock('../../hooks/useAccessibility', () => ({
  useAccessibility: () => ({
    announce: jest.fn(),
    generateId: jest.fn(() => 'test-id'),
  }),
}));

describe('Input', () => {
  it('renders with basic props', () => {
    render(<Input placeholder="Enter text" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Enter text');
  });

  it('renders with label', () => {
    render(<Input label="Test Label" />);
    
    const label = screen.getByText('Test Label');
    const input = screen.getByRole('textbox');
    
    expect(label).toBeInTheDocument();
    expect(label).toHaveAttribute('for', input.id);
  });

  it('shows required indicator', () => {
    render(<Input label="Required Field" required />);
    
    const label = screen.getByText('Required Field');
    expect(label).toHaveClass("after:content-['*']");
  });

  it('displays error message', () => {
    render(<Input error="This field is required" />);
    
    const errorMessage = screen.getByRole('alert');
    expect(errorMessage).toHaveTextContent('This field is required');
    expect(errorMessage).toHaveClass('text-red-600');
  });

  it('displays helper text', () => {
    render(<Input helperText="This is helper text" />);
    
    const helperText = screen.getByText('This is helper text');
    expect(helperText).toBeInTheDocument();
    expect(helperText).toHaveClass('text-slate-500');
  });

  it('shows character count when enabled', () => {
    render(<Input showCharacterCount maxLength={10} defaultValue="test" />);
    
    const characterCount = screen.getByText('4/10');
    expect(characterCount).toBeInTheDocument();
  });

  it('updates character count on input', async () => {
    render(<Input showCharacterCount maxLength={10} />);
    
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'hello');
    
    expect(screen.getByText('5/10')).toBeInTheDocument();
  });

  it('handles controlled input', async () => {
    const handleChange = jest.fn();
    render(<Input value="controlled" onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('controlled');
    
    await userEvent.type(input, 'a');
    expect(handleChange).toHaveBeenCalled();
  });

  it('renders with icons', () => {
    const leftIcon = <span data-testid="left-icon">L</span>;
    const rightIcon = <span data-testid="right-icon">R</span>;
    
    render(<Input leftIcon={leftIcon} rightIcon={rightIcon} />);
    
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('applies different variants', () => {
    const { rerender } = render(<Input variant="filled" />);
    expect(screen.getByRole('textbox')).toHaveClass('bg-slate-100');

    rerender(<Input variant="outline" />);
    expect(screen.getByRole('textbox')).toHaveClass('border-2');
  });

  it('applies different sizes', () => {
    const { rerender } = render(<Input inputSize="sm" />);
    expect(screen.getByRole('textbox')).toHaveClass('px-3', 'py-2', 'text-sm');

    rerender(<Input inputSize="lg" />);
    expect(screen.getByRole('textbox')).toHaveClass('px-4', 'py-3', 'text-base');
  });

  it('handles disabled state', () => {
    render(<Input disabled />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:opacity-50');
  });

  it('has proper accessibility attributes', () => {
    render(
      <Input 
        label="Accessible Input"
        error="Error message"
        helperText="Helper text"
        required
      />
    );
    
    const input = screen.getByRole('textbox');
    const errorMessage = screen.getByRole('alert');
    
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toHaveAttribute('aria-describedby');
    
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toContain(errorMessage.id);
  });

  it('handles focus and blur events', async () => {
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();
    
    render(<Input onFocus={handleFocus} onBlur={handleBlur} />);
    
    const input = screen.getByRole('textbox');
    
    await userEvent.click(input);
    expect(handleFocus).toHaveBeenCalled();
    
    await userEvent.tab();
    expect(handleBlur).toHaveBeenCalled();
  });

  it('supports full width', () => {
    render(<Input fullWidth />);
    
    const container = screen.getByRole('textbox').closest('div');
    expect(container).toHaveClass('w-full');
  });

  it('respects maxLength attribute', async () => {
    render(<Input maxLength={5} />);
    
    const input = screen.getByRole('textbox');
    await userEvent.type(input, '123456789');
    
    expect(input).toHaveValue('12345');
  });
});