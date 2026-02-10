/**
 * Demo showing automatic translation checking without affecting functional tests
 * 
 * The translation checker is configured in cypress/support/e2e.js.
 * 
 * How it works:
 * 1. These functional tests run normally and test your app's functionality
 * 2. The plugin tracks all pages visited (cy.visit calls)
 * 3. After ALL tests complete, a separate translation validation test runs
 * 4. If translation issues exist, only the translation test fails
 * 5. Your functional tests pass/fail based on their own assertions
 * 
 * Check cypress/e2e/zz-translation-validation.cy.js - that's where the
 * automatic translation validation test appears!
 */

describe('Functional Tests - Homepage', () => {

  it('should display the homepage correctly', () => {
    cy.visit('test-page.html');

    // Normal functional assertions
    cy.get('h1').should('be.visible');
    cy.get('.nav-button').should('exist');
    cy.get('.section').should('have.length.greaterThan', 0);

    // This test passes based on these assertions
    // Translation issues won't fail THIS test
  });

  it('should have navigation button', () => {
    cy.visit('test-page.html');
    cy.get('#navigate-to-dashboard').should('contain', 'Go to Dashboard');
  });
});

describe('Functional Tests - Dashboard', () => {

  it('should display dashboard header', () => {
    cy.visit('dashboard.html');

    cy.get('.header').should('exist');
    cy.get('.card').should('have.length.greaterThan', 0);

    // Again, this test is about functionality, not translations
  });

  it('should have back link', () => {
    cy.visit('dashboard.html');
    cy.get('#back-link').should('exist');
  });
});

describe('Functional Tests - Navigation Flow', () => {

  it('should navigate between pages', () => {
    cy.visit('test-page.html');
    cy.get('#navigate-to-dashboard').click();

    cy.url().should('include', 'dashboard.html');
    cy.get('.header').should('be.visible');

    cy.get('#back-link').click();
    cy.url().should('include', 'test-page.html');
  });
});

describe('Functional Tests - Clean Page', () => {

  it('should load clean page without issues', () => {
    cy.visit('clean-page.html');

    cy.get('h1').should('contain', 'All Content Properly Translated');
    cy.get('.success').should('be.visible');

    // This page has no translation issues
    // So the translation validation test will pass for this page
  });
});

/**
 * After all these functional tests complete, check the test results.
 * You'll see a separate test suite called:
 * 
 * "🔍 Automatic Translation Validation"
 * 
 * That test will:
 * - Visit all pages that were visited in the tests above
 * - Check each one for translation issues
 * - Fail if any issues are found
 * - But your functional tests above will still show their own pass/fail status
 * 
 * This way, you can see:
 * ✓ Homepage tests - passed
 * ✓ Dashboard tests - passed
 * ✓ Navigation tests - passed
 * ✓ Clean page tests - passed
 * ✗ Translation Validation - failed (3 pages with issues)
 */
