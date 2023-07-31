import {
  CompletionItem,
  CompletionItemKind,
  InsertTextFormat,
  LinesTextDocument,
  MarkupKind,
  Position,
  SnippetString,
  TextEdit,
  workspace,
} from 'coc.nvim';

import { type PHPFunctionProjectManagerType } from '../../projects/types';
import * as phpFunctionCompletionService from '../services/phpFunctionService';

export async function doCompletion(
  document: LinesTextDocument,
  position: Position,
  phpFunctionProjectManager: PHPFunctionProjectManagerType
) {
  if (document.languageId !== 'blade') return [];

  const items: CompletionItem[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  const code = document.getText();
  const offset = document.offsetAt(position);
  if (!phpFunctionCompletionService.canCompletionFromPHPRegionInBladeByOffset(code, offset)) return [];

  // **MEMO**:
  //
  // If the cursor is on one of the following php ast nodes, completion stops!
  //
  // - string node
  //   - "|", '|'
  // - staticlookup node
  //   - XXXX::|
  // - propertylookup node
  //   - XXXX()->|
  if (phpFunctionCompletionService.hasDenyKindNameFromPHPRegionInBladeByOffset(code, offset)) return [];

  let wordWithExtraChars: string | undefined = undefined;
  const wordWithExtraCharsRange = doc.getWordRangeAtPosition(
    Position.create(position.line, position.character - 1),
    '_$'
  );
  if (wordWithExtraCharsRange) {
    wordWithExtraChars = document.getText(wordWithExtraCharsRange);
  }

  const phpFunctionItems = getPHPFunctionItems(phpFunctionProjectManager, position, wordWithExtraChars);
  if (phpFunctionItems) {
    items.push(...phpFunctionItems);
  }

  return items;
}

function getPHPFunctionItems(
  phpFunctionProjectManager: PHPFunctionProjectManagerType,
  position: Position,
  wordWithExtraChars: string | undefined
) {
  const items: CompletionItem[] = [];

  const phpFunctions = Array.from(phpFunctionProjectManager.list());

  for (const phpFunction of phpFunctions) {
    // MEMO: No uppercase beginning function is needed in this context
    // e.g. PS_UNRESERVE_PREFIX___halt_compiler()
    if (
      phpFunction[0].slice(0, 1).match(/[A-Za-z]/) &&
      phpFunction[0].slice(0, 1) === phpFunction[0].slice(0, 1).toUpperCase()
    )
      continue;

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

    const detail = phpFunction[1].path;

    let documentation: string | undefined = undefined;
    if (phpFunction[1].arguments) {
      documentation = '```php\n<?php\n';
      documentation += `function ${phpFunction[0]}(`;
      for (const [index, args] of phpFunction[1].arguments.entries()) {
        if (index !== 0) {
          documentation += ', ';
        }
        if (args.typehint) {
          documentation += args.typehint + ' ';
        }
        if (args.byref) {
          documentation += '&';
        }
        if (args.nullable) {
          documentation += '?';
        }
        if (args.variadic) {
          documentation += '...';
        }

        documentation += '$' + args.name;
      }
      documentation += ') {}';
      documentation += '\n```';
    }

    items.push({
      label: phpFunction[0],
      kind: CompletionItemKind.Function,
      detail,
      insertTextFormat: InsertTextFormat.Snippet,
      documentation: documentation
        ? {
            kind: MarkupKind.Markdown,
            value: documentation,
          }
        : undefined,
      textEdit: edit,
    });
  }

  return items;
}
