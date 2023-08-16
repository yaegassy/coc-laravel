import { Node } from 'php-parser';

import { type PHPClassItemKindEnum } from '../projects/types';

export type BladeWithPHPNodesRange = {
  startOffset: number;
  endOffset: number;
  phpNodes: Node[];
};

export type BladeWithPHPNodesKindRangeOffsets = {
  start: number;
  end: number;
  kindRangeOffsets: RangeOffset[];
};

export type RangeOffset = {
  start: number;
  end: number;
};

export type CompletionItemDataType = {
  source: CompletionItemSource; // ALL
  filePath?: string; // phpConstant, phpFunction, phpClass, phpStaticClass
  kind?: PHPClassItemKindEnum; // phpClass, phpStaticClass
  isStubs?: boolean; // phpConstant, phpFunction, phpClass, phpStaticClass
  className?: string; // phpStaticClass
  variableType?: string; // phpVariable
  originalContent?: string; // phpVariable
  objectName?: string; // phpObjectMember
  virtualContent?: string; // phpObjectMember
  namespace?: string; // phpClass, phpFunction
  qualifiedName?: string; // phpClass, phpFunction
  fullQualifiedName?: string; // phpClass, phpFunction
};

type CompletionItemSource =
  | 'laravel-php-constant'
  | 'laravel-php-function'
  | 'laravel-php-class'
  | 'laravel-php-static-class'
  | 'laravel-php-variable'
  | 'laravel-php-object-member';
