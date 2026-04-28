/// <reference types="cypress" />

export interface TranslationIssue {
  type: 'text' | 'attribute';
  text: string;
  element: string;
  selector?: string;
  xpath: string;
  attribute?: string;
}

export interface TranslationCheckerOptions {
  patterns?: Array<string | RegExp>;
  excludeSelectors?: string[];
  failOnError?: boolean;
  logErrors?: boolean;
  allowedKeys?: string[];
  highlightInInspector?: boolean;
  checkAttributes?: string[];
  waitTime?: number;
}

declare global {
  namespace Cypress {
    interface Chainable {
      checkTranslations(options?: TranslationCheckerOptions): Chainable<TranslationIssue[]>;
    }

    interface TranslationCheckerState {
      visitedUrls: Set<string>;
      lastUrl: string | null;
      pendingCheck: boolean;
    }

    interface Cypress {
      translationChecker?: TranslationCheckerState;
    }
  }
}

export declare function enableAutoTranslationCheck(globalOptions?: TranslationCheckerOptions): void;

export declare function createTranslationValidationTests(): void;

export { };