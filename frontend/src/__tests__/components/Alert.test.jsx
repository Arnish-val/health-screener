import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Alert from '../../components/ui/Alert';

describe('Alert', () => {
  it('renders message text', () => {
    render(<Alert>Something happened</Alert>);
    expect(screen.getByText('Something happened')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<Alert title="Error">Details here</Alert>);
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Details here')).toBeInTheDocument();
  });

  it('has alert role for accessibility', () => {
    render(<Alert>Accessible</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
