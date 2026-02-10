/**
 * Unit tests for the translation checker functionality
 * These tests verify the cy.checkTranslations() command works correctly
 * 
 * Note: For automatic translation checking in your real app, you don't need
 * to call cy.checkTranslations() manually. The plugin tracks pages automatically
 * and runs validation in the zz-translation-validation.cy.js test file.
 */

describe('Translation Checker - Text Content Detection', () => {

  it('should detect translation issues in text content', () => {
    cy.visit('test-page.html');

    cy.checkTranslations({
      failOnError: false,
      logErrors: true
    }).then((errors) => {
      expect(errors.length).to.be.greaterThan(0);

      // Should detect {{key}} pattern
      const hasHandlebarsError = errors.some(e =>
        e.text.includes('{{') && e.text.includes('}}')
      );
      expect(hasHandlebarsError).to.be.true;

      // Should detect i18n. pattern
      const hasI18nError = errors.some(e =>
        e.text.includes('i18n.')
      );
      expect(hasI18nError).to.be.true;

      cy.log(`Found ${errors.length} translation issues`);
    });
  });

  it('should detect multiple pattern types', () => {
    cy.visit('test-page.html');

    cy.checkTranslations({
      failOnError: false,
      logErrors: false
    }).then((errors) => {
      const errorTexts = errors.map(e => e.text);

      // Check for different pattern types
      const patterns = [
        { name: 'Handlebars {{}}', regex: /\{\{.*?\}\}/ },
        { name: 'i18n.', regex: /i18n\./ },
        { name: 'Brackets [[]]', regex: /\[\[.*?\]\]/ },
        { name: '$t()', regex: /\$t\(.*?\)/ },
        { name: 'UPPERCASE.KEY', regex: /^[A-Z_]+\.[A-Z_]+/ }
      ];

      patterns.forEach(pattern => {
        const found = errorTexts.some(text => pattern.regex.test(text));
        if (found) {
          cy.log(`✓ Detected ${pattern.name} pattern`);
        }
      });

      // Should detect at least 3 different pattern types
      const patternsFound = patterns.filter(pattern =>
        errorTexts.some(text => pattern.regex.test(text))
      ).length;

      expect(patternsFound).to.be.at.least(3);
    });
  });
});

describe('Translation Checker - Attribute Detection', () => {

  it('should detect translation issues in attributes', () => {
    cy.visit('test-page.html');

    cy.checkTranslations({
      failOnError: false,
      logErrors: false
    }).then((errors) => {
      const attributeErrors = errors.filter(e => e.type === 'attribute');
      expect(attributeErrors.length).to.be.greaterThan(0);

      attributeErrors.forEach(error => {
        cy.log(`${error.attribute}: "${error.text}"`);
      });
    });
  });

  it('should detect issues in placeholder attributes', () => {
    cy.visit('test-page.html');

    cy.checkTranslations({
      failOnError: false,
      logErrors: false
    }).then((errors) => {
      const placeholderErrors = errors.filter(e =>
        e.type === 'attribute' && e.attribute === 'placeholder'
      );
      expect(placeholderErrors.length).to.be.greaterThan(0);
    });
  });

  it('should detect issues in title and alt attributes', () => {
    cy.visit('test-page.html');

    cy.checkTranslations({
      failOnError: false,
      logErrors: false
    }).then((errors) => {
      const titleOrAltErrors = errors.filter(e =>
        e.type === 'attribute' &&
        (e.attribute === 'title' || e.attribute === 'alt')
      );
      expect(titleOrAltErrors.length).to.be.greaterThan(0);
    });
  });
});

describe('Translation Checker - Exclusions', () => {

  it('should exclude content marked with data-translation-ignore', () => {
    cy.visit('test-page.html');

    cy.checkTranslations({
      failOnError: false,
      logErrors: false
    }).then((errors) => {
      const excludedSectionErrors = errors.filter(e =>
        e.text.includes('this.should.not.trigger.error')
      );
      expect(excludedSectionErrors.length).to.equal(0);
    });
  });

  it('should not flag properly translated content as errors', () => {
    cy.visit('clean-page.html');

    cy.checkTranslations({
      failOnError: false,
      logErrors: false
    }).then((errors) => {
      // Clean page should have no errors
      expect(errors.length).to.equal(0);
      cy.log('✓ Clean page has no translation issues');
    });
  });

  it('should support custom exclusion selectors', () => {
    cy.visit('test-page.html');

    cy.checkTranslations({
      failOnError: false,
      logErrors: false,
      excludeSelectors: [
        '.bad',  // Exclude the bad section
        '[data-translation-ignore]',
        'script',
        'style'
      ]
    }).then((errors) => {
      // Should find fewer errors when excluding .bad section
      expect(errors.length).to.be.lessThan(10);
    });
  });
});

describe('Translation Checker - Custom Patterns', () => {

  it('should respect custom patterns', () => {
    cy.visit('test-page.html');

    // Only check for handlebars pattern
    cy.checkTranslations({
      patterns: [/\{\{.*?\}\}/],
      failOnError: false,
      logErrors: false
    }).then((errors) => {
      // All errors should match the handlebars pattern
      errors.forEach(error => {
        expect(error.text).to.match(/\{\{.*?\}\}/);
      });

      expect(errors.length).to.be.greaterThan(0);
    });
  });

  it('should allow multiple custom patterns', () => {
    cy.visit('test-page.html');

    cy.checkTranslations({
      patterns: [
        /\{\{.*?\}\}/,  // Handlebars
        /i18n\./,       // i18n prefix
      ],
      failOnError: false,
      logErrors: false
    }).then((errors) => {
      expect(errors.length).to.be.greaterThan(0);

      // Should find at least one of each pattern
      const hasHandlebars = errors.some(e => /\{\{.*?\}\}/.test(e.text));
      const hasI18n = errors.some(e => /i18n\./.test(e.text));

      expect(hasHandlebars).to.be.true;
      expect(hasI18n).to.be.true;
    });
  });
});

