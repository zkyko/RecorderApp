import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../components/Button';

describe('Button', () => {
  it('should render button text', () => {
    render(<Button>Click me</Button>);
    
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByText('Click me').closest('button');
    if (button) {
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    }
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    
    const button = screen.getByText('Disabled Button').closest('button');
    expect(button).toBeDisabled();
  });

  it('should show loading state', () => {
    render(<Button loading>Loading Button</Button>);
    
    const button = screen.getByText('Loading Button').closest('button');
    expect(button).toBeDisabled();
  });
});
