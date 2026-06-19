import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { StarRatingDisplay } from '@/components/StarRatingDisplay';

const meta: Meta<typeof StarRatingDisplay> = {
  title: 'Components/StarRatingDisplay',
  component: StarRatingDisplay,
  tags: ['autodocs'],
  args: {
    average: 4.2,
    count: 127,
    size: 'md',
    showCount: true,
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    showCount: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const HighRating: Story = {
  args: {
    average: 4.8,
    count: 342,
  },
};

export const LowRating: Story = {
  args: {
    average: 2.3,
    count: 18,
  },
};

export const HalfStar: Story = {
  args: {
    average: 3.5,
    count: 56,
  },
};

export const NoRatings: Story = {
  args: {
    average: 0,
    count: 0,
  },
};

export const LargeSize: Story = {
  args: {
    size: 'lg',
    average: 4.6,
    count: 89,
  },
};

export const SmallSize: Story = {
  args: {
    size: 'sm',
    average: 4.0,
    count: 12,
  },
};

export const WithoutCount: Story = {
  args: {
    showCount: false,
    average: 4.5,
    count: 100,
  },
};
