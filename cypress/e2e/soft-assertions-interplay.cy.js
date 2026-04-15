/**
 * Integration test for interplay between:
 * - @koenvanbelle/cypress-soft-assertions
 * - cypress-translation-checker automatic tracking
 *
 * Goal: Ensure soft_it() tests still allow translation tracking and persistence.
 */

import '@koenvanbelle/cypress-soft-assertions';

describe('Soft Assertions + Translation Checker Interplay', () => {
  before(() => {
    cy.task('clearTranslationResults', null, { log: false });
  });

  soft_it('tracks translation issues during a soft_it() test', () => {
    cy.visit('test-page.html');

    // Keep assertions passing so this is a stable integration test.
    cy.get('h1').should('be.visible');
    cy.get('#navigate-to-dashboard').should('exist');
  });

  it('stores tracked translation issues for later hard validation', () => {
    cy.task('getTranslationResults', null, { log: false }).then((results) => {
      expect(results).to.be.an('array');
      expect(results.length).to.be.greaterThan(0);

      const testPageResult = results.find((result) => result.url.includes('test-page.html'));
      expect(testPageResult, 'result for test-page.html').to.exist;
      expect(testPageResult.errors).to.be.an('array');
      expect(testPageResult.errors.length).to.be.greaterThan(0);
    });
  });

  after(() => {
    cy.task('clearTranslationResults', null, { log: false });
  });
});
