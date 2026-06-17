/**
 * Tests for CI/CD pipeline configuration (P27.4)
 *
 * Validates that:
 * - Dependabot config is well-formed
 * - CI workflow includes security scan job
 * - CodeQL workflow exists and targets JS/TS
 * - Lighthouse CI job runs on PRs
 * - All workflow YAML files are valid
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

const REPO_ROOT = path.resolve(__dirname, '..');

function readYaml(filePath: string): any {
  const resolved = path.resolve(REPO_ROOT, filePath);
  const content = fs.readFileSync(resolved, 'utf-8');
  return yaml.load(content);
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(path.resolve(REPO_ROOT, filePath));
}

describe('P27.4 — CI/CD Pipeline Enhancement', () => {
  describe('Dependabot configuration', () => {
    it('.github/dependabot.yml exists', () => {
      expect(fileExists('.github/dependabot.yml')).toBe(true);
    });

    it('has valid YAML structure', () => {
      const config = readYaml('.github/dependabot.yml');
      expect(config).toBeTruthy();
      expect(config.version).toBe(2);
      expect(Array.isArray(config.updates)).toBe(true);
    });

    it('includes npm ecosystem updates', () => {
      const config = readYaml('.github/dependabot.yml');
      const npmUpdate = config.updates.find(
        (u: any) => u['package-ecosystem'] === 'npm'
      );
      expect(npmUpdate).toBeDefined();
      expect(npmUpdate.directory).toBe('/');
      expect(npmUpdate.schedule).toBeDefined();
    });

    it('groups minor and patch updates', () => {
      const config = readYaml('.github/dependabot.yml');
      const npmUpdate = config.updates.find(
        (u: any) => u['package-ecosystem'] === 'npm'
      );
      expect(npmUpdate.groups).toBeDefined();
      expect(npmUpdate.groups['minor-and-patch']).toBeDefined();
    });

    it('includes github-actions ecosystem updates', () => {
      const config = readYaml('.github/dependabot.yml');
      const actionsUpdate = config.updates.find(
        (u: any) => u['package-ecosystem'] === 'github-actions'
      );
      expect(actionsUpdate).toBeDefined();
    });

    it('ignores major Next.js updates (manual migration required)', () => {
      const config = readYaml('.github/dependabot.yml');
      const npmUpdate = config.updates.find(
        (u: any) => u['package-ecosystem'] === 'npm'
      );
      const nextIgnore = npmUpdate.ignore.find(
        (i: any) => i['dependency-name'] === 'next'
      );
      expect(nextIgnore).toBeDefined();
      expect(nextIgnore['update-types']).toContain('version-update:semver-major');
    });
  });

  describe('CI workflow — security scan', () => {
    let ciWorkflow: any;

    it('.github/workflows/ci.yml is valid YAML', () => {
      ciWorkflow = readYaml('.github/workflows/ci.yml');
      expect(ciWorkflow).toBeTruthy();
      expect(ciWorkflow.name).toBe('CI');
      expect(ciWorkflow.jobs).toBeDefined();
    });

    it('includes a security-scan job', () => {
      ciWorkflow = readYaml('.github/workflows/ci.yml');
      expect(ciWorkflow.jobs['security-scan']).toBeDefined();
      expect(ciWorkflow.jobs['security-scan']['name']).toMatch(/security/i);
    });

    it('security-scan job runs npm audit', () => {
      ciWorkflow = readYaml('.github/workflows/ci.yml');
      const steps = ciWorkflow.jobs['security-scan'].steps;
      const auditStep = steps.find((s: any) => {
        const run = s.run || '';
        return run.includes('npm audit');
      });
      expect(auditStep).toBeDefined();
      expect(auditStep.run).toContain('--audit-level=high');
    });

    it('preserves existing typecheck, build, and lint jobs', () => {
      ciWorkflow = readYaml('.github/workflows/ci.yml');
      expect(ciWorkflow.jobs.typecheck).toBeDefined();
      expect(ciWorkflow.jobs.build).toBeDefined();
      expect(ciWorkflow.jobs.lint).toBeDefined();
    });
  });

  describe('CI workflow — Lighthouse CI performance regression', () => {
    it('includes a lighthouse-ci job', () => {
      const ciWorkflow = readYaml('.github/workflows/ci.yml');
      expect(ciWorkflow.jobs['lighthouse-ci']).toBeDefined();
    });

    it('lighthouse-ci job runs only on pull requests', () => {
      const ciWorkflow = readYaml('.github/workflows/ci.yml');
      expect(ciWorkflow.jobs['lighthouse-ci'].if).toContain('pull_request');
    });

    it('lighthouse-ci job depends on build', () => {
      const ciWorkflow = readYaml('.github/workflows/ci.yml');
      expect(ciWorkflow.jobs['lighthouse-ci'].needs).toContain('build');
    });

    it('lighthouse-ci job runs LHCI autorun', () => {
      const ciWorkflow = readYaml('.github/workflows/ci.yml');
      const steps = ciWorkflow.jobs['lighthouse-ci'].steps;
      const lhciStep = steps.find((s: any) => {
        const run = s.run || '';
        return run.includes('lhci') || run.includes('autorun');
      });
      expect(lhciStep).toBeDefined();
    });
  });

  describe('CodeQL workflow', () => {
    let codeqlWorkflow: any;

    it('.github/workflows/codeql.yml exists', () => {
      expect(fileExists('.github/workflows/codeql.yml')).toBe(true);
    });

    it('is valid YAML with correct name', () => {
      codeqlWorkflow = readYaml('.github/workflows/codeql.yml');
      expect(codeqlWorkflow).toBeTruthy();
      expect(codeqlWorkflow.name).toMatch(/codeql/i);
    });

    it('targets javascript-typescript language', () => {
      codeqlWorkflow = readYaml('.github/workflows/codeql.yml');
      const languages = codeqlWorkflow.jobs.analyze.strategy.matrix.language;
      expect(languages).toContain('javascript-typescript');
    });

    it('has security-events write permission', () => {
      codeqlWorkflow = readYaml('.github/workflows/codeql.yml');
      expect(codeqlWorkflow.jobs.analyze.permissions['security-events']).toBe('write');
    });

    it('runs on push to main and on schedule', () => {
      codeqlWorkflow = readYaml('.github/workflows/codeql.yml');
      expect(codeqlWorkflow.on.push.branches).toContain('main');
      expect(codeqlWorkflow.on.schedule).toBeDefined();
    });
  });
});
