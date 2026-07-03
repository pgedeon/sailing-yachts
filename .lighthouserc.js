module.exports = {
  ci: {
    collect: {
      url: [
        'https://info.sailboats.fr/en',
        'https://info.sailboats.fr/en/yachts',
        'https://info.sailboats.fr/en/compare'
      ],
      numberOfRuns: 3,
      settings: {
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        preset: 'desktop'
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['warn', { minScore: 0.8 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'canonical': ['error'],
        'uses-responsive-images': ['warn'],
        'uses-rel-preconnect': ['warn'],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'speed-index': ['warn', { maxNumericValue: 3800 }],
        'total-blocking-time': ['warn', { maxNumericValue: 600 }],
        'interactive': ['warn', { maxNumericValue: 3800 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};
