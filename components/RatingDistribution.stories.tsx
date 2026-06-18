import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { RatingDistribution } from '@/components/RatingDistribution';

const meta: Meta<typeof RatingDistribution> = {
  title: 'Components/RatingDistribution',
  component: RatingDistribution,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '320px', padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  args: {
    distribution: { 5: 80, 4: 30, 3: 10, 2: 4, 1: 3 },
    total: 127,
  },
};

export const SkewedHigh: Story = {
  args: {
    distribution: { 5: 200, 4: 80, 3: 15, 2: 3, 1: 2 },
    total: 300,
  },
};

export const Uniform: Story = {
  args: {
    distribution: { 5: 20, 4: 20, 3: 20, 2: 20, 1: 20 },
    total: 100,
  },
};

export const FewRatings: Story = {
  args: {
    distribution: { 5: 3, 4: 1 },
    total: 4,
  },
};
