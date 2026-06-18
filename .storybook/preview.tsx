import type { Preview } from '@storybook/nextjs-vite';
import '../app/globals.css';

// Mock next-intl's useTranslations
const mockTranslations: Record<string, Record<string, string>> = {
  Ratings: {
    ratingLabel: '{average} out of 5 ({count} ratings)',
    noRatings: 'No ratings yet',
    ratingCount: '{count, plural, =1 {# rating} other {# ratings}}',
    distribution: 'Rating Distribution',
  },
  QuickFacts: {
    sectionLabel: 'Quick specifications',
    heading: 'Key Specifications',
    lengthOverall: 'Length Overall',
    beam: 'Beam',
    draft: 'Draft',
    displacement: 'Displacement',
    ballast: 'Ballast',
    sailAreaMain: 'Sail Area (Main)',
    rigType: 'Rig Type',
    cabins: 'Cabins',
    berths: 'Berths',
    heads: 'Heads',
    engineHp: 'Engine Power',
    fuelCapacity: 'Fuel Capacity',
    waterCapacity: 'Water Capacity',
  },
  SocialShare: {
    share: 'Share',
    shareOn: 'Share on {platform}',
    copyLink: 'Copy link',
    copy: 'Copy',
    copied: 'Copied!',
  },
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
    nextjs: {
      appDirectory: true,
    },
  },
  decorators: [
    (Story) => {
      // Mock useTranslations for storybook
      const MockModule = require('next-intl');
      const originalUseTranslations = MockModule.useTranslations;
      MockModule.useTranslations = (namespace: string) => {
        const messages = mockTranslations[namespace] || {};
        return (key: string, params?: Record<string, any>) => {
          let msg = messages[key] || key;
          if (params) {
            Object.entries(params).forEach(([k, v]) => {
              msg = msg.replace(`{${k}}`, String(v));
              // Handle plural format: {count, plural, =1 {# rating} other {# ratings}}
              msg = msg.replace(
                /\{(\w+),\s*plural,\s*=1\s*\{#\s*\w+\}\s*other\s*\{#\s*\w+\}\}/,
                String(params[k])
              );
            });
          }
          return msg;
        };
      };
      return <Story />;
    },
  ],
};

export default preview;
