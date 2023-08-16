import {
  CancellationToken,
  CompletionContext,
  CompletionItem,
  ExtensionContext,
  InsertTextFormat,
  LinesTextDocument,
  MarkupContent,
  Position,
  TextEdit,
  workspace,
} from 'coc.nvim';

import fs from 'fs';
import path from 'path';

import * as bladeCommon from '../../common/blade';
import * as phpCommon from '../../common/php';
import { STUBS_VENDOR_NAME } from '../../constant';
import * as phpParser from '../../parsers/php/parser';
import { type PHPClassProjectManagerType } from '../../projects/types';
import * as phpClassCompletionService from '../services/phpClassService';
import { CompletionItemDataType } from '../types';

export async function doCompletion(
  document: LinesTextDocument,
  position: Position,
  phpClassProjectManager: PHPClassProjectManagerType,
  context?: CompletionContext
) {
  if (document.languageId !== 'blade') return [];

  const items: CompletionItem[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  const code = document.getText();
  const offset = document.offsetAt(position);
  if (!phpClassCompletionService.canCompletionFromContext(code, offset)) return [];

  let wordWithExtraChars: string | undefined = undefined;
  const wordWithExtraCharsRange = doc.getWordRangeAtPosition(
    Position.create(position.line, position.character - 1),
    '_$\\'
  );
  if (wordWithExtraCharsRange) {
    wordWithExtraChars = document.getText(wordWithExtraCharsRange);
  }

  const phpUseStatementClassItems = getUseStatementPHPClassItems(
    code,
    phpClassProjectManager,
    position,
    offset,
    wordWithExtraChars
  );
  if (phpUseStatementClassItems.length > 0) {
    items.push(...phpUseStatementClassItems);
  }

  const phpClassItems = getPHPClassItems(phpClassProjectManager, position, wordWithExtraChars, context);
  if (phpClassItems) {
    items.push(...phpClassItems);
  }

  return items;
}

function getPHPClassItems(
  phpClassProjectManager: PHPClassProjectManagerType,
  position: Position,
  wordWithExtraChars?: string,
  context?: CompletionContext
) {
  const items: CompletionItem[] = [];

  const phpClasses = Array.from(phpClassProjectManager.list());

  for (const phpClass of phpClasses) {
    let label = phpClass[0];
    if (wordWithExtraChars?.includes('\\') && context?.triggerKind === 2) {
      // filtering
      if (!label.startsWith(wordWithExtraChars)) continue;
    }

    if (wordWithExtraChars?.endsWith('\\') && context?.triggerKind === 2) {
      label = label.replace(wordWithExtraChars, '');
    }

    if (wordWithExtraChars?.includes('\\') && context?.triggerKind === 1) {
      const splitWord = wordWithExtraChars.split('\\');
      splitWord.pop();
      const parentBackslashedWord = splitWord.join('\\');
      // filtering
      if (!label.startsWith(parentBackslashedWord)) continue;

      label = label.replace(parentBackslashedWord + '\\', '');
    }

    const adjustStartCharacter = wordWithExtraChars
      ? position.character - wordWithExtraChars.length
      : position.character;

    const edit: TextEdit = {
      range: {
        start: { line: position.line, character: adjustStartCharacter },
        end: position,
      },
      newText: phpClass[0],
    };

    const data: CompletionItemDataType = {
      source: 'laravel-php-class',
      filePath: phpClass[1].path,
      isStubs: phpClass[1].isStubs,
      kind: phpClass[1].kind,
    };

    const kind = phpClassCompletionService.getCompletionItemKindAtClassItemKind(phpClass[1].kind);

    items.push({
      label: label,
      kind,
      insertTextFormat: InsertTextFormat.PlainText,
      textEdit: edit,
      data,
    });
  }

  return items;
}

function getUseStatementPHPClassItems(
  code: string,
  phpClassProjectManager: PHPClassProjectManagerType,
  position: Position,
  editorOffset: number,
  wordWithExtraChars?: string
) {
  const items: CompletionItem[] = [];

  let evalCode = code;
  if (wordWithExtraChars) {
    const beforeInputString = code.slice(0, editorOffset - wordWithExtraChars.length);
    const afterInputString = code.slice(editorOffset, code.length - 1);
    const dummyString = "'__DUMMY__';";
    evalCode = beforeInputString + dummyString + afterInputString;
  }

  const virtualPhpEvalCode = bladeCommon.generateVirtualPhpEvalCode(evalCode);
  if (!virtualPhpEvalCode) return [];

  const useItems = phpParser.getUseItems('<?php\n' + virtualPhpEvalCode);
  if (useItems.length === 0) return [];

  for (const item of useItems) {
    // For class, groupType is undefined
    if (item.groupType) continue;

    const symbolNameData = phpCommon.getSymbolNameDataFromUseItem(item);
    if (!symbolNameData) continue;

    const storeData = phpClassProjectManager.phpClassMapStore.get(symbolNameData.fullQualifiedName);
    if (!storeData) continue;

    const edit: TextEdit = {
      range: {
        start: position,
        end: position,
      },
      newText: symbolNameData.aliasName ? symbolNameData.aliasName : symbolNameData.qualifiedName,
    };

    const data: CompletionItemDataType = {
      source: 'laravel-php-class',
      filePath: storeData.path,
      isStubs: storeData.isStubs,
      kind: storeData.kind,
      qualifiedName: symbolNameData.qualifiedName,
      fullQualifiedName: symbolNameData.fullQualifiedName,
      namespace: symbolNameData.namespace,
    };

    const kind = phpClassCompletionService.getCompletionItemKindAtClassItemKind(storeData.kind);

    items.push({
      label: symbolNameData.aliasName ? symbolNameData.aliasName : symbolNameData.qualifiedName,
      labelDetails: symbolNameData.namespace
        ? { description: `[${symbolNameData.namespace}]` }
        : { description: '[from use statement]' },
      kind,
      insertTextFormat: InsertTextFormat.PlainText,
      textEdit: edit,
      data,
    });
  }

  return items;
}

export async function doResolveCompletionItem(
  item: CompletionItem,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _token: CancellationToken,
  extentionContext: ExtensionContext
) {
  if (!item.data) return item;

  const itemData = item.data as CompletionItemDataType;
  if (itemData.source !== 'laravel-php-class') return item;
  if (!itemData.filePath) return item;
  if (!itemData.kind) return item;

  const itemDataFilePath = itemData.filePath;

  const absoluteItemDataFilePath = itemData.isStubs
    ? path.join(extentionContext.storagePath, STUBS_VENDOR_NAME, itemDataFilePath)
    : path.join(workspace.root, itemDataFilePath);

  let existsAbsoluteItemDataFilePath = false;
  try {
    await fs.promises.stat(absoluteItemDataFilePath);
    existsAbsoluteItemDataFilePath = true;
  } catch {}
  if (!existsAbsoluteItemDataFilePath) return item;

  const targetPHPCode = await fs.promises.readFile(absoluteItemDataFilePath, { encoding: 'utf8' });

  let itemQualifiedName: string | undefined = undefined;
  if (itemData.qualifiedName) {
    itemQualifiedName = itemData.qualifiedName;
  } else {
    itemQualifiedName = item.label.includes('\\') ? item.label.split('\\').pop() : item.label;
  }
  if (!itemQualifiedName) return item;

  const itemKindName = phpCommon.getClassItemKindName(itemData.kind);

  const itemStartOffset = phpCommon.getClassItemStartOffsetFromPhpCode(targetPHPCode, itemQualifiedName, itemKindName);
  if (!itemStartOffset) return item;

  const defineString = phpCommon.getDefinitionStringByStartOffsetFromPhpCode(targetPHPCode, itemStartOffset);

  const itemDocumentation = phpCommon.getClassItemDocumantationFromPhpCode(
    targetPHPCode,
    itemQualifiedName,
    itemKindName
  );

  let documentationValue = '';
  documentationValue += '```php\n<?php\n';
  documentationValue += `${defineString} { }\n`;
  documentationValue += '```\n\n';

  if (itemDocumentation) {
    documentationValue += '```php\n<?php\n';
    documentationValue += `${itemDocumentation}\n`;
    documentationValue += '```\n';
  }

  const documentation: MarkupContent = {
    kind: 'markdown',
    value: documentationValue,
  };

  item.documentation = documentation;

  return item;
}
