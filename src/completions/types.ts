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
  filePath?: string; // phpConstant
  isStubs?: boolean; // phpConstant
  snippetsText?: string; // blade-directive
};

type CompletionItemSource = 'laravel-blade-directive' | 'laravel-php-constant';
