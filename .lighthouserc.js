module.exports = {
  ci: {
    collect: {
      url: ['https://info.sailboats.fr/', 'https://info.sailboats.fr/yachts', 'https://info.sailboats.fr/compare', 'https://info.sailboats.fr/search'],
      numberOfRuns: 3,
      startServer: 'npm run start',
      startServerReadyPattern: 'started server on',
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
        'uses-rel-preload': ['warn'],
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