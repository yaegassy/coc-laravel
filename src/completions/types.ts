import { Node } from 'php-parser';

import { type PHPClassItemKindEnum } from '../projects/types';

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
  kind?: PHPClassItemKindEnum; // phpClass
  isStubs?: boolean; // phpConstant, phpFunction
};

type CompletionItemSource = 'laravel-php-constant' | 'laravel-php-function' | 'laravel-php-class';
