import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HomePage from './page';

describe('HomePage', () => {
  it('renders the app name', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { name: 'meet-invite' })).toBeInTheDocument();
  });
});
