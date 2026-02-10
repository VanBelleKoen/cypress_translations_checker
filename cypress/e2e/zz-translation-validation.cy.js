/**
 * Translation Validation Test Suite
 * 
 * This file creates a separate test that validates all pages visited
 * during your other tests. It runs AFTER all functional tests complete.
 * 
 * IMPORTANT: Translation checking happens DURING the initial page visit
 * (not by revisiting), so this works with authenticated pages and complex
 * application state. The results are stored and reported here.
 * 
 * If translation issues are found, only THIS test fails - your functional
 * tests remain unaffected.
 */

import { createTranslationValidationTests } from '../../commands';

// Generate translation validation test
createTranslationValidationTests();
