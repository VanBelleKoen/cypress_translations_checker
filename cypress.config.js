const { defineConfig } = require('cypress');

// Global storage for translation results (persists across spec files)
const translationResults = new Map();

module.exports = defineConfig({
  e2e: {
    // No baseUrl - tests will use relative paths from projectRoot
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
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
