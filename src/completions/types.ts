import { Node } from 'php-parser';

import { type PHPClassItemKindEnum } from '../projects/types';

export type BladeWithPhpNodesRange = {
  startOffset: number;
  endOffset: number;
  phpNodes: Node[];
};

export type BladeWithPhpNodesKindRangeOffsets = {
  start: number;
  end: number;
  kindRangeOffsets: RangeOffset[];
};

export type RangeOffset = {
  start: number;
  end: number;
};

export type CompletionItemDataType = {
  source: CompletionItemSource;
  filePath?: string; // phpConstant, phpFunction, phpClass, phpScopeResolution
  kind?: PHPClassItemKindEnum; // phpClass, phpScopeResolution
  isStubs?: boolean; // phpConstant, phpFunction, phpClass, phpScopeResolution
  className?: string; // phpScopeResolution
  variableType?: string; // phpVariable
  originalContent?: string; // phpVariable
};

type CompletionItemSource =
  | 'laravel-php-constant'
  | 'laravel-php-function'
  | 'laravel-php-class'
  | 'laravel-php-scope-resolution'
  | 'laravel-php-variable';
