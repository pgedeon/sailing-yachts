import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import SocialShareButtons from '@/components/SocialShareButtons';

const meta: Meta<typeof SocialShareButtons> = {
  title: 'Components/SocialShareButtons',
  component: SocialShareButtons,
  tags: ['autodocs'],
  args: {
    url: 'https://info.sailboats.fr/yachts/beneteau-oceanis-40-1',
    title: 'Bénéteau Oceanis 40.1 (2024)',
    description: 'A versatile 40-foot cruiser from Bénéteau',
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongTitle: Story = {
  args: {
    title: 'Bavaria Yachts C42 Heritage Edition — The Ultimate Family Cruiser for Long-Distance Sailing Adventures',
  },
};

export const FrenchUrl: Story = {
  args: {
    url: 'https://info.sailboats.fr/fr/yachts/beneteau-oceanis-40-1',
    title: 'Bénéteau Oceanis 40.1 (2024)',
    description: 'Un croiseur polyvalent de 40 pieds signé Bénéteau',
  },
};
