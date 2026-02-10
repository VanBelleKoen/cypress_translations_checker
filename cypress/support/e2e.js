/**
 * Cypress support file - Import the translation checker
 */

// Import commands
import '../../commands';

// Enable automatic translation checking on every page load
import { enableAutoTranslationCheck } from '../../commands';

// Configure and enable automatic tracking of visited pages
// This tracks all pages visited during tests but won't fail your functional tests
// Translation validation happens in a separate test (zz-translation-validation.cy.js)
enableAutoTranslationCheck({
  // Wait time after page load before checking (in ms)
  waitTime: 500,

  // Patterns to detect untranslated content
  patterns: [
    /\{\{.*?\}\}/,           // {{key}}
    /\[\[.*?\]\]/,           // [[key]]
    /i18n\./,                // i18n.key
    /^[A-Z_]+\.[A-Z_]+/,     // NAMESPACE.KEY
    /\$t\(.*?\)/,            // $t('key')
  ],

  // Elements to exclude from checking
  excludeSelectors: [
    'script',
    'style',
    'noscript',
    '[data-translation-ignore]',
    '.translation-ignore',
    'code',
    'pre'
  ],

  // Whether to log errors to console
  logErrors: true,

  // Specific keys that are allowed to show (e.g., brand names)
  allowedKeys: [],

  // Attributes to check for translation issues
  checkAttributes: ['placeholder', 'title', 'alt', 'aria-label']
});
