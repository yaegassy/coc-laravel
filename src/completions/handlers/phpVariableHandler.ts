import {
  CancellationToken,
  CompletionItem,
  CompletionItemKind,
  InsertTextFormat,
  LinesTextDocument,
  Position,
  TextEdit,
  workspace,
} from 'coc.nvim';

import * as bladeCommon from '../../common/blade';
import { runTinkerReflection } from '../../common/shared';
import { PhpVariableItemType } from '../../common/types';
import { quoteForTerminalExecution, stripInitialNewline } from '../../common/utils';
import * as bladeParser from '../../parsers/blade/parser';
import * as phpVariableCompletionService from '../services/phpVariableService';
import { CompletionItemDataType } from '../types';

export async function doCompletion(document: LinesTextDocument, position: Position) {
  if (document.languageId !== 'blade') return [];

  const items: CompletionItem[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  const code = document.getText();
  const offset = document.offsetAt(position);

  if (!phpVariableCompletionService.canCompletionFromContext(code, offset)) return [];

  let wordWithExtraChars: string | undefined = undefined;
  const wordWithExtraCharsRange = doc.getWordRangeAtPosition(
    Position.create(position.line, position.character - 1),
    '_$'
  );
  if (wordWithExtraCharsRange) {
    wordWithExtraChars = document.getText(wordWithExtraCharsRange);
  }
  if (!wordWithExtraChars) return [];

  const variableCompletionItems = getVariableCompletionItems(code, position, offset, wordWithExtraChars);

  if (variableCompletionItems.length > 0) {
    items.push(...variableCompletionItems);
  }

  return items;
}

function getVariableCompletionItems(
  code: string,
  position: Position,
  editorOffset: number,
  wordWithExtraChars: string
) {
  const items: CompletionItem[] = [];

  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return [];

  const phpVariableItems: PhpVariableItemType[] = [];

  const inlinePhpVariableItems = bladeCommon.getVariableItemsWithBladeRangeOffsetsFromBladeDoc(bladeDoc, 'inlinePhp');
  if (inlinePhpVariableItems.length > 0) phpVariableItems.push(...inlinePhpVariableItems);

  const phpDirectiveVariableItems = bladeCommon.getVariableItemsWithBladeRangeOffsetsFromBladeDoc(
    bladeDoc,
    'phpDirective'
  );
  if (phpDirectiveVariableItems.length > 0) phpVariableItems.push(...phpDirectiveVariableItems);

  const variableItems = bladeCommon.getVariableItemsFromEditorOffset(phpVariableItems, editorOffset);

  for (const v of variableItems) {
    const adjustStartCharacter = wordWithExtraChars
      ? position.character - wordWithExtraChars.length
      : position.character;

    const edit: TextEdit = {
      range: {
        start: { line: position.line, character: adjustStartCharacter },
        end: position,
      },
      newText: '$' + v.name,
    };

    const data: CompletionItemDataType = {
      source: 'laravel-php-variable',
      variableType: v.type,
      originalContent: code,
    };

    items.push({
      label: '$' + v.name,
      kind: CompletionItemKind.Variable,
      insertTextFormat: InsertTextFormat.PlainText,
      commitCharacters: ['$'],
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  artisanPath: string
) {
  if (!item.data) return item;

  const itemData = item.data as CompletionItemDataType;
  if (itemData.source !== 'laravel-php-variable') return item;
  if (!itemData.variableType) return item;

  if (
    itemData.variableType === 'variable' ||
    itemData.variableType === 'call' ||
    itemData.variableType === 'new' ||
    itemData.variableType === 'object'
  ) {
    item.detail = itemData.variableType;

    if (!itemData.originalContent) return item;
    const originalContent = itemData.originalContent;

    const virtualPhpCode = bladeCommon.generateVirtualPhpEvalCode(originalContent);
    if (!virtualPhpCode) return item;

    const quotedVirtualPhpCode = quoteForTerminalExecution(virtualPhpCode);

    const reflectionCode = stripInitialNewline(`
${quotedVirtualPhpCode}

try {
    if (isset(\\${item.label})) {
        \\$reflector = new ReflectionObject(\\${item.label});
        echo json_encode(\\$reflector->name);
    }
} catch (\\Throwable \\$th) {}
`);

    let detectVariableType: string | undefined = undefined;
    try {
      const resJsonStr = await runTinkerReflection(reflectionCode, artisanPath);
      if (resJsonStr) {
        detectVariableType = JSON.parse(resJsonStr) as string;
      }
    } catch (e) {}
    if (!detectVariableType) return item;

    item.detail = detectVariableType;
  } else {
    item.detail = itemData.variableType;
  }

  return item;
}
