# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-10

### Added
- Initial release
- Automatic translation validation on every `cy.visit()` call
- Support for multiple translation patterns ({{key}}, i18n.key, $t('key'), etc.)
- Configurable exclusion selectors
- Attribute checking (placeholder, title, alt, aria-label)
- Separate validation test to avoid failing functional tests
- Cross-spec data persistence using Cypress tasks
- Detailed error reporting with XPath locations
- Custom command `cy.checkTranslations()` for manual validation
- Support for `data-translation-ignore` attribute
- Configurable patterns, wait times, and allowed keys

### Features
- Works with authenticated pages (checks during initial visit)
- No test changes required - automatic checking
- Individual test cases per page for better error visibility
- Clear console output showing which pages have issues
