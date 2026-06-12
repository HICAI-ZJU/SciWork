import { render, screen } from '@testing-library/react';
import { SciWorkPulseIcon } from './SciWorkPulseIcon';

describe('SciWorkPulseIcon', () => {
  it('renders an accessible animated Qiushi Intelligence Core icon', () => {
    render(<SciWorkPulseIcon state="active" title="SciWork 求是智核" />);

    const icon = screen.getByRole('img', { name: 'SciWork 求是智核' });
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('data-state', 'active');
  });
});
