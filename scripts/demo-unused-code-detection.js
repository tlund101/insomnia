#!/usr/bin/env node

/**
 * Simple demonstration of unused code detection capabilities
 * Run: node scripts/demo-unused-code-detection.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Unused Code Detection Demo\n');

// Check if our configuration files exist
const configFiles = [
  '.eslintrc.js',
  'ts-unused-exports.json', 
  '.depcheckrc',
  '.unimportedrc.json'
];

console.log('Configuration Files:');
configFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

// Check if our main script exists and is executable
const mainScript = path.join(__dirname, 'unused-code-analysis.js');
const scriptExists = fs.existsSync(mainScript);
const isExecutable = scriptExists && fs.statSync(mainScript).mode & parseInt('111', 8);

console.log('\nMain Analysis Script:');
console.log(`  ${scriptExists ? '✅' : '❌'} scripts/unused-code-analysis.js exists`);
console.log(`  ${isExecutable ? '✅' : '❌'} Script is executable`);

// Test basic functionality
if (scriptExists) {
  try {
    const UnusedCodeAnalyzer = require('./unused-code-analysis.js');
    const analyzer = new UnusedCodeAnalyzer();
    
    console.log('\nBasic Functionality Test:');
    console.log('  ✅ Script loads without errors');
    console.log(`  ✅ Root directory: ${analyzer.rootDir}`);
    console.log(`  ✅ Packages directory: ${analyzer.packagesDir}`);
    
    // Test command detection
    const nodeExists = analyzer.commandExists('node');
    console.log(`  ${nodeExists ? '✅' : '❌'} Can detect Node.js`);
    
    // Test basic command execution
    const testResult = analyzer.runCommand('echo "test"');
    console.log(`  ${testResult.success ? '✅' : '❌'} Can execute commands`);
    
    console.log('\n📊 Ready to analyze unused code!');
    console.log('\nAvailable commands:');
    console.log('  npm run analyze:unused           # Full analysis');
    console.log('  npm run analyze:unused-exports   # TypeScript exports');
    console.log('  npm run analyze:unused-deps      # Dependencies');
    console.log('  npm run analyze:unused-files     # Files');
    console.log('  npm run lint:unused             # ESLint rules');
    
  } catch (error) {
    console.log('  ❌ Error loading script:', error.message);
  }
}

console.log('\n📚 Documentation: docs/UNUSED_CODE_DETECTION.md');
console.log('🔗 GitHub Actions: .github/workflows/unused-code-analysis.yml\n');