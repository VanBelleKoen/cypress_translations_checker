# Cypress Translation Checker

A Cypress plugin that automatically validates translations **on every page navigation**. No need to write specific tests - just configure once and the plugin automatically checks for translation issues on every page, whether you navigate via `cy.visit()`, `cy.click()`, or any other method. Perfect for catching untranslated content without interrupting your functional test flow.

## Quick Example

```javascript
// ❌ WITHOUT this plugin - manual checks everywhere
it('user signup flow', () => {
  cy.visit('/');
  cy.checkTranslations();  // Manual
  cy.get('.signup-btn').click();
  cy.checkTranslations();  // Manual
  cy.get('input[name="email"]').type('user@example.com');
  cy.get('.submit').click();
  cy.checkTranslations();  // Manual
  // Repetitive and easy to forget!
});

// ✅ WITH this plugin - completely automatic
it('user signup flow', () => {
  cy.visit('/');  // ✅ Auto-checked
  cy.get('.signup-btn').click();  // ✅ Auto-checked (new page detected!)
  cy.get('input[name="email"]').type('user@example.com');
  cy.get('.submit').click();  // ✅ Auto-checked (confirmation page)
  // All pages validated - zero extra code!
});
```

**Result**: Write normal tests. Get translation validation for free. 🎉

## Features

- **🚀 Automatic Navigation Detection**: Intelligently detects ALL page navigations - `cy.visit()`, `cy.click()`, programmatic navigation, etc.
- **✨ Zero Test Changes**: Write tests exactly as you normally would - translation checking happens invisibly in the background
- **🎯 Smart Detection**: Automatically checks translations on every new page load without duplicate checks
- **🔒 Non-Invasive**: Your functional tests never fail due to translation issues - they're reported in a separate validation test
- **⚡ Real-Time Tracking**: Works seamlessly with single-page applications and complex navigation flows
- **Pattern Matching**: Configurable patterns to detect various translation key formats ({{key}}, i18n.key, $t('key'), etc.)
- **Smart Exclusions**: Exclude specific elements or areas from checking
- **Detailed Reporting**: Clear error messages with XPath locations
- **Highly Configurable**: Customize patterns, exclusions, and behavior
- **Attribute Checking**: Validates translations in attributes like placeholder, title, alt, etc.
- **Authentication-Friendly**: Checks during initial page visit, works with authenticated pages

## How It Works

1. **One-Time Setup**: Configure the plugin once in your `cypress/support/e2e.js` file
2. **Write Tests Normally**: Use `cy.visit()`, `cy.click()`, and any other commands exactly as you always do
3. **Automatic Detection**: The plugin listens to Cypress events to detect URL changes without modifying commands
4. **Intelligent Tracking**: Each unique URL is checked once per test - no duplicate checks
5. **Separate Reporting**: All translation issues are collected and reported in a dedicated validation test
6. **No Test Disruption**: Your functional tests pass/fail based on their own assertions - translation issues never interfere

## Why This Matters

### The Problem This Solves

In traditional approaches, you'd need to:
- Manually add translation checks to every test
- Remember to check after every navigation
- Write specific tests for translation validation
- Maintain checks as your app grows

**Example of the old way:**
```javascript
it('user workflow', () => {
  cy.visit('/');
  cy.checkTranslations();  // ❌ Manual check
  
  cy.get('.login').click();
  cy.checkTranslations();  // ❌ Manual check
  
  // ... more steps
  cy.checkTranslations();  // ❌ Manual check
  // Lots of repetitive code!
});
```

### The Solution

With this plugin, translation validation happens **completely automatically**:

```javascript
it('user workflow', () => {
  cy.visit('/');  // ✅ Auto-checked
  cy.get('.login').click();  // ✅ Auto-checked
  cy.get('.dashboard-link').click();  // ✅ Auto-checked
  cy.get('.profile').click();  // ✅ Auto-checked
  // Zero translation-specific code - all pages validated!
});
```

### Real-World Impact

- **97% less code**: No manual translation checks in your tests
- **100% coverage**: Never forget to check a page - every navigation is automatic
- **Zero maintenance**: Add new pages/flows without updating translation tests
- **Faster development**: Focus on functionality, not translation validation
- **Better CI/CD**: Catch translation issues early without slowing down functional tests

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

Once configured, just write normal Cypress tests. Translation checking happens automatically on **every navigation**:

