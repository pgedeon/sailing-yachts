# GitHub Issue Templates Configuration
# This file contains validation rules for all issue templates

# Template Validation Rules
templates:
  auto_build_task:
    required_fields:
      - description
      - priority
      - acceptance
      - checklist
    validation_checks:
      - description must be specific and actionable
      - priority must be one of: critical, high, medium, low
      - acceptance criteria must include automated workflow steps
      - checklist must confirm all workflow rules will be followed
  
  feature_request:
    required_fields:
      - problem
      - proposed_solution
      - priority
      - phase
      - acceptance_criteria
    validation_checks:
      - problem must describe user impact
      - solution must be specific with technical details
      - priority must match actual business impact
      - phase must align with ROADMAP.md
      - acceptance criteria must be testable
  
  bug_report:
    required_fields:
      - summary
      - description
      - steps_to_reproduce
      - expected_behavior
      - severity
    validation_checks:
      - summary must be brief but clear
      - steps must be reproducible
      - expected behavior must contrast with actual
      - severity must match actual impact
      - environment info must be provided

# Automated Workflow Rules (referenced in templates)
workflow_rules:
  feature_branch_naming: "feature/issue-N-description"
  commit_format: "feat/fix/refactor: description (closes #N)"
  required_tests: "At least one Playwright E2E test"
  build_verification: "npm run typecheck && npm run build"
  pr_process: "Open PR after CI passes, then merge with --squash"
  deployment_check: "Verify Vercel deployment within 60s"
  
# Phase Definitions (from ROADMAP.md)
phases:
  phase_0:
    name: "Fix Build & CI"
    description: "Infrastructure and critical bug fixes"
    examples: ["CI workflow issues", "Vercel build errors", "TypeScript fixes"]
  phase_1:
    name: "Data & Content" 
    description: "Database expansion and content improvements"
    examples: ["Manufacturer database", "Yacht specifications", "Import scripts"]
  phase_2:
    name: "Core Features"
    description: "Core user-facing functionality"
    examples: ["Comparison tool", "Search functionality", "Responsive design"]
  phase_3:
    name: "User Features"
    description: "Enhanced user experience features"
    examples: ["Favorites", "Filtering", "Recommendations"]
  phase_4:
    name: "sailboats.fr Integration"
    description: "Integration with sailboats.fr platform"
    examples: ["Embeddable widgets", "Cross-linking", "Affiliate links"]
  phase_5:
    name: "Advanced Features"
    description: "Future capabilities and optimization"
    examples: ["Review system", "API", "Performance monitoring"]

# Priority Guidelines
priority_guidelines:
  critical:
    description: "Blocking current work or system unusable"
    examples: ["Build failures", "Security issues", "Data loss"]
  high:
    description: "Significant impact on core functionality"
    examples: ["Main features broken", "User workflow blocked"]
  medium:
    description: "Would improve user experience"
    examples: ["Enhancements", "Minor features", "UX improvements"]
  low:
    description: "Nice to have, future consideration"
    examples: ["Cosmetic changes", "Nice-to-have features", "Future enhancements"]