import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import QuickFacts from '@/components/QuickFacts';

const meta: Meta<typeof QuickFacts> = {
  title: 'Components/QuickFacts',
  component: QuickFacts,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ padding: '1.5rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const fullProps = {
  lengthOverall: 12.43,
  beam: 3.99,
  draft: 2.1,
  displacement: 8800,
  ballast: 2800,
  sailAreaMain: 65.5,
  cabins: 3,
  berths: 6,
  heads: 2,
  engineHp: 57,
  fuelCapacity: 200,
  waterCapacity: 360,
  rigType: 'Fractional Sloop',
  hullMaterial: 'GRP',
  keelType: 'Fin keel',
};

export const FullSpecs: Story = {
  args: fullProps,
};

export const PartialSpecs: Story = {
  args: {
    ...fullProps,
    ballast: null,
    sailAreaMain: null,
    heads: null,
    fuelCapacity: null,
  },
};

export const MinimalSpecs: Story = {
  args: {
    ...fullProps,
    beam: null,
    draft: null,
    displacement: null,
    ballast: null,
    sailAreaMain: null,
    cabins: null,
    berths: null,
    heads: null,
    engineHp: null,
    fuelCapacity: null,
    waterCapacity: null,
    hullMaterial: null,
    keelType: null,
  },
};
