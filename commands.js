/**
 * Cypress commands for translation checking
 */

const { defaultConfig } = require('./index');

/**
 * Checks for translation issues in the current page
 * @param {Object} options - Configuration options (overrides default config)
 */
Cypress.Commands.add('checkTranslations', (options = {}) => {
  const config = { ...defaultConfig, ...options };

  cy.window().then((win) => {
    const doc = win.document;
    const errors = [];

    // Function to check if text matches any translation pattern
    const hasTranslationIssue = (text) => {
      if (!text || text.trim() === '') return false;

      // Check if it's an allowed key
      if (config.allowedKeys.some(key => text.includes(key))) {
        return false;
      }

      // Check against patterns
      return config.patterns.some(pattern => {
        if (pattern instanceof RegExp) {
          return pattern.test(text);
        }
        return text.includes(pattern);
      });
    };

    // Function to check if element should be excluded
    const shouldExclude = (element) => {
      return config.excludeSelectors.some(selector => {
        return element.matches(selector) || element.closest(selector);
      });
    };

    // Function to recursively check text nodes
    const checkNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text && hasTranslationIssue(text)) {
          const element = node.parentElement;
          if (element && !shouldExclude(element)) {
            errors.push({
              type: 'text',
              text: text,
              element: element.tagName,
              xpath: getXPath(element)
            });
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Check attributes
        config.checkAttributes.forEach(attr => {
          const value = node.getAttribute(attr);
          if (value && hasTranslationIssue(value)) {
            if (!shouldExclude(node)) {
              errors.push({
                type: 'attribute',
                attribute: attr,
                text: value,
                element: node.tagName,
                xpath: getXPath(node)
              });
            }
          }
        });

        // Check child nodes
        if (!shouldExclude(node)) {
          node.childNodes.forEach(child => checkNode(child));
        }
      }
    };

    // Helper function to get XPath
    const getXPath = (element) => {
      if (element.id) {
        return `//*[@id="${element.id}"]`;
      }

      const parts = [];
      let current = element;

      while (current && current.nodeType === Node.ELEMENT_NODE) {
        let index = 0;
        let sibling = current.previousSibling;

        while (sibling) {
          if (sibling.nodeType === Node.ELEMENT_NODE &&
            sibling.nodeName === current.nodeName) {
            index++;
          }
          sibling = sibling.previousSibling;
        }

        const tagName = current.nodeName.toLowerCase();
        const part = index > 0 ? `${tagName}[${index + 1}]` : tagName;
        parts.unshift(part);
        current = current.parentNode;
      }

      return '/' + parts.join('/');
    };

    // Start checking from body
    checkNode(doc.body);

    // Log errors if configured
    if (config.logErrors && errors.length > 0) {
      console.error('=== Translation Issues Found ===');
      errors.forEach((error, index) => {
        console.error(`\n${index + 1}. ${error.type.toUpperCase()} ISSUE:`);
        if (error.attribute) {
          console.error(`   Attribute: ${error.attribute}`);
        }
        console.error(`   Element: ${error.element}`);
        console.error(`   Text: "${error.text}"`);
        console.error(`   XPath: ${error.xpath}`);
      });
      console.error(`\nTotal issues found: ${errors.length}`);
    }

    // Fail test if configured
    if (config.failOnError && errors.length > 0) {
      throw new Error(
        `Found ${errors.length} translation issue(s) on the page. ` +
        `Check console for details.`
      );
    }

    // Return errors for further processing if needed
    return errors;
  });
});

/**
 * Automatically check translations on every page navigation
 * Uses Cypress hooks to detect page changes without overwriting commands
 * Results are stored in Node.js (via cy.task) to persist across spec files
 * @param {Object} globalOptions - Global configuration options for automatic checking
 */
