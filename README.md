# Cypress Translation Checker

A Cypress plugin that automatically validates translations on every page load. No need to write specific tests - just configure once and every `cy.visit()` will check for translation issues.

## Features

- **Automatic Detection**: Checks for translation issues on every page load without writing specific tests
- **Zero Test Changes**: Just use `cy.visit()` normally - translation checking happens automatically
- **Separate Validation Test**: Translation issues don't fail your functional tests - they're reported in a dedicated validation test
- **Pattern Matching**: Configurable patterns to detect various translation key formats ({{key}}, i18n.key, $t('key'), etc.)
- **Smart Exclusions**: Exclude specific elements or areas from checking
- **Detailed Reporting**: Clear error messages with XPath locations
- **Highly Configurable**: Customize patterns, exclusions, and behavior
- **Attribute Checking**: Validates translations in attributes like placeholder, title, alt, etc.
- **Authentication-Friendly**: Checks during initial page visit, works with authenticated pages

## How It Works

1. Configure once in your `cypress/support/e2e.js` file
2. Write normal tests - just use `cy.visit()` as usual
3. Every page load is automatically validated for translation issues
4. Results are collected and reported in a separate validation test
5. Your functional tests continue normally - translation issues don't break them

## Installation

Install via npm:

```bash
npm install --save-dev cypress-translation-checker
```

Or with yarn:

```bash
yarn add -D cypress-translation-checker
```

### Configure Cypress

**1. Update `cypress.config.js`:**

Add task registration for cross-spec data persistence:

```javascript
const { defineConfig } = require('cypress');

// Global storage for translation results (persists across spec files)
const translationResults = new Map();

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Register tasks for storing and retrieving translation results
      on('task', {
        storeTranslationResult({ url, errors, testContext }) {
          translationResults.set(url, { url, errors, testContext });
          return null;
        },
        getTranslationResults() {
          return Array.from(translationResults.values());
        },
        clearTranslationResults() {
          translationResults.clear();
          return null;
        }
      });
      
      return config;
    },
  },
});
```

**2. Update `cypress/support/e2e.js`:**

Enable automatic translation checking with your configuration:

```javascript
import { enableAutoTranslationCheck } from 'cypress-translation-checker/commands';

enableAutoTranslationCheck({
  patterns: [
    /\{\{.*?\}\}/,           // {{key}} or {{namespace.key}}
    /\[\[.*?\]\]/,           // [[key]]
    /i18n\./,                // i18n.key
    /^[A-Z_]+\.[A-Z_]+/,     // NAMESPACE.KEY
    /\$t\(.*?\)/,            // $t('key')
  ],
  excludeSelectors: [
    'script',
    'style',
    'noscript',
    '[data-translation-ignore]',
    '.translation-ignore'
  ],
  checkAttributes: ['placeholder', 'title', 'alt', 'aria-label'],
  waitTime: 500
});
```

**3. Create `cypress/e2e/zz-translation-validation.cy.js`:**

This test file will report all translation issues found during your functional tests. The `zz-` prefix ensures it runs last:

```javascript
import { createTranslationValidationTests } from 'cypress-translation-checker/commands';

createTranslationValidationTests();
```

## Usage

### Basic Usage

Once configured, just write normal Cypress tests. Translation checking happens automatically:

```javascript
describe('My Application', () => {
  it('should load homepage', () => {
    cy.visit('/');  // Translation check happens automatically
    cy.get('h1').should('be.visible');
    // Test continues normally
  });
  
  it('should navigate to dashboard', () => {
    cy.visit('/dashboard');  // Also checked automatically
    cy.get('.dashboard-content').should('exist');
  });
});
```

### How It Works

1. When you call `cy.visit()`, the plugin automatically checks the page for translation issues
2. Issues are stored in Node.js (via Cypress tasks) to persist across test files
3. Your functional tests continue running normally - they never fail due to translation issues
4. After all functional tests complete, `zz-translation-validation.cy.js` runs
5. This validation test retrieves all collected results and reports any translation issues
6. If translation issues exist, only the validation test fails

### Excluding Elements

Use the `data-translation-ignore` attribute to exclude specific elements:

