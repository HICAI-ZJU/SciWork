import { render, screen } from '@testing-library/react';
import { SciWorkPulseIcon } from './SciWorkPulseIcon';

describe('SciWorkPulseIcon', () => {
  it('renders an accessible animated Qiushi Intelligence Core v2 icon', () => {
    render(<SciWorkPulseIcon state="active" title="SciWork 求是智核" tone="light" />);

    const icon = screen.getByRole('img', { name: 'SciWork 求是智核' });
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('data-state', 'active');
    expect(icon).toHaveAttribute('data-tone', 'light');
  });

  it('includes a molecule layer for the thinking animation', () => {
    render(<SciWorkPulseIcon state="thinking" title="SciWork 求是智核" tone="light" />);

    const icon = screen.getByRole('img', { name: 'SciWork 求是智核' });
    expect(icon.querySelector('[data-science-structure="molecule"]')).toBeInTheDocument();
  });
});