describe('Translation Checker - Error Details', () => {

  it('should provide detailed error information', () => {
    cy.visit('test-page.html');

    cy.checkTranslations({
      failOnError: false,
      logErrors: false
    }).then((errors) => {
      // Each error should have required properties
      errors.forEach(error => {
        expect(error).to.have.property('type');
        expect(error).to.have.property('text');
        expect(error).to.have.property('element');
        expect(error).to.have.property('xpath');

        expect(['text', 'attribute']).to.include(error.type);
      });
    });
  });

  it('should include xpath for error location', () => {
    cy.visit('test-page.html');

    cy.checkTranslations({
      failOnError: false,
      logErrors: false
    }).then((errors) => {
      errors.forEach(error => {
        expect(error.xpath).to.be.a('string');
        expect(error.xpath.length).to.be.greaterThan(0);
        cy.log(`${error.element}: ${error.xpath}`);
      });
    });
  });
});

describe('Translation Checker - Dashboard Page', () => {

  it('should detect translation issues on dashboard', () => {
    cy.visit('dashboard.html');

    cy.checkTranslations({
      failOnError: false,
      logErrors: true
    }).then((errors) => {
      expect(errors.length).to.be.greaterThan(0);
      cy.log(`Found ${errors.length} translation issues on dashboard`);
    });
  });

  it('should detect issues in dashboard header', () => {
    cy.visit('dashboard.html');

    cy.checkTranslations({
      failOnError: false,
      logErrors: false
    }).then((errors) => {
      const headerErrors = errors.filter(e =>
        e.text.includes('{{dashboard.title}}') ||
        e.text.includes('{{user.name}}')
      );
      expect(headerErrors.length).to.be.greaterThan(0);
    });
  });

  it('should detect issues in notification list', () => {
    cy.visit('dashboard.html');

    cy.checkTranslations({
      failOnError: false,
      logErrors: false
    }).then((errors) => {
      const notificationErrors = errors.filter(e =>
        e.text.includes('i18n.notification') ||
        e.text.includes('[[notification') ||
        e.text.includes('$t(\'notification')
      );
      expect(notificationErrors.length).to.be.greaterThan(0);
    });
  });

  it('should detect UPPERCASE.KEY pattern in settings', () => {
    cy.visit('dashboard.html');

    cy.checkTranslations({
      failOnError: false,
      logErrors: false
    }).then((errors) => {
      const settingsErrors = errors.filter(e =>
        e.text.includes('SETTINGS.')
      );
      expect(settingsErrors.length).to.be.greaterThan(0);
    });
  });

  it('should find all pattern types on dashboard', () => {
    cy.visit('dashboard.html');

    cy.checkTranslations({
      failOnError: false,
      logErrors: false
    }).then((errors) => {
      const errorTexts = errors.map(e => e.text);

      // Dashboard should have all 5 pattern types
      const patterns = [
        { name: 'Handlebars {{}}', regex: /\{\{.*?\}\}/ },
        { name: 'i18n.', regex: /i18n\./ },
        { name: 'Brackets [[]]', regex: /\[\[.*?\]\]/ },
        { name: '$t()', regex: /\$t\(.*?\)/ },
        { name: 'UPPERCASE.KEY', regex: /^[A-Z_]+\.[A-Z_]+/ }
      ];

      patterns.forEach(pattern => {
        const found = errorTexts.some(text => pattern.regex.test(text));
        expect(found, `Should detect ${pattern.name}`).to.be.true;
        cy.log(`✓ Detected ${pattern.name} pattern on dashboard`);
      });
    });
  });
});

describe('Translation Checker - Navigation Flow', () => {

  it('should check translations after navigation', () => {
    cy.visit('test-page.html');

    cy.checkTranslations({
      failOnError: false,
      logErrors: false
    }).then((homeErrors) => {
      cy.log(`Home page has ${homeErrors.length} translation issues`);
      expect(homeErrors.length).to.be.greaterThan(0);

      // Navigate to dashboard
      cy.get('#navigate-to-dashboard').click();
      cy.url().should('include', 'dashboard.html');

      // Check translations on new page
      cy.checkTranslations({
        failOnError: false,
        logErrors: false
      }).then((dashboardErrors) => {
        cy.log(`Dashboard page has ${dashboardErrors.length} translation issues`);
        expect(dashboardErrors.length).to.be.greaterThan(0);
      });
    });
  });

  it('should check translations when navigating back', () => {
    cy.visit('dashboard.html');

    cy.get('#back-link').click();
    cy.url().should('include', 'test-page.html');

    cy.checkTranslations({
      failOnError: false,
      logErrors: false
    }).then((errors) => {
      expect(errors.length).to.be.greaterThan(0);
      cy.log(`Home page has ${errors.length} translation issues after navigation`);
    });
  });

  it('should handle multiple page visits', () => {
    // Visit home
    cy.visit('test-page.html');
    cy.checkTranslations({ failOnError: false, logErrors: false }).then((errors) => {
      expect(errors.length).to.be.greaterThan(0);
    });

    // Visit dashboard
    cy.visit('dashboard.html');
    cy.checkTranslations({ failOnError: false, logErrors: false }).then((errors) => {
      expect(errors.length).to.be.greaterThan(0);
    });

    // Visit clean page
    cy.visit('clean-page.html');
    cy.checkTranslations({ failOnError: false, logErrors: false }).then((errors) => {
      expect(errors.length).to.equal(0);
    });
  });
});
