const UnusedCodeAnalyzer = require('../scripts/unused-code-analysis.js');
const fs = require('fs');
const path = require('path');

describe('Unused Code Analyzer', () => {
  let analyzer;
  
  beforeEach(() => {
    analyzer = new UnusedCodeAnalyzer();
  });

  test('should create analyzer instance', () => {
    expect(analyzer).toBeDefined();
    expect(analyzer.rootDir).toBeDefined();
    expect(analyzer.packagesDir).toBeDefined();
    expect(analyzer.results).toBeDefined();
  });

  test('should have correct root directory', () => {
    const expectedRootDir = path.resolve(__dirname, '..');
    expect(analyzer.rootDir).toBe(expectedRootDir);
  });

  test('should initialize results structure', () => {
    expect(analyzer.results).toEqual({
      unusedExports: [],
      unusedDependencies: [],
      unusedFiles: [],
      eslintIssues: [],
      summary: {}
    });
  });

  test('should detect command availability', () => {
    const nodeExists = analyzer.commandExists('node');
    expect(nodeExists).toBe(true);
    
    const fakeCommandExists = analyzer.commandExists('nonexistentcommand12345');
    expect(fakeCommandExists).toBe(false);
  });

  test('should run commands and capture output', () => {
    const result = analyzer.runCommand('echo "test"');
    expect(result.success).toBe(true);
    expect(result.output.trim()).toBe('test');
  });

  test('should handle command failures', () => {
    const result = analyzer.runCommand('nonexistentcommand12345');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('should generate summary correctly', () => {
    // Mock some results
    analyzer.results.unusedExports = [
      { package: 'test1', issues: ['issue1', 'issue2'] },
      { package: 'test2', issues: ['issue3'] }
    ];
    analyzer.results.unusedDependencies = [
      { package: 'test1', unused: ['dep1'], unusedDev: ['dep2'] }
    ];
    analyzer.results.unusedFiles = [
      { package: 'test1', files: ['file1.ts', 'file2.ts'] }
    ];
    analyzer.results.eslintIssues = [
      { 
        messages: [
          { ruleId: '@typescript-eslint/no-unused-vars' },
          { ruleId: 'other-rule' },
          { ruleId: 'no-unused-vars' }
        ]
      }
    ];

    analyzer.generateSummary();

    expect(analyzer.results.summary.unusedExportsCount).toBe(3);
    expect(analyzer.results.summary.unusedDependenciesCount).toBe(2);
    expect(analyzer.results.summary.unusedFilesCount).toBe(2);
    expect(analyzer.results.summary.eslintIssuesCount).toBe(2);
  });

  test('should generate report with summary', () => {
    analyzer.results.summary = {
      unusedExportsCount: 5,
      unusedDependenciesCount: 3,
      unusedFilesCount: 2,
      eslintIssuesCount: 10
    };

    const report = analyzer.generateReport();
    
    expect(report).toContain('# Unused Code Analysis Report');
    expect(report).toContain('Generated on:');
    expect(report).toContain('Unused exports: 5');
    expect(report).toContain('Unused dependencies: 3');
    expect(report).toContain('Unused files: 2');
    expect(report).toContain('ESLint unused variable issues: 10');
  });

  test('should include packages directory in configuration', () => {
    const expectedPackagesDir = path.join(analyzer.rootDir, 'packages');
    expect(analyzer.packagesDir).toBe(expectedPackagesDir);
  });
});