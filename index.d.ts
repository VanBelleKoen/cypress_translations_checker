export interface TranslationCheckerOptions {
  patterns?: Array<string | RegExp>;
  excludeSelectors?: string[];
  failOnError?: boolean;
  logErrors?: boolean;
  allowedKeys?: string[];
  highlightInInspector?: boolean;
  checkAttributes?: string[];
}

export declare const defaultConfig: Required<Omit<TranslationCheckerOptions, 'patterns'>> & {
  patterns: RegExp[];
};