import { Node } from 'php-parser';

export type BladeWithPhpNodesRange = {
  startOffset: number;
  endOffset: number;
  phpNodes: Node[];
};

export type RangeOffset = {
  start: number;
  end: number;
};

export type CompletionItemDataType = {
  source: CompletionItemSource;
  filePath?: string; // phpConstant, phpFunction
  isStubs?: boolean; // phpConstant, phpFunction
};

type CompletionItemSource = 'laravel-php-constant' | 'laravel-php-function';
