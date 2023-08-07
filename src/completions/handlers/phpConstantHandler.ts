import {
  CancellationToken,
  CompletionItem,
  CompletionItemKind,
  ExtensionContext,
  InsertTextFormat,
  LinesTextDocument,
  Position,
  TextEdit,
  workspace,
} from 'coc.nvim';

import fs from 'fs';
import path from 'path';

import * as stubsCommon from '../../common/stubs';
import { type PHPConstantProjectManagerType } from '../../projects/types';
import * as phpConstantCompletionService from '../services/phpConstantService';

import { STUBS_VENDOR_NAME } from '../../constant';
import { CompletionItemDataType } from '../types';

export async function doCompletion(
  document: LinesTextDocument,
  position: Position,
  phpConstantProjectManager: PHPConstantProjectManagerType
) {
  if (document.languageId !== 'blade') return [];

  const items: CompletionItem[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  const code = document.getText();
  const offset = document.offsetAt(position);
  if (!phpConstantCompletionService.canCompletionFromContext(code, offset)) return [];

  let wordWithExtraChars: string | undefined = undefined;
  const wordWithExtraCharsRange = doc.getWordRangeAtPosition(
    Position.create(position.line, position.character - 1),
    '_$'
  );
  if (wordWithExtraCharsRange) {
    wordWithExtraChars = document.getText(wordWithExtraCharsRange);
  }

  const phpConstantItems = getPHPConstantItems(phpConstantProjectManager, position, wordWithExtraChars);
  if (phpConstantItems) {
    items.push(...phpConstantItems);
  }

  return items;
}

function getPHPConstantItems(
  phpConstantProjectManager: PHPConstantProjectManagerType,
  position: Position,
  wordWithExtraChars: string | undefined
) {
  const items: CompletionItem[] = [];

  const phpConstants = Array.from(phpConstantProjectManager.list());

  for (const phpConstant of phpConstants) {
    const adjustStartCharacter = wordWithExtraChars
      ? position.character - wordWithExtraChars.length
      : position.character;

    const edit: TextEdit = {
      range: {
        start: { line: position.line, character: adjustStartCharacter },
        end: position,
      },
      newText: phpConstant[0],
    };

    const data: CompletionItemDataType = {
      source: 'laravel-php-constant',
      filePath: phpConstant[1].path,
      isStubs: phpConstant[1].isStubs,
    };

    items.push({
      label: phpConstant[0],
      kind: CompletionItemKind.Constant,
      insertTextFormat: InsertTextFormat.PlainText,
      textEdit: edit,
      data,
    });
  }

  return items;
}

export async function doResolveCompletionItem(
  item: CompletionItem,
  _token: CancellationToken,
  extensionContext: ExtensionContext
) {
  if (!item.data) return item;

  const resoveItem = item.data as CompletionItemDataType;
  if (resoveItem.source !== 'laravel-php-constant') return item;

  //
  // documentation
  //

  if (!resoveItem.filePath) return item;
  item.documentation = resoveItem.filePath;

  //
  // detail
  //

  if (resoveItem.isStubs) {
    const phpFilePathInStubs = path.resolve(
      path.join(extensionContext.storagePath, STUBS_VENDOR_NAME, resoveItem.filePath)
    );

    let existsPhpFilePath = false;
    try {
      await fs.promises.stat(phpFilePathInStubs);
      existsPhpFilePath = true;
    } catch {}
    if (!existsPhpFilePath) return item;

    const phpCodeInStubs = await fs.promises.readFile(phpFilePathInStubs, { encoding: 'utf8' });
    const defineValue = stubsCommon.getDefineValueFromDefineNameInPHPCode(phpCodeInStubs, item.label);

    if (defineValue) {
      item.detail = String(defineValue);
    }
  }

  return item;
}