```javascript
describe('My Application', () => {
  it('should load homepage', () => {
    cy.visit('/');  // ✅ Automatically checked
    cy.get('h1').should('be.visible');
  });
  
  it('should navigate to dashboard', () => {
    cy.visit('/dashboard');  // ✅ Automatically checked
    cy.get('.dashboard-content').should('exist');
  });
  
  it('should navigate via click', () => {
    cy.visit('/');  // ✅ Checked
    cy.get('a[href="/about"]').click();  // ✅ NEW PAGE AUTOMATICALLY CHECKED!
    cy.get('.about-content').should('exist');
  });
  
  it('should complete multi-step workflow', () => {
    cy.visit('/');  // ✅ Checked
    cy.get('.login-button').click();  // ✅ Login page checked
    
    cy.get('input[name="email"]').type('user@example.com');
    cy.get('input[name="password"]').type('password');
    cy.get('button[type="submit"]').click();  // ✅ Dashboard checked
    
    cy.get('.profile-link').click();  // ✅ Profile page checked
    
    // All 4 pages automatically validated for translations!
    // Zero additional code required!
  });
});
```

### 🎯 Key Feature: Automatic Click Navigation Detection

**Before this plugin:**
```javascript
// You had to manually check translations after clicks
cy.visit('/');
cy.get('.nav-link').click();
cy.checkTranslations();  // Manual check needed
```

**With this plugin:**
```javascript
// Translation checking is completely automatic
cy.visit('/');
cy.get('.nav-link').click();  // Translation check happens automatically!
// No additional code needed - just write normal tests
```

The plugin automatically:
- Detects when `cy.click()` navigates to a new page
- Waits for the page to load
- Checks for translation issues
- Stores results for validation
- Prevents duplicate checks on the same URL

This is **especially powerful for**:
- Single-page applications with client-side routing
- Multi-step user workflows (signup → verification → onboarding)
- E-commerce flows (product → cart → checkout → confirmation)  
- Navigation-heavy applications with many pages

### Technical Details

1. The plugin listens to Cypress's `url:changed` event to detect any navigation
2. No command overwrites - `cy.visit()`, `cy.click()`, and all other commands work normally
3. Translation checks are performed in `afterEach` hooks after URL changes are detected
4. Duplicate checks on the same URL within a test are automatically prevented
5. Issues are stored in Node.js (via Cypress tasks) to persist across test files
6. Your functional tests continue running normally - they never fail due to translation issues
7. After all functional tests complete, `zz-translation-validation.cy.js` runs
8. This validation test retrieves all collected results and reports any translation issues
9. If translation issues exist, only the validation test fails

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

You can also manually check after specific actions:

```javascript
it('should check after form submission', () => {
  cy.visit('/form');
  cy.get('input[name="email"]').type('test@example.com');
  cy.get('button[type="submit"]').click();
  
  // Manually trigger translation check
  cy.checkTranslations({
    failOnError: false,
    logErrors: false
  }).then((errors) => {
    cy.task('storeTranslationResult', {
      url: window.location.href,
      errors: errors,
      testContext: Cypress.currentTest.title
    });
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

### 1. Write Tests Naturally
- **Don't change your test style**: Write tests exactly as you normally would
- **No special syntax needed**: `cy.click()` automatically detects navigation
- **Focus on functionality**: Let the plugin handle translation validation

### 2. Leverage Automatic Detection
- **Test user journeys**: Complex multi-step workflows are now easy to validate
- **Click through your app**: Every page visited via click is automatically checked
- **No manual tracking**: The plugin tracks all navigations for you

### 3. Configuration
- **Start lenient**: Begin with `failOnError: false` to review detected issues
- **Refine patterns**: Adjust patterns to match your specific translation system
- **Exclude wisely**: Exclude debug panels, test IDs, and code examples
- **Tune `waitTime`**: Increase for SPAs (1000ms+), decrease for static sites (300ms)

### 4. Organization
- **Run validation last**: Use `zz-` prefix for validation test to ensure it runs after functional tests
- **Group by feature**: Organize tests by user flows - all pages in the flow are validated
- **Allow exceptions**: Add brand names or acronyms to `allowedKeys` if they match patterns

### 5. Optimization
- **Trust the system**: Don't add manual `cy.checkTranslations()` calls unless needed
- **One visit per test**: Each unique URL is checked once automatically - no need to revisit
- **Review validation output**: Check the `zz-translation-validation.cy.js` results regularly

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes.