```html
<!-- Using data attribute -->
<div data-translation-ignore>
  This won't be checked: {{debug.key}}
</div>

<!-- Using CSS class -->
<div class="translation-ignore">
  Development info: i18n.dev.key
</div>
```

Or configure exclusions globally:

```javascript
enableAutoTranslationCheck({
  excludeSelectors: [
    '.debug-panel',
    '[data-test-id]',
    '#developer-console',
    'code',
    'pre'
  ]
});
```

## Configuration Options

All configuration options for `enableAutoTranslationCheck()`:

| Option             | Type                  | Default   | Description                                          |
| ------------------ | --------------------- | --------- | ---------------------------------------------------- |
| `patterns`         | Array<string\|RegExp> | See below | Patterns to detect untranslated keys                 |
| `excludeSelectors` | Array<string>         | See below | CSS selectors to exclude from checking               |
| `allowedKeys`      | Array<string>         | `[]`      | Specific translation keys that are allowed to show   |
| `checkAttributes`  | Array<string>         | See below | HTML attributes to check for translations            |
| `waitTime`         | number                | `500`     | Milliseconds to wait after page load before checking |

### Default Patterns

The plugin detects these common translation patterns:

```javascript
patterns: [
  /\{\{.*?\}\}/,           // {{key}} or {{namespace.key}}
  /\[\[.*?\]\]/,           // [[key]]
  /i18n\./,                // i18n.key
  /^[A-Z_]+\.[A-Z_]+/,     // NAMESPACE.KEY
  /\$t\(.*?\)/,            // $t('key')
]
```

### Default Exclude Selectors

```javascript
excludeSelectors: [
  'script',
  'style',
  'noscript',
  '[data-translation-ignore]',
  '.translation-ignore'
]
```

### Default Attributes Checked

```javascript
checkAttributes: ['placeholder', 'title', 'alt', 'aria-label']
```

## Advanced Usage

### Manual Checking with `cy.checkTranslations()`

If you need manual control over when translation checking happens:

```javascript
it('should validate translations manually', () => {
  cy.visit('/page');
  
  // Manual check with custom options
  cy.checkTranslations({
    patterns: [/\{\{.*?\}\}/],
    failOnError: false,
    logErrors: false
  }).then((errors) => {
    // Custom logic based on errors
    if (errors.length > 0) {
      const criticalErrors = errors.filter(e => 
        !e.text.includes('OPTIONAL')
      );
      
      expect(criticalErrors).to.have.length(0);
    }
  });
});
```

### Custom Patterns for Your Translation System

Adjust patterns to match your specific translation format:

```javascript
// For Angular with ngx-translate
enableAutoTranslationCheck({
  patterns: [
    /\{\{\s*'[^']+'\s*\|\s*translate\s*\}\}/,  // {{ 'key' | translate }}
    /translate>\s*[A-Z_\.]+/                    // translate>KEY.NAME
  ]
});

// For React with react-i18next
enableAutoTranslationCheck({
  patterns: [
    /\{t\(['"].*?['"]\)\}/,     // {t('key')}
    /i18nKey=['"][^'"]+['"]/    // i18nKey="key"
  ]
});

// For Vue.js with vue-i18n
enableAutoTranslationCheck({
  patterns: [
    /\{\{\s*\$t\(['"].*?['"]\)\s*\}\}/,  // {{ $t('key') }}
    /v-t=['"][^'"]+['"]/                  // v-t="key"
  ]
});
```

### Environment-Specific Configuration

Configure differently for development vs production:

```javascript
const isProduction = Cypress.env('environment') === 'production';

enableAutoTranslationCheck({
  // More exclusions in development
  excludeSelectors: isProduction
    ? ['script', 'style']
    : ['script', 'style', '.dev-tools', '[data-testid]', '.debug-panel'],
  
  // Allow more time in production
  waitTime: isProduction ? 1000 : 500,
  
  // Allow certain keys that might appear during development
  allowedKeys: isProduction ? [] : ['DEV.MODE', 'DEBUG.INFO']
});
```

## Common Translation Patterns Detected

The plugin can detect these common issues:

- `{{user.name}}` - Handlebars/Angular/Vue style
- `[[user.name]]` - Custom bracket notation
- `i18n.user.name` - Direct i18n object references
- `USER.NAME` - Uppercase key constants
- `$t('user.name')` - i18next function calls not evaluated
- `t('user.name')` - Generic translation function
- `{translate key='user.name'}` - Template syntax