export const enableAutoTranslationCheck = (globalOptions = {}) => {
  const defaultWaitTime = globalOptions.waitTime || 500;

  // Track visited URLs in the current test
  if (!Cypress.translationChecker) {
    Cypress.translationChecker = {
      visitedUrls: new Set(),
      lastUrl: null,
      pendingCheck: false
    };
  }

  /**
   * Helper function to perform translation check and store results
   */
  const performTranslationCheck = (currentUrl) => {
    // Skip if we've already checked this URL in this test
    if (Cypress.translationChecker.visitedUrls.has(currentUrl)) {
      return;
    }

    Cypress.translationChecker.visitedUrls.add(currentUrl);
    cy.log(`🔍 Checking translations for: ${currentUrl}`);

    cy.checkTranslations({
      ...globalOptions,
      failOnError: false,
      logErrors: false
    }).then((errors) => {
      const errorCount = errors.length;
      cy.log(`Found ${errorCount} translation issues`);

      // Store in Node.js via task (persists across spec files)
      cy.task('storeTranslationResult', {
        url: currentUrl,
        errors: errors,
        testContext: Cypress.currentTest.title
      }, { log: false });
    });
  };

  // Use Cypress event to detect URL changes without overwriting commands
  Cypress.on('url:changed', (newUrl) => {
    // Track that a URL change occurred
    if (Cypress.translationChecker.lastUrl !== newUrl) {
      Cypress.translationChecker.lastUrl = newUrl;
      Cypress.translationChecker.pendingCheck = true;
    }
  });

  // Use afterEach hook to check if translation validation is needed
  afterEach(function () {
    // Check if there's a pending check from URL change
    if (Cypress.translationChecker.pendingCheck && Cypress.translationChecker.lastUrl) {
      cy.wait(defaultWaitTime, { log: false });
      performTranslationCheck(Cypress.translationChecker.lastUrl);
      Cypress.translationChecker.pendingCheck = false;
    }
  });

  // Reset state at the start of each test
  beforeEach(() => {
    Cypress.translationChecker.visitedUrls.clear();
    Cypress.translationChecker.lastUrl = null;
    Cypress.translationChecker.pendingCheck = false;
  });
};

/**
 * Create translation validation tests for all visited pages
 * Retrieves results from Node.js storage (persists across spec files)
 * Creates individual test cases for each page with errors for better visibility
 */
export const createTranslationValidationTests = () => {
  describe('Automatic Translation Validation', () => {
    let pageResults = [];

    before(function () {
      // Retrieve all stored results from Node.js
      cy.task('getTranslationResults', null, { log: false }).then((results) => {
        pageResults = results;

        if (pageResults.length === 0) {
          cy.log('No pages were visited - run your functional tests first');
          this.skip();
        }
      });
    });

    it('should collect translation results from all pages', function () {
      if (pageResults.length === 0) {
        this.skip();
        return;
      }

      const pagesWithErrors = pageResults.filter(result => result.errors.length > 0);
      const pagesWithoutErrors = pageResults.length - pagesWithErrors.length;

      cy.log(`Checked ${pageResults.length} pages`);
      cy.log(`Clean pages: ${pagesWithoutErrors}`);
      cy.log(`Pages with issues: ${pagesWithErrors.length}`);

      if (pagesWithErrors.length > 0) {
        console.log('\n=== Translation Validation Summary ===');
        console.log(`Total pages checked: ${pageResults.length}`);
        console.log(`Pages with issues: ${pagesWithErrors.length}`);
        console.log(`Clean pages: ${pagesWithoutErrors}\n`);

        pagesWithErrors.forEach((result) => {
          console.log(`\nPage: ${result.url}`);
          console.log(`  Test: "${result.testContext}"`);
          console.log(`  Issues: ${result.errors.length}`);
        });
      }
    });

    it('should validate each page individually', function () {
      if (pageResults.length === 0) {
        this.skip();
        return;
      }

      pageResults.forEach((result) => {
        const errorCount = result.errors.length;

        // Create a clear assertion for each page
        cy.wrap(null).then(() => {
          if (errorCount > 0) {
            console.error(`\n=== Translation Issues on ${result.url} ===`);
            console.error(`Test context: "${result.testContext}"`);
            console.error(`Total issues: ${errorCount}\n`);

            result.errors.forEach((error, index) => {
              console.error(`${index + 1}. ${error.type.toUpperCase()}: "${error.text}"`);
              console.error(`   Element: <${error.element}>`);
              if (error.attribute) {
                console.error(`   Attribute: ${error.attribute}`);
              }
              console.error(`   XPath: ${error.xpath}\n`);
            });

            throw new Error(
              `Translation validation failed for ${result.url}\n` +
              `Found ${errorCount} issue(s). See console output above for details.`
            );
          }
        });
      });
    });
  });
};
