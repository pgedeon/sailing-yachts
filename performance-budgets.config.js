module.exports = {
  // Performance budgets for different pages
  budgets: [
    {
      // Homepage - critical page with highest traffic
      id: 'homepage',
      name: 'Homepage',
      path: '/',
      metrics: {
        'largest-contentful-paint': {
          max: 2500, // 2.5s
          min: 0,
          unit: 'milliseconds'
        },
        'cumulative-layout-shift': {
          max: 0.1, // 0.1 CLS
          min: 0,
          unit: 'ratio'
        },
        'speed-index': {
          max: 3800, // 3.8s
          min: 0,
          unit: 'milliseconds'
        },
        'total-blocking-time': {
          max: 600, // 600ms
          min: 0,
          unit: 'milliseconds'
        },
        'first-contentful-paint': {
          max: 1800, // 1.8s
          min: 0,
          unit: 'milliseconds'
        },
        'interactive': {
          max: 3800, // 3.8s
          min: 0,
          unit: 'milliseconds'
        }
      }
    },
    {
      // Yachts listing page - important for discovery
      id: 'yachts-page',
      name: 'Yachts Listing',
      path: '/yachts',
      metrics: {
        'largest-contentful-paint': {
          max: 3000, // 3.0s (can be slower due to more content)
          min: 0,
          unit: 'milliseconds'
        },
        'cumulative-layout-shift': {
          max: 0.1,
          min: 0,
          unit: 'ratio'
        },
        'speed-index': {
          max: 4200, // 4.2s
          min: 0,
          unit: 'milliseconds'
        },
        'total-blocking-time': {
          max: 700, // 700ms
          min: 0,
          unit: 'milliseconds'
        }
      }
    },
    {
      // Compare page - user interaction focused
      id: 'compare-page',
      name: 'Compare Page',
      path: '/compare',
      metrics: {
        'largest-contentful-paint': {
          max: 3500, // 3.5s (complex UI)
          min: 0,
          unit: 'milliseconds'
        },
        'cumulative-layout-shift': {
          max: 0.15, // Slightly higher allowance for dynamic content
          min: 0,
          unit: 'ratio'
        },
        'speed-index': {
          max: 4500, // 4.5s
          min: 0,
          unit: 'milliseconds'
        }
      }
    },
    {
      // Search page - quick results important
      id: 'search-page',
      name: 'Search Page',
      path: '/search',
      metrics: {
        'largest-contentful-paint': {
          max: 2800, // 2.8s
          min: 0,
          unit: 'milliseconds'
        },
        'cumulative-layout-shift': {
          max: 0.1,
          min: 0,
          unit: 'ratio'
        },
        'speed-index': {
          max: 4000, // 4.0s
          min: 0,
          unit: 'milliseconds'
        }
      }
    }
  ],

  // Global thresholds
  globalThresholds: {
    accessibility: 0.8, // 80% score
    bestPractices: 0.9, // 90% score
    seo: 0.9, // 90% score
    performance: 0.75 // 75% score (slightly lower for complex app)
  },

  // CI-specific settings
  ci: {
    runs: 3, // Number of test runs for averaging
    failBuildOnErrors: true,
    verbose: true
  },

  // Local development settings
  local: {
    runs: 1,
    failBuildOnErrors: false,
    verbose: false
  }
};