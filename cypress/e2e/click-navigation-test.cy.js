/**
 * Test to verify automatic translation checking works on click navigation
 * 
 * This test verifies that the plugin automatically checks translations when:
 * 1. Using cy.visit() to load a page
 * 2. Using cy.click() that navigates to a new page
 * 
 * Both pages should be automatically checked and results stored for validation.
 */

describe('Click Navigation - Translation Checking', () => {

  it('should check translations after cy.visit()', () => {
    // Visit the initial page
    cy.visit('test-page.html');

    // Verify page loaded
    cy.get('h1').should('be.visible');

    // Translation check should happen automatically
    // Issues should be stored for later validation
  });

  it('should check translations after cy.click() navigation', () => {
    // Start on first page
    cy.visit('test-page.html');
    cy.get('h1').should('contain', 'Translation Validation Test Page');

    // Click button that navigates to dashboard
    cy.get('#navigate-to-dashboard').click();

    // Verify we're on the new page
    cy.url().should('include', 'dashboard.html');
    cy.get('.header').should('be.visible');

    // Translation check should happen automatically on the dashboard page
    // without any additional code needed!
  });

  it('should check translations on multiple click navigations', () => {
    // Navigate through multiple pages via clicks
    cy.visit('test-page.html');

    // First navigation via click
    cy.get('#navigate-to-dashboard').click();
    cy.url().should('include', 'dashboard.html');

    // Navigate back via click
    cy.get('#back-link').click();
    cy.url().should('include', 'test-page.html');

    // Both pages should have been checked for translations
  });

  it('should not duplicate checks for same URL', () => {
    // Visit a page
    cy.visit('clean-page.html');

    // Click something that doesn't navigate (same page)
    cy.get('h1').click();

    // URL hasn't changed, so no duplicate check should occur
    cy.url().should('include', 'clean-page.html');
  });

  it('should work with both visit and click in same test', () => {
    // Explicit visit
    cy.visit('test-page.html');
    cy.get('h1').should('be.visible');

    // Click navigation
    cy.get('#navigate-to-dashboard').click();
    cy.get('.header').should('be.visible');

    // Another explicit visit
    cy.visit('clean-page.html');
    cy.get('.success').should('exist');

    // All three pages should be checked
  });
});

describe('Click Navigation - Functional Test Example', () => {

  it('should complete a user workflow with automatic checking', () => {
    // User starts on homepage
    cy.visit('test-page.html');
    cy.get('.section').should('exist');

    // User navigates to dashboard
    cy.get('#navigate-to-dashboard').should('be.visible').click();

    // Dashboard loads
    cy.url().should('include', 'dashboard.html');
    cy.get('.card').should('have.length.greaterThan', 0);

    // User goes back
    cy.get('#back-link').click();
    cy.get('h1').should('contain', 'Translation Validation');

    // This entire workflow gets automatic translation checking
    // without any cy.checkTranslations() calls!
  });
});

/**
 * After this test completes, check the zz-translation-validation.cy.js results.
 * 
 * Expected behavior:
 * - test-page.html should be checked and have translation issues
 * - dashboard.html should be checked and have translation issues
 * - clean-page.html should be checked and have NO translation issues
 * 
 * All checks should happen automatically without manual cy.checkTranslations() calls.
 * 
 * To verify the feature works:
 * 1. Run: npm test
 * 2. Check the "Automatic Translation Validation" test results
 * 3. Verify that pages visited via cy.click() are included in the results
 */
