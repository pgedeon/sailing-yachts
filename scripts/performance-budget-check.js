#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Load performance budget configuration
const budgetConfig = require('../performance-budgets.config.js');

const pages = [
  { url: 'https://info.sailboats.fr/', name: 'Homepage' },
  { url: 'https://info.sailboats.fr/yachts', name: 'Yachts Page' },
  { url: 'https://info.sailboats.fr/compare', name: 'Compare Page' },
  { url: 'https://info.sailboats.fr/search', name: 'Search Page' }
];

console.log('🚀 Starting Performance Budget Validation...\n');

const results = [];
let totalFailures = 0;

// Create output directory
const outputDir = './budget-results';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

pages.forEach(page => {
  console.log(`📊 Running Lighthouse for: ${page.name} (${page.url})`);
  
  const outputFile = path.join(outputDir, `${page.name.toLowerCase().replace(/\s+/g, '-')}.json`);
  
  try {
    // Run Lighthouse with corrected command
    execSync(`lighthouse ${page.url} --chrome-flags="--headless --no-sandbox" --only-categories=performance,accessibility,best-practices,seo --output-path="${outputFile}" --output=json --quiet`, {
      stdio: 'inherit',
      timeout: 120000 // 2 minute timeout
    });
    
    // Read and parse results
    const result = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
    const lhr = result.lhr;
    
    // Calculate scores
    const performanceScore = (lhr.categories.performance.score * 100).toFixed(1);
    const accessibilityScore = (lhr.categories.accessibility.score * 100).toFixed(1);
    const bestPracticesScore = (lhr.categories['best-practices'].score * 100).toFixed(1);
    const seoScore = (lhr.categories.seo.score * 100).toFixed(1);
    
    // Get key metrics
    const metrics = {
      lcp: lhr.audits['largest-contentful-paint']?.numericValue || 0,
      cls: lhr.audits['cumulative-layout-shift']?.numericValue || 0,
      tbt: lhr.audits['total-blocking-time']?.totalBlockingTime || 0,
      fcp: lhr.audits['first-contentful-paint']?.numericValue || 0,
      si: lhr.audits['speed-index']?.numericValue || 0,
      interactive: lhr.audits['interactive']?.numericValue || 0
    };
    
    // Validate against budgets
    const budget = budgetConfig.budgets.find(b => b.name === page.name);
    const pageFailures = [];
    
    if (budget) {
      // Check each budget metric
      Object.entries(budget.metrics).forEach(([metric, config]) => {
        const value = metrics[metric];
        if (value > config.max) {
          pageFailures.push(`${metric}: ${value} > ${config.max} ${config.unit}`);
        }
      });
    }
    
    // Check global thresholds
    const globalFailures = [];
    if (performanceScore < budgetConfig.globalThresholds.performance * 100) {
      globalFailures.push(`Performance score: ${performanceScore}% < ${budgetConfig.globalThresholds.performance * 100}%`);
    }
    if (accessibilityScore < budgetConfig.globalThresholds.accessibility * 100) {
      globalFailures.push(`Accessibility score: ${accessibilityScore}% < ${budgetConfig.globalThresholds.accessibility * 100}%`);
    }
    if (bestPracticesScore < budgetConfig.globalThresholds.bestPractices * 100) {
      globalFailures.push(`Best practices score: ${bestPracticesScore}% < ${budgetConfig.globalThresholds.bestPractices * 100}%`);
    }
    if (seoScore < budgetConfig.globalThresholds.seo * 100) {
      globalFailures.push(`SEO score: ${seoScore}% < ${budgetConfig.globalThresholds.seo * 100}%`);
    }
    
    // Store result
    const pageResult = {
      name: page.name,
      url: page.url,
      scores: {
        performance: performanceScore,
        accessibility: accessibilityScore,
        bestPractices: bestPracticesScore,
        seo: seoScore
      },
      metrics,
      failures: [...pageFailures, ...globalFailures],
      passed: pageFailures.length === 0 && globalFailures.length === 0
    };
    
    results.push(pageResult);
    
    // Display results
    console.log(`  📈 Scores:`);
    console.log(`    Performance: ${performanceScore}%`);
    console.log(`    Accessibility: ${accessibilityScore}%`);
    console.log(`    Best Practices: ${bestPracticesScore}%`);
    console.log(`    SEO: ${seoScore}%`);
    console.log(`  📏 Metrics:`);
    console.log(`    LCP: ${metrics.lcp}ms`);
    console.log(`    CLS: ${metrics.cls}`);
    console.log(`    TBT: ${metrics.tbt}ms`);
    console.log(`    FCP: ${metrics.fcp}ms`);
    console.log(`    Speed Index: ${metrics.si}ms`);
    console.log(`    Interactive: ${metrics.interactive}ms`);
    
    if (pageResult.passed) {
      console.log(`  ✅ All budgets passed!`);
    } else {
      console.log(`  ❌ Budget failures:`);
      pageResult.failures.forEach(failure => {
        console.log(`    • ${failure}`);
      });
      totalFailures++;
    }
    
    console.log('');
    
  } catch (error) {
    console.error(`❌ Error running Lighthouse for ${page.name}:`, error.message);
    results.push({
      name: page.name,
      url: page.url,
      error: error.message,
      passed: false
    });
    totalFailures++;
  }
});

