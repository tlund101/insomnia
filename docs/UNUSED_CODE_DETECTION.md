# Unused Code Detection

This document describes the unused code detection system implemented for the Insomnia project.

## Overview

The unused code detection system helps identify:
- Unused TypeScript/JavaScript exports
- Unused dependencies in package.json files  
- Unused imports and variables
- Completely unused files
- Dead code patterns

## Tools and Configuration

### 1. Comprehensive Analysis Script

Run the complete analysis with:
```bash
npm run analyze:unused
```

This script (`scripts/unused-code-analysis.js`) runs all available tools and generates a comprehensive report saved to `unused-code-report.md`.

### 2. Individual Tool Scripts

#### Unused Exports
```bash
npm run analyze:unused-exports
```
Uses `ts-unused-exports` to find unused TypeScript exports. Configuration in `ts-unused-exports.json`.

#### Unused Dependencies
```bash
npm run analyze:unused-deps
```
Uses `depcheck` to find unused dependencies. Configuration in `.depcheckrc`.

#### Unused Files
```bash
npm run analyze:unused-files
```
Uses `unimported` to find completely unused files. Configuration in `.unimportedrc.json`.

#### ESLint Unused Code Rules
```bash
npm run lint:unused
```
Runs ESLint with rules specifically for unused variables, imports, and exports.

### 3. Enhanced ESLint Configuration

The ESLint configuration has been enhanced with:
- Stricter unused variable detection (`@typescript-eslint/no-unused-vars`)
- Unused expression detection (`@typescript-eslint/no-unused-expressions`)
- Unused module detection (`import/no-unused-modules`)

Variables/parameters prefixed with `_` are ignored as they're considered intentionally unused.

## Configuration Files

### `.depcheckrc`
Configures dependency analysis:
- Ignores build tools and type packages
- Supports TypeScript and JSX parsing
- Excludes common development dependencies

### `ts-unused-exports.json`
Configures TypeScript export analysis:
- Ignores test files and stories
- Shows line numbers for better debugging
- Finds completely unused files
- Allows unused types (often used for documentation)

### `.unimportedrc.json`
Configures unused file detection:
- Defines entry points for analysis
- Ignores test files, configuration files, and type definitions
- Supports monorepo structure with multiple packages

## Usage in Development

### During Development
```bash
# Quick check for unused code issues
npm run lint:unused

# Full analysis (slower but comprehensive)
npm run analyze:unused
```

### In CI/CD
Add to your CI pipeline:
```bash
# Fail on unused code
npm run lint:unused

# Generate report for review
npm run analyze:unused
```

## Understanding the Output

### Unused Exports
Files and line numbers where exports are defined but never imported elsewhere.

### Unused Dependencies
Dependencies listed in package.json but not found in the source code.

### Unused Files
Files that exist but are never imported or required by other files.

### ESLint Issues
Variables, imports, or expressions that are defined but never used.

## Best Practices

1. **Regular Analysis**: Run unused code analysis regularly during development
2. **Review Before Deletion**: Always review suggested unused code before deletion
3. **Consider Public APIs**: Some "unused" exports might be part of public APIs
4. **Test Coverage**: Ensure good test coverage before removing code
5. **Documentation**: Some unused code might be kept for documentation purposes

## Ignoring False Positives

### In Source Code
```typescript
// For unused variables with intention
const _unusedButKeptForClarity = someValue;

// For exports that are part of public API
export { SomeFunction }; // eslint-disable-line import/no-unused-modules
```

### In Configuration
Update the respective configuration files:
- Add to `ignorePatterns` in `.unimportedrc.json`
- Add to `ignores` in `.depcheckrc`
- Add to `ignoreFiles` in `ts-unused-exports.json`

## Troubleshooting

### Missing Dependencies
If analysis tools are not installed:
```bash
npm install
# or
npm run bootstrap
```

### False Positives
Some false positives are expected:
- Dynamic imports might not be detected
- Conditional requires might appear unused
- Some build-time dependencies might appear unused

### Performance
For large codebases:
- Use individual tool scripts for targeted analysis
- Consider excluding large directories in configuration files
- Run analysis on specific packages only

## Integration with Development Workflow

### Pre-commit Hooks
Consider adding to pre-commit hooks:
```bash
npm run lint:unused
```

### IDE Integration
Most modern IDEs support ESLint integration and will highlight unused code based on the enhanced configuration.

### Code Review
Include unused code analysis in code review process:
1. Run analysis before creating pull requests
2. Review and address any newly introduced unused code
3. Document any intentionally unused code

## Maintenance

### Updating Configuration
As the project evolves, update configuration files to:
- Add new entry points
- Exclude new types of generated files
- Adjust rules based on project needs

### Tool Updates
Keep analysis tools updated:
```bash
npm update ts-unused-exports depcheck unimported
```

## Additional Resources

- [ts-unused-exports documentation](https://github.com/pzavolinsky/ts-unused-exports)
- [depcheck documentation](https://github.com/depcheck/depcheck)
- [unimported documentation](https://github.com/smeijer/unimported)
- [ESLint import plugin](https://github.com/import-js/eslint-plugin-import)