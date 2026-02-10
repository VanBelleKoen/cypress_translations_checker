/**
 * Cypress Translation Checker Plugin
 * Main entry point for the plugin
 */

module.exports = {
  /**
   * Configuration options for the translation checker
   * @param {Object} config - Plugin configuration
   * @param {Array<string|RegExp>} config.patterns - Patterns to detect untranslated keys (e.g., ['{{', 'i18n.', /^\[.*\]$/])
   * @param {Array<string>} config.excludeSelectors - CSS selectors to exclude from checking
   * @param {boolean} config.failOnError - Whether to fail the test on translation errors (default: true)
   * @param {boolean} config.logErrors - Whether to log errors to console (default: true)
   * @param {Array<string>} config.allowedKeys - Specific translation keys that are allowed to show
   */
  defaultConfig: {
    patterns: [
      /\{\{.*?\}\}/,           // Matches {{key}} or {{namespace.key}}
      /\[\[.*?\]\]/,           // Matches [[key]]
      /i18n\./,                // Matches i18n.key
      /^[A-Z_]+\.[A-Z_]+/,     // Matches NAMESPACE.KEY
      /\$t\(.*?\)/,            // Matches $t('key')
    ],
    excludeSelectors: [
      'script',
      'style',
      'noscript',
      '[data-translation-ignore]',
      '.translation-ignore'
    ],
    failOnError: true,
    logErrors: true,
    allowedKeys: [],
    checkAttributes: ['placeholder', 'title', 'alt', 'aria-label'],
  }
};