// Generate final report
console.log('='.repeat(50));
console.log('PERFORMANCE BUDGET VALIDATION REPORT');
console.log('='.repeat(50));

const passedPages = results.filter(r => r.passed && r.scores);
const failedPages = results.filter(r => !r.passed || !r.scores);

console.log(`✅ Passed: ${passedPages.length}`);
console.log(`❌ Failed: ${failedPages.length}`);
console.log(`📊 Total Pages: ${results.length}`);

if (failedPages.length > 0) {
  console.log('\n❌ Failed Pages:');
  failedPages.forEach(page => {
    if (page.error) {
      console.log(`  • ${page.name}: ${page.error}`);
    } else {
      console.log(`  • ${page.name}: Budget violations`);
    }
  });
}

// Calculate average scores (only for successful runs)
if (passedPages.length > 0) {
  const avgPerf = (passedPages.reduce((sum, r) => sum + parseFloat(r.scores.performance), 0) / passedPages.length).toFixed(1);
  const accPerf = (passedPages.reduce((sum, r) => sum + parseFloat(r.scores.accessibility), 0) / passedPages.length).toFixed(1);
  const bpPerf = (passedPages.reduce((sum, r) => sum + parseFloat(r.scores.bestPractices), 0) / passedPages.length).toFixed(1);
  const seoPerf = (passedPages.reduce((sum, r) => sum + parseFloat(r.scores.seo), 0) / passedPages.length).toFixed(1);
  
  console.log('\n📊 Average Scores (Successful Runs):');
  console.log(`  Performance: ${avgPerf}%`);
  console.log(`  Accessibility: ${accPerf}%`);
  console.log(`  Best Practices: ${bpPerf}%`);
  console.log(`  SEO: ${seoPerf}%`);
}

console.log('\n📋 Next Steps:');
if (totalFailures === 0) {
  console.log('  ✅ All performance budgets are within acceptable limits!');
  console.log('  • Continue monitoring performance in CI');
  console.log('  • Consider tightening budgets as performance improves');
} else {
  console.log('  🛠️ Action Required:');
  console.log('  • Review the failed pages above');
  console.log('  • Optimize assets, code splitting, or critical rendering path');
  console.log('  • Consider adjusting budget thresholds if needed');
  console.log('  • Check if the site is accessible and running properly');
  console.log('  • Run locally with DEBUG=* for more detailed output');
}

// Exit with appropriate code
process.exit(totalFailures > 0 ? 1 : 0);