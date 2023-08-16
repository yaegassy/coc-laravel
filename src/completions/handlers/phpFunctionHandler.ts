import {
  CancellationToken,
  CompletionContext,
  CompletionItem,
  CompletionItemKind,
  ExtensionContext,
  InsertTextFormat,
  LinesTextDocument,
  MarkupContent,
  Position,
  SnippetString,
  TextEdit,
  workspace,
} from 'coc.nvim';

import fs from 'fs';
import path from 'path';

import * as bladeCommon from '../../common/blade';
import * as phpCommon from '../../common/php';
import { getArtisanPath } from '../../common/shared';
import { STUBS_VENDOR_NAME } from '../../constant';
import * as phpParser from '../../parsers/php/parser';
import { type PHPFunctionProjectManagerType } from '../../projects/types';
import * as phpFunctionCompletionService from '../services/phpFunctionService';
import { CompletionItemDataType } from '../types';

export async function doCompletion(
  document: LinesTextDocument,
  position: Position,
  phpFunctionProjectManager: PHPFunctionProjectManagerType,
  context?: CompletionContext
) {
  if (document.languageId !== 'blade') return [];

  const items: CompletionItem[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  const code = document.getText();
  const offset = document.offsetAt(position);
  if (!phpFunctionCompletionService.canCompletionFromContext(code, offset)) return [];

  let wordWithExtraChars: string | undefined = undefined;
  const wordWithExtraCharsRange = doc.getWordRangeAtPosition(
    Position.create(position.line, position.character - 1),
    '_$\\'
  );
  if (wordWithExtraCharsRange) {
    wordWithExtraChars = document.getText(wordWithExtraCharsRange);
  }

  const phpUseStatementFunctionItems = getUseStatementPHPFunctionItems(code, phpFunctionProjectManager, position);
  if (phpUseStatementFunctionItems.length > 0) {
    items.push(...phpUseStatementFunctionItems);
  }

  const phpFunctionItems = getPHPFunctionItems(phpFunctionProjectManager, position, wordWithExtraChars, context);
  if (phpFunctionItems.length > 0) {
    items.push(...phpFunctionItems);
  }

  return items;
}

function getPHPFunctionItems(
  phpFunctionProjectManager: PHPFunctionProjectManagerType,
  position: Position,
  wordWithExtraChars?: string,
  context?: CompletionContext
) {
  const items: CompletionItem[] = [];

  const phpFunctions = Array.from(phpFunctionProjectManager.list());

  for (const phpFunction of phpFunctions) {
    let label = phpFunction[0];
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
      newText: new SnippetString(`${phpFunction[0]}(\${1})`).value,
    };

    const data: CompletionItemDataType = {
      source: 'laravel-php-function',
      filePath: phpFunction[1].path,
      isStubs: phpFunction[1].isStubs,
    };

    items.push({
      label: label,
      kind: CompletionItemKind.Function,
      insertTextFormat: InsertTextFormat.Snippet,
      textEdit: edit,
      data,
    });
  }

  return items;
}

function getUseStatementPHPFunctionItems(
  code: string,
  phpFunctionProjectManager: PHPFunctionProjectManagerType,
  position: Position,
  wordWithExtraChars?: string
) {
  const items: CompletionItem[] = [];

  const virtualPhpEvalCode = bladeCommon.generateVirtualPhpEvalCode(code);
  if (!virtualPhpEvalCode) return [];

  const useItems = phpParser.getUseItems('<?php\n' + virtualPhpEvalCode);
  if (useItems.length === 0) return [];

  for (const item of useItems) {
    if (!item.groupType) continue;
    if (item.groupType !== 'function') continue;

    const symbolNameData = phpCommon.getSymbolNameDataFromUseItem(item);
    if (!symbolNameData) continue;

    const storeData = phpFunctionProjectManager.phpFunctionMapStore.get(symbolNameData.fullQualifiedName);
    if (!storeData) continue;

    const adjustStartCharacter = wordWithExtraChars
      ? position.character - wordWithExtraChars.length
      : position.character;

    const edit: TextEdit = {
      range: {
        start: { line: position.line, character: adjustStartCharacter },
        end: position,
      },
      newText: symbolNameData.aliasName
        ? new SnippetString(`${symbolNameData.aliasName}(\${1})`).value
        : new SnippetString(`${symbolNameData.qualifiedName}(\${1})`).value,
    };

    const data: CompletionItemDataType = {
      source: 'laravel-php-function',
      filePath: storeData.path,
      isStubs: storeData.isStubs,
      qualifiedName: symbolNameData.qualifiedName,
      fullQualifiedName: symbolNameData.fullQualifiedName,
      namespace: symbolNameData.namespace,
    };

    items.push({
      label: symbolNameData.aliasName ? symbolNameData.aliasName : symbolNameData.qualifiedName,
      labelDetails: symbolNameData.namespace
        ? { description: `[${symbolNameData.namespace}]` }
        : { description: '[from use statement]' },
      kind: CompletionItemKind.Function,
      insertTextFormat: InsertTextFormat.Snippet,
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
  if (itemData.source !== 'laravel-php-function') return item;
  if (!itemData.filePath) return item;

  const itemDataFilePath = itemData.filePath;

  const artisanPath = getArtisanPath();
  if (!artisanPath) return item;

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

  const itemStartOffset = phpCommon.getFunctionItemStartOffsetFromPhpCode(targetPHPCode, itemQualifiedName);
  if (!itemStartOffset) return item;

  const defineString = phpCommon.getDefinitionStringByStartOffsetFromPhpCode(targetPHPCode, itemStartOffset);

  const itemDocumentation = phpCommon.getFunctionItemDocumantationFromPhpCode(targetPHPCode, itemQualifiedName);

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
