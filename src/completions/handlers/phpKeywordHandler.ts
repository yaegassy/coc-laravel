import { CompletionItem, CompletionItemKind, LinesTextDocument, Position, TextEdit, workspace } from 'coc.nvim';

import * as phpKeywordCompletionService from '../services/phpKeywordService';

export async function doCompletion(document: LinesTextDocument, position: Position) {
  if (document.languageId !== 'blade') return [];

  const items: CompletionItem[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  const code = document.getText();
  const offset = document.offsetAt(position);
  if (!phpKeywordCompletionService.canCompletionFromContext(code, offset)) return [];

  let wordWithExtraChars: string | undefined = undefined;
  const wordWithExtraCharsRange = doc.getWordRangeAtPosition(
    Position.create(position.line, position.character - 1),
    '_:\\$'
  );
  if (wordWithExtraCharsRange) {
    wordWithExtraChars = document.getText(wordWithExtraCharsRange);
  }

  // add filtering string to prevent response to other triggers
  if (wordWithExtraChars?.includes('\\') || wordWithExtraChars?.includes(':') || wordWithExtraChars?.includes('$'))
    return [];

  const phpFunctionItems = getKeywordCompletionItems(position, wordWithExtraChars);
  if (phpFunctionItems) {
    items.push(...phpFunctionItems);
  }

  return items;
}

function getKeywordCompletionItems(position: Position, wordWithExtraChars: string | undefined) {
  const items: CompletionItem[] = [];

  const keywords = [
    // https://www.php.net/manual/en/reserved.keywords.php
    '__halt_compiler',
    'abstract',
    'and',
    'array',
    'as',
    'break',
    'callable',
    'case',
    'catch',
    'class',
    'clone',
    'const',
    'continue',
    'declare',
    'default',
    'die',
    'do',
    'echo',
    'else',
    'elseif',
    'empty',
    'enddeclare',
    'endfor',
    'endforeach',
    'endif',
    'endswitch',
    'endwhile',
    'eval',
    'exit',
    'extends',
    //'false', // Exclude this keyword because it is provided in the php constant completion
    'final',
    'finally',
    'for',
    'foreach',
    'function',
    'global',
    'goto',
    'if',
    'implements',
    'include',
    'include_once',
    'instanceof',
    'insteadof',
    'interface',
    'isset',
    'list',
    'namespace',
    'new',
    //'null', // Exclude this keyword because it is provided in the php constant completion
    'or',
    'print',
    'private',
    'protected',
    'public',
    'require',
    'require_once',
    'return',
    'static',
    'switch',
    'throw',
    'trait',
    //'true', // Exclude this keyword because it is provided in the php constant completion
    'try',
    'unset',
    'use',
    'var',
    'while',
    'xor',
    'yield',

    // List of other reserved words (http://php.net/manual/en/reserved.other-reserved-words.php)
    'int',
    'float',
    'bool',
    'string',
    'void',
    'iterable',
    'object',

    // Pseudo keywords
    'from', // As in yield from
    'strict_types',
    'ticks', // As in declare(ticks=1)
    'encoding', // As in declare(encoding='EBCDIC')
  ];

  for (const keyword of keywords) {
    const adjustStartCharacter = wordWithExtraChars
      ? position.character - wordWithExtraChars.length
      : position.character;

    const edit: TextEdit = {
      range: {
        start: { line: position.line, character: adjustStartCharacter },
        end: position,
      },
      newText: keyword,
    };

    items.push({
      label: keyword,
      kind: CompletionItemKind.Keyword,
      textEdit: edit,
    });
  }

  return items;
}
