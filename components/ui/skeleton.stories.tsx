import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  Skeleton,
  SkeletonLine,
  SkeletonCircle,
  SkeletonImage,
  SkeletonCard,
  SkeletonStat,
  SkeletonTableRow,
  SkeletonFilterSection,
} from '@/components/ui/skeleton';

const meta: Meta = {
  title: 'UI/Skeletons',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1.5rem', maxWidth: '640px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

export const BasicSkeleton: StoryObj = {
  render: () => <Skeleton className="h-12 w-64" />,
  name: 'Basic Block',
};

export const TextLine: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <SkeletonLine width="100%" />
      <SkeletonLine width="80%" />
      <SkeletonLine width="60%" />
    </div>
  ),
  name: 'Text Lines',
};

export const Avatar: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <SkeletonCircle size="h-8 w-8" />
      <SkeletonCircle size="h-10 w-10" />
      <SkeletonCircle size="h-12 w-12" />
    </div>
  ),
  name: 'Circle (Avatar)',
};

export const Image: StoryObj = {
  render: () => <SkeletonImage />,
  name: 'Image Placeholder',
};

export const Card: StoryObj = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
      <SkeletonCard lines={3} />
      <SkeletonCard lines={2} />
    </div>
  ),
  name: 'Cards',
};

export const Stats: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: '1.5rem' }}>
      <SkeletonStat />
      <SkeletonStat />
      <SkeletonStat />
    </div>
  ),
  name: 'Stats',
};

export const TableRow: StoryObj = {
  render: () => (
    <div>
      <SkeletonTableRow cells={5} />
      <SkeletonTableRow cells={5} />
      <SkeletonTableRow cells={5} />
    </div>
  ),
  name: 'Table Rows',
};

export const FilterSection: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <SkeletonFilterSection options={5} />
      <SkeletonFilterSection options={3} />
    </div>
  ),
  name: 'Filter Sections',
};
