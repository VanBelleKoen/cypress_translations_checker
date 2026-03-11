/**
 * Cypress commands for translation checking
 */

const { defaultConfig } = require('./index');

const normalizeTextForDisplay = (text) => {
  if (!text) return '';
  return String(text).replace(/\s+/g, ' ').trim();
};

const truncateForTable = (text, maxLength = 80) => {
  const normalized = normalizeTextForDisplay(text);
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3)}...`;
};

const truncateForLog = (text, maxLength = 120) => {
  const normalized = normalizeTextForDisplay(text);
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3)}...`;
};

const formatIssueTable = (errors, maxIssues, context = {}) => {
  if (!Array.isArray(errors) || errors.length === 0) {
    return 'No table data available';
  }

  const limit = Number.isInteger(maxIssues) && maxIssues > 0 ? maxIssues : errors.length;
  const shownIssues = errors.slice(0, limit);
  const rows = shownIssues.map((error) => ({
    url: context.url || 'N/A',
    selector: error.selector || error.xpath || 'N/A',
    missingTranslation: truncateForTable(error.text)
  }));

  const urlHeader = 'URL';
  const selectorHeader = 'Selector';
  const translationHeader = 'Missing translation';
  const urlWidth = Math.max(urlHeader.length, ...rows.map(row => row.url.length));
  const selectorWidth = Math.max(selectorHeader.length, ...rows.map(row => row.selector.length));

  const lines = [
    `${urlHeader.padEnd(urlWidth)} | ${selectorHeader.padEnd(selectorWidth)} | ${translationHeader}`,
    `${'-'.repeat(urlWidth)}-|-${'-'.repeat(selectorWidth)}-|-${'-'.repeat(translationHeader.length)}`
  ];

  rows.forEach((row) => {
    lines.push(`${row.url.padEnd(urlWidth)} | ${row.selector.padEnd(selectorWidth)} | ${row.missingTranslation}`);
  });

  const remaining = errors.length - limit;
  if (remaining > 0) {
    lines.push(`...and ${remaining} more issue(s)`);
  }

  if (context.testContext) {
    lines.push(`Test context: "${context.testContext}"`);
  }

  return lines.join('\n');
};

const formatIssueDetails = (errors, maxIssues, context = {}) => {
  if (!Array.isArray(errors) || errors.length === 0) {
    return 'No issue details available';
  }

  const limit = Number.isInteger(maxIssues) && maxIssues > 0 ? maxIssues : errors.length;

  const shownIssues = errors.slice(0, limit).map((error, index) => {
    const attributePart = error.attribute ? ` [${error.attribute}]` : '';
    const contextParts = [];

    if (context.url) {
      contextParts.push(`url: ${context.url}`);
    }

    if (context.testContext) {
      contextParts.push(`test: "${context.testContext}"`);
    }

    const contextSuffix = contextParts.length > 0 ? ` (${contextParts.join(', ')})` : '';

    const selectorPart = error.selector ? ` selector: ${error.selector}` : ` xpath: ${error.xpath}`;
    return `${index + 1}) ${error.type.toUpperCase()}${attributePart} in <${error.element}> (${selectorPart}): "${error.text}"${contextSuffix}`;
  });

  const remaining = errors.length - limit;
  if (remaining > 0) {
    shownIssues.push(`...and ${remaining} more issue(s)`);
  }

  return shownIssues.join('\n');
};

/**
 * Checks for translation issues in the current page
 * @param {Object} options - Configuration options (overrides default config)
 */
Cypress.Commands.add('checkTranslations', (options = {}) => {
  const config = { ...defaultConfig, ...options };

  cy.window().then((win) => {
    const doc = win.document;
    const errors = [];

    const getCssSelector = (element) => {
      if (!element || element.nodeType !== Node.ELEMENT_NODE) {
        return '';
      }

      if (element.id) {
        return `#${element.id}`;
      }

      const parts = [];
      let current = element;

      while (current && current.nodeType === Node.ELEMENT_NODE && current !== doc.body) {
        let part = current.tagName.toLowerCase();

        if (current.classList && current.classList.length > 0) {
          part += `.${Array.from(current.classList).slice(0, 2).join('.')}`;
        }

        const siblingsWithSameTag = current.parentElement
          ? Array.from(current.parentElement.children).filter((child) => child.tagName === current.tagName)
          : [];

        if (siblingsWithSameTag.length > 1) {
          const index = siblingsWithSameTag.indexOf(current) + 1;
          part += `:nth-of-type(${index})`;
        }

        parts.unshift(part);
        current = current.parentElement;
      }

      return `body > ${parts.join(' > ')}`;
    };

    const highlightElement = (element) => {
      if (!config.highlightInInspector || !element || element.nodeType !== Node.ELEMENT_NODE) {
        return;
      }

      const currentCount = Number(element.getAttribute('data-translation-issue-count') || '0');
      element.setAttribute('data-translation-issue', 'true');
      element.setAttribute('data-translation-issue-count', String(currentCount + 1));
      element.style.setProperty('outline', '2px solid #e11d48');
      element.style.setProperty('outline-offset', '2px');
      element.style.setProperty('background-color', 'rgba(225, 29, 72, 0.08)');
    };

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
            highlightElement(element);
            errors.push({
              type: 'text',
              text: text,
              element: element.tagName,
              selector: getCssSelector(element),
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
              highlightElement(node);
              errors.push({
                type: 'attribute',
                attribute: attr,
                text: value,
                element: node.tagName,
                selector: getCssSelector(node),
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
        `Failing translations:\n\n${formatIssueTable(errors, undefined, { url: win.location.href })}\n\n` +
        `Details:\n${formatIssueDetails(errors, undefined, { url: win.location.href })}`
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

      if (errorCount > 0) {
        errors.forEach((error, index) => {
          const selector = error.selector || error.xpath || '<unknown selector>';
          cy.log(`❌ ${index + 1}/${errorCount}: ${truncateForLog(error.text)} | ${selector}`);
          console.error(`Translation issue ${index + 1}/${errorCount}`);
          console.error(`  Missing translation: "${error.text}"`);
          console.error(`  Selector: ${selector}`);
          if (error.attribute) {
            console.error(`  Attribute: ${error.attribute}`);
          }
        });
      }

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
              `Found ${errorCount} issue(s). Failing translations:\n\n${formatIssueTable(result.errors, undefined, {
                url: result.url,
                testContext: result.testContext
              })}\n\n` +
              `Details:\n${formatIssueDetails(result.errors, undefined, {
                url: result.url,
                testContext: result.testContext
              })}`
            );
          }
        });
      });
    });
  });
};
