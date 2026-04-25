import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * P13.5 — Media Accessibility: Static analysis of TSX source files
 * Ensures all <img>, <svg>, and icon-only buttons follow accessibility rules.
 */

function findTsxFiles(dir: string): string[] {
  const results: string[] = [];
  function walk(d: string) {
    if (!fs.existsSync(d)) return;
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.cache') continue;
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx')) results.push(full);
    }
  }
  walk(dir);
  return results;
}

const PROJECT_ROOT = path.resolve(__dirname, '..');
const APP_DIR = path.join(PROJECT_ROOT, 'app');
const COMPONENTS_DIR = path.join(PROJECT_ROOT, 'components');

const allFiles = [...findTsxFiles(APP_DIR), ...findTsxFiles(COMPONENTS_DIR)]
  .filter(f => !f.includes('/admin/'));

// Known Lucide icon component names
const LUCIDE_ICONS = new Set([
  'ArrowRight', 'ChevronLeft', 'ChevronRight', 'ChevronDown', 'ChevronUp',
  'Ruler', 'Wind', 'Home', 'Wrench', 'Star', 'Printer',
  'ExternalLink', 'ShoppingBag', 'Mail', 'Phone', 'Info', 'Clock', 'CheckCircle2',
  'PlayCircle', 'FileText', 'Layout', 'Map', 'RotateCcw', 'Box',
  'X', 'Download', 'Video', 'AlertTriangle', 'Send', 'Plus', 'CheckCircle',
  'Shield', 'Calendar', 'Database', 'Scale', 'BookOpen', 'Check',
  'ImageIcon', 'Search',
]);

/**
 * Extract a full opening tag that may span multiple lines.
 * Tracks angle brackets to find the actual closing '>' of the opening tag.
 */
function extractFullTag(content: string, startIdx: number): string {
  let depth = 0;
  let inString: string | null = null;
  let i = startIdx;
  
  while (i < content.length) {
    const ch = content[i];
    
    // Handle string literals
    if (inString) {
      if (ch === inString && content[i - 1] !== '\\') inString = null;
      i++;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inString = ch;
      i++;
      continue;
    }
    
    if (ch === '<') depth++;
    if (ch === '>') {
      depth--;
      if (depth === 0) {
        return content.substring(startIdx, i + 1);
      }
    }
    i++;
  }
  
  return content.substring(startIdx);
}

describe('P13.5 — Media Accessibility', () => {
  describe('Image alt text', () => {
    it('all <img> tags have alt attribute', () => {
      const violations: string[] = [];
      
      for (const file of allFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const relPath = path.relative(PROJECT_ROOT, file);
        
        const imgRegex = /<img\s[^>]*>/g;
        let match;
        while ((match = imgRegex.exec(content)) !== null) {
          const tag = match[0];
          if (!tag.includes('alt=')) {
            const line = content.substring(0, match.index).split('\n').length;
            violations.push(`${relPath}:${line} — <img> missing alt attribute`);
          }
        }
      }
      
      expect(violations, `Missing alt attributes:\n${violations.join('\n')}`).toHaveLength(0);
    });
  });

  describe('SVG accessibility', () => {
    it('all inline <svg> have aria-hidden or accessible name', () => {
      const violations: string[] = [];
      
      for (const file of allFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const relPath = path.relative(PROJECT_ROOT, file);
        
        // Skip data URI SVGs
        const svgRegex = /<svg\s/g;
        let match;
        while ((match = svgRegex.exec(content)) !== null) {
          // Check if this is inside a string literal (data URI)
          const before = content.substring(Math.max(0, match.index - 100), match.index);
          if (before.includes("'data:image/svg+xml") || before.includes('"data:image/svg+xml')) continue;
          
          const fullTag = extractFullTag(content, match.index);
          
          const hasAriaHidden = fullTag.includes('aria-hidden="true"');
          const hasAriaLabel = fullTag.includes('aria-label=');
          const hasRole = fullTag.includes('role=');
          
          if (!hasAriaHidden && !hasAriaLabel && !hasRole) {
            const line = content.substring(0, match.index).split('\n').length;
            violations.push(`${relPath}:${line} — <svg> missing aria-hidden or accessible name`);
          }
        }
      }
      
      expect(violations, `SVGs without accessibility:\n${violations.join('\n')}`).toHaveLength(0);
    });
  });

  describe('Icon-only buttons', () => {
    it('buttons with title attribute also have aria-label', () => {
      const violations: string[] = [];
      
      for (const file of allFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const relPath = path.relative(PROJECT_ROOT, file);
        
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (!line.includes('title=') || !line.includes('<button')) continue;
          
          const context = lines.slice(i, Math.min(i + 3, lines.length)).join('\n');
          
          if (context.includes('title=') && !context.includes('aria-label=')) {
            violations.push(`${relPath}:${i + 1} — <button> with title but no aria-label`);
          }
        }
      }
      
      expect(violations, `Buttons missing aria-label:\n${violations.join('\n')}`).toHaveLength(0);
    });
  });

  describe('Lucide icons accessibility', () => {
    it('lucide icon components have aria-hidden when decorative', () => {
      const violations: string[] = [];
      
      for (const file of allFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const relPath = path.relative(PROJECT_ROOT, file);
        
        for (const iconName of LUCIDE_ICONS) {
          const regex = new RegExp(`<${iconName}\\s[^>]*?\\/>`, 'g');
          let match;
          while ((match = regex.exec(content)) !== null) {
            const tag = match[0];
            if (tag.includes('aria-hidden') || tag.includes('aria-label')) continue;
            
            const line = content.substring(0, match.index).split('\n').length;
            violations.push(`${relPath}:${line} — <${iconName}> missing aria-hidden="true"`);
          }
        }
      }
      
      expect(violations, `Icons missing aria-hidden:\n${violations.join('\n')}`).toHaveLength(0);
    });
  });
});
