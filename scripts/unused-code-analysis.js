#!/usr/bin/env node

/**
 * Unused Code Analysis Script
 * 
 * This script runs various tools to detect unused code in the Insomnia codebase.
 * It provides a comprehensive analysis including:
 * - Unused exports in TypeScript files
 * - Unused dependencies in package.json files
 * - Unused imports and variables (via ESLint)
 * - Potentially unused files
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class UnusedCodeAnalyzer {
  constructor() {
    this.rootDir = path.resolve(__dirname, '..');
    this.packagesDir = path.join(this.rootDir, 'packages');
    this.results = {
      unusedExports: [],
      unusedDependencies: [],
      unusedFiles: [],
      eslintIssues: [],
      summary: {}
    };
  }

  log(message) {
    console.log(`[UnusedCodeAnalyzer] ${message}`);
  }

  error(message) {
    console.error(`[UnusedCodeAnalyzer] ERROR: ${message}`);
  }

  /**
   * Check if a command exists in the system
   */
  commandExists(command) {
    try {
      execSync(`which ${command}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Run a command and capture output
   */
  runCommand(command, options = {}) {
    try {
      const result = execSync(command, { 
        encoding: 'utf8', 
        cwd: this.rootDir,
        ...options 
      });
      return { success: true, output: result };
    } catch (error) {
      return { 
        success: false, 
        output: error.stdout || '', 
        error: error.stderr || error.message 
      };
    }
  }

  /**
   * Analyze unused exports using ts-unused-exports
   */
  async analyzeUnusedExports() {
    this.log('Analyzing unused exports...');
    
    if (!this.commandExists('npx')) {
      this.error('npx not found. Please install Node.js and npm.');
      return;
    }

    // Check each package for unused exports
    const packages = fs.readdirSync(this.packagesDir).filter(dir => {
      const packagePath = path.join(this.packagesDir, dir);
      return fs.statSync(packagePath).isDirectory() && 
             fs.existsSync(path.join(packagePath, 'package.json'));
    });

    for (const pkg of packages) {
      const packagePath = path.join(this.packagesDir, pkg);
      const tsconfigPath = path.join(packagePath, 'tsconfig.json');
      
      if (fs.existsSync(tsconfigPath)) {
        this.log(`Checking unused exports in ${pkg}...`);
        
        const result = this.runCommand(
          `npx ts-unused-exports ${tsconfigPath} --ignoreFiles="**/*.test.*" --ignoreFiles="**/*.spec.*"`,
          { cwd: packagePath }
        );
        
        if (result.success && result.output.trim()) {
          this.results.unusedExports.push({
            package: pkg,
            issues: result.output.trim().split('\n').filter(line => line.trim())
          });
        }
      }
    }
  }

  /**
   * Analyze unused dependencies using depcheck
   */
  async analyzeUnusedDependencies() {
    this.log('Analyzing unused dependencies...');
    
    // Check root package.json
    const result = this.runCommand('npx depcheck --json');
    
    if (result.success) {
      try {
        const depcheckResult = JSON.parse(result.output);
        if (depcheckResult.dependencies.length > 0 || depcheckResult.devDependencies.length > 0) {
          this.results.unusedDependencies.push({
            package: 'root',
            unused: depcheckResult.dependencies,
            unusedDev: depcheckResult.devDependencies,
            missing: depcheckResult.missing
          });
        }
      } catch (parseError) {
        this.error(`Failed to parse depcheck output: ${parseError.message}`);
      }
    }

    // Check each package
    const packages = fs.readdirSync(this.packagesDir).filter(dir => {
      const packagePath = path.join(this.packagesDir, dir);
      return fs.statSync(packagePath).isDirectory() && 
             fs.existsSync(path.join(packagePath, 'package.json'));
    });

    for (const pkg of packages) {
      const packagePath = path.join(this.packagesDir, pkg);
      this.log(`Checking dependencies in ${pkg}...`);
      
      const result = this.runCommand('npx depcheck --json', { cwd: packagePath });
      
      if (result.success) {
        try {
          const depcheckResult = JSON.parse(result.output);
          if (depcheckResult.dependencies.length > 0 || depcheckResult.devDependencies.length > 0) {
            this.results.unusedDependencies.push({
              package: pkg,
              unused: depcheckResult.dependencies,
              unusedDev: depcheckResult.devDependencies,
              missing: depcheckResult.missing
            });
          }
        } catch (parseError) {
          this.error(`Failed to parse depcheck output for ${pkg}: ${parseError.message}`);
        }
      }
    }
  }

  /**
   * Analyze unused files using unimported
   */
  async analyzeUnusedFiles() {
    this.log('Analyzing unused files...');
    
    // Check each package for unused files
    const packages = fs.readdirSync(this.packagesDir).filter(dir => {
      const packagePath = path.join(this.packagesDir, dir);
      return fs.statSync(packagePath).isDirectory() && 
             fs.existsSync(path.join(packagePath, 'package.json'));
    });

    for (const pkg of packages) {
      const packagePath = path.join(this.packagesDir, pkg);
      this.log(`Checking unused files in ${pkg}...`);
      
      const result = this.runCommand('npx unimported', { cwd: packagePath });
      
      if (result.success && result.output.trim()) {
        const lines = result.output.trim().split('\n');
        const unusedFiles = lines.filter(line => 
          line.includes('.ts') || line.includes('.tsx') || 
          line.includes('.js') || line.includes('.jsx')
        );
        
        if (unusedFiles.length > 0) {
          this.results.unusedFiles.push({
            package: pkg,
            files: unusedFiles
          });
        }
      }
    }
  }

  /**
   * Run ESLint to check for unused variables and imports
   */
  async analyzeWithESLint() {
    this.log('Running ESLint analysis for unused code...');
    
    const result = this.runCommand(
      'npx eslint . --ext .js,.ts,.tsx --format json --rule "no-unused-vars: error" --rule "@typescript-eslint/no-unused-vars: error"'
    );
    
    if (result.success && result.output.trim()) {
      try {
        const eslintResults = JSON.parse(result.output);
        const unusedIssues = eslintResults.filter(file => 
          file.messages.some(msg => 
            msg.ruleId === 'no-unused-vars' || 
            msg.ruleId === '@typescript-eslint/no-unused-vars'
          )
        );
        
        this.results.eslintIssues = unusedIssues;
      } catch (parseError) {
        this.error(`Failed to parse ESLint output: ${parseError.message}`);
      }
    }
  }

  /**
   * Generate summary of findings
   */
  generateSummary() {
    const summary = {
      unusedExportsCount: this.results.unusedExports.reduce((sum, pkg) => sum + pkg.issues.length, 0),
      unusedDependenciesCount: this.results.unusedDependencies.reduce((sum, pkg) => 
        sum + pkg.unused.length + pkg.unusedDev.length, 0),
      unusedFilesCount: this.results.unusedFiles.reduce((sum, pkg) => sum + pkg.files.length, 0),
      eslintIssuesCount: this.results.eslintIssues.reduce((sum, file) => 
        sum + file.messages.filter(msg => 
          msg.ruleId === 'no-unused-vars' || 
          msg.ruleId === '@typescript-eslint/no-unused-vars'
        ).length, 0)
    };

    this.results.summary = summary;
  }

  /**
   * Generate detailed report
   */
  generateReport() {
    const report = [];
    
    report.push('# Unused Code Analysis Report\n');
    report.push(`Generated on: ${new Date().toISOString()}\n`);
    
    // Summary
    report.push('## Summary\n');
    report.push(`- Unused exports: ${this.results.summary.unusedExportsCount}`);
    report.push(`- Unused dependencies: ${this.results.summary.unusedDependenciesCount}`);
    report.push(`- Unused files: ${this.results.summary.unusedFilesCount}`);
    report.push(`- ESLint unused variable issues: ${this.results.summary.eslintIssuesCount}\n`);
    
    // Unused exports
    if (this.results.unusedExports.length > 0) {
      report.push('## Unused Exports\n');
      this.results.unusedExports.forEach(pkg => {
        report.push(`### Package: ${pkg.package}\n`);
        pkg.issues.forEach(issue => {
          report.push(`- ${issue}`);
        });
        report.push('');
      });
    }
    
    // Unused dependencies
    if (this.results.unusedDependencies.length > 0) {
      report.push('## Unused Dependencies\n');
      this.results.unusedDependencies.forEach(pkg => {
        report.push(`### Package: ${pkg.package}\n`);
        if (pkg.unused.length > 0) {
          report.push('**Dependencies:**');
          pkg.unused.forEach(dep => report.push(`- ${dep}`));
        }
        if (pkg.unusedDev.length > 0) {
          report.push('**Dev Dependencies:**');
          pkg.unusedDev.forEach(dep => report.push(`- ${dep}`));
        }
        report.push('');
      });
    }
    
    // Unused files
    if (this.results.unusedFiles.length > 0) {
      report.push('## Unused Files\n');
      this.results.unusedFiles.forEach(pkg => {
        report.push(`### Package: ${pkg.package}\n`);
        pkg.files.forEach(file => {
          report.push(`- ${file}`);
        });
        report.push('');
      });
    }
    
    return report.join('\n');
  }

  /**
   * Run complete analysis
   */
  async analyze() {
    this.log('Starting unused code analysis...');
    
    try {
      await this.analyzeUnusedExports();
      await this.analyzeUnusedDependencies();
      await this.analyzeUnusedFiles();
      await this.analyzeWithESLint();
      
      this.generateSummary();
      
      const report = this.generateReport();
      
      // Write report to file
      const reportPath = path.join(this.rootDir, 'unused-code-report.md');
      fs.writeFileSync(reportPath, report);
      
      this.log(`Analysis complete! Report saved to: ${reportPath}`);
      
      // Print summary to console
      console.log('\n' + '='.repeat(50));
      console.log('UNUSED CODE ANALYSIS SUMMARY');
      console.log('='.repeat(50));
      console.log(`Unused exports: ${this.results.summary.unusedExportsCount}`);
      console.log(`Unused dependencies: ${this.results.summary.unusedDependenciesCount}`);
      console.log(`Unused files: ${this.results.summary.unusedFilesCount}`);
      console.log(`ESLint issues: ${this.results.summary.eslintIssuesCount}`);
      console.log('='.repeat(50));
      
      return this.results;
      
    } catch (error) {
      this.error(`Analysis failed: ${error.message}`);
      throw error;
    }
  }
}

// CLI execution
if (require.main === module) {
  const analyzer = new UnusedCodeAnalyzer();
  analyzer.analyze().catch(error => {
    console.error('Analysis failed:', error);
    process.exit(1);
  });
}

module.exports = UnusedCodeAnalyzer;