## Error Output

When translation issues are found, you'll see detailed error messages:

```
=== Translation Issues Found ===

1. TEXT ISSUE:
   Element: BUTTON
   Text: "{{auth.login}}"
   XPath: /html/body/div[1]/header/button[2]

2. ATTRIBUTE ISSUE:
   Attribute: placeholder
   Element: INPUT
   Text: "i18n.search.placeholder"
   XPath: //*[@id="search-input"]

Total issues found: 2
```

## Tips

1. **Start Lenient**: Begin with `failOnError: false` to see what gets detected
2. **Refine Patterns**: Adjust patterns to match your specific translation system
3. **Use Exclusions**: Exclude debug panels, test IDs, and code examples
4. **Wait for SPAs**: Increase `waitTime` for single-page apps that render client-side
5. Error Reporting

When translation issues are detected, the validation test will fail with detailed output:

```
=== Translation Validation Summary ===

http://localhost:8080/ - 5 issue(s) (from test: "should load homepage"):
  1. text: "{{user.name}}" in <SPAN>
     XPath: /html/body/div[1]/header/span
  2. attribute: "placeholder" in <INPUT>
     Attribute: placeholder
     XPath: //*[@id="search-input"]
  3. text: "i18n.common.loading" in <DIV>
     XPath: /html/body/div[2]/div[1]

http://localhost:8080/dashboard - 2 issue(s) (from test: "should navigate to dashboard"):
  1. text: "DASHBOARD.TITLE" in <H1>
     XPath: /html/body/main/h1
  2. text: "$t('actions.save')" in <BUTTON>
     XPath: /html/body/main/form/button

Summary: 7 issue(s) found across 2 page(s) out of 3 visited
```

## Detected Translation Patterns

The plugin can detect these common untranslated patterns:

- `{{user.name}}` - Handlebars/Angular/Vue style
- `[[user.name]]` - Custom bracket notation
- `i18n.user.name` - Direct i18n object references
- `USER.NAME` - Uppercase key constants
- `$t('user.name')` - i18next function calls not evaluated
- `t('user.name')` - Generic translation function
- `{translate key='user.name'}` - Template syntax

## Troubleshooting

### False Positives

If you're getting false positives:

1. Add the element to `excludeSelectors`:
   ```javascript
   excludeSelectors: ['.debug-panel', '[data-testid]']
   ```

2. Add specific keys to `allowedKeys`:
   ```javascript
   allowedKeys: ['BRAND.NAME', 'API.ENDPOINT']
   ```

3. Use `data-translation-ignore` attribute:
   ```html
   <div data-translation-ignore>{{debug.info}}</div>
   ```

4. Adjust patterns to be more specific:
   ```javascript
   patterns: [/\{\{[a-z]+\.[a-z]+\}\}/]
   ```

### Issues Not Being Detected

If translation issues aren't being detected:

1. Verify plugin is imported in `cypress/support/e2e.js`
2. Check patterns match your translation format
3. Increase `waitTime` for dynamic content:
   ```javascript
   enableAutoTranslationCheck({ waitTime: 1000 })
   ```
4. Verify tasks are registered in `cypress.config.js`
5. Check browser console for errors during test execution

### Validation Test Shows 0 Pages

If `zz-translation-validation.cy.js` shows "0 pages":

1. Ensure tasks are properly registered in `cypress.config.js`
2. Verify `enableAutoTranslationCheck()` is called in `cypress/support/e2e.js`
3. Make sure your functional tests call `cy.visit()` to load pages
4. Check that functional tests run before the validation test (use `zz-` prefix)

## Best Practices

1. **Start Lenient**: Begin by reviewing detected issues without failing tests
2. **Refine Patterns**: Adjust patterns to match your specific translation system
3. **Use Exclusions**: Exclude debug panels, test IDs, and code examples
4. **Wait for SPAs**: Increase `waitTime` for single-page apps that render client-side
5. **Allow Brand Names**: Add brand names or acronyms to `allowedKeys` if they match patterns
6. **Run Validation Last**: Use `zz-` prefix for validation test to ensure it runs after functional tests

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes.
