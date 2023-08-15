import {
  CancellationToken,
  CompletionItem,
  CompletionItemKind,
  InsertTextFormat,
  LinesTextDocument,
  MarkupContent,
  Position,
  SnippetString,
  TextEdit,
  workspace,
} from 'coc.nvim';

import { runTinkerReflection } from '../../common/shared';
import { StaticClassMemberDataType } from '../../common/types';
import { stripInitialNewline } from '../../common/utils';
import { type PHPClassProjectManagerType } from '../../projects/types';
import * as phpStaticClassCompletionService from '../services/phpStaticClassService';
import { CompletionItemDataType } from '../types';

export async function doCompletion(
  document: LinesTextDocument,
  position: Position,
  phpClassProjectManager: PHPClassProjectManagerType,
  artisanPath: string
) {
  if (document.languageId !== 'blade') return [];

  const items: CompletionItem[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  const code = document.getText();
  const offset = document.offsetAt(position);

  if (!phpStaticClassCompletionService.canCompletionFromContext(code, offset)) return [];

  let wordWithExtraChars: string | undefined = undefined;
  const wordWithExtraCharsRange = doc.getWordRangeAtPosition(
    Position.create(position.line, position.character - 1),
    '_\\:'
  );
  if (wordWithExtraCharsRange) {
    wordWithExtraChars = document.getText(wordWithExtraCharsRange);
  }
  if (!wordWithExtraChars) return [];

  const staticClassItems = await getStaticClassItems(phpClassProjectManager, position, wordWithExtraChars, artisanPath);

  if (staticClassItems) {
    items.push(...staticClassItems);
  }

  return items;
}

async function getStaticClassItems(
  phpClassProjectManager: PHPClassProjectManagerType,
  position: Position,
  wordWithExtraChars: string,
  artisanPath: string
) {
  const items: CompletionItem[] = [];

  const className = wordWithExtraChars.split('::')[0];

  const reflectionCode = stripInitialNewline(`
\\$reflector = new ReflectionClass('${className}');
\\$classConstants = array_keys(\\$reflector->getConstants());
\\$staticMethods = array_values(
    array_filter(
        array_map(fn(ReflectionMethod \\$m) => \\$m->isStatic() ? \\$m->getName() : null, \\$reflector->getMethods()),
        fn(\\$v) => !is_null(\\$v)
    )
);
echo json_encode(['classConstants' => \\$classConstants, 'staticMethods' => \\$staticMethods], JSON_PRETTY_PRINT);
`);

  const resJsonStr = await runTinkerReflection(reflectionCode, artisanPath);
  if (!resJsonStr) return;

  const memberData = JSON.parse(resJsonStr) as StaticClassMemberDataType;

  const classStoreData = phpClassProjectManager.phpClassMapStore.get(className);
  if (!classStoreData) return [];

  items.push({
    label: 'class',
    kind: CompletionItemKind.Constant,
    insertTextFormat: InsertTextFormat.PlainText,
    commitCharacters: [':'],
  });

  for (const classConstant of memberData.classConstants) {
    const data: CompletionItemDataType = {
      source: 'laravel-php-static-class',
      className,
    };

    items.push({
      label: classConstant,
      kind: CompletionItemKind.Constant,
      insertTextFormat: InsertTextFormat.PlainText,
      commitCharacters: [':'],
      data,
    });
  }

  for (const staticMethod of memberData.staticMethods) {
    const edit: TextEdit = {
      range: {
        start: position,
        end: { line: position.line, character: position.character + staticMethod.length },
      },
      newText: new SnippetString(`${staticMethod}(\${1})`).value,
    };

    const data: CompletionItemDataType = {
      source: 'laravel-php-static-class',
      className,
    };

    items.push({
      label: staticMethod,
      kind: CompletionItemKind.Method,
      insertTextFormat: InsertTextFormat.Snippet,
      commitCharacters: [':'],
      textEdit: edit,
      sortText: staticMethod.startsWith('_') ? `zzz_${staticMethod}` : staticMethod,
      data,
    });
  }

  return items;
}

export async function doResolveCompletionItem(
  item: CompletionItem,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _token: CancellationToken,
  artisanPath: string
) {
  if (!item.data) return item;

  const itemData = item.data as CompletionItemDataType;
  if (itemData.source !== 'laravel-php-static-class') return item;
  if (!itemData.className) return item;
  const className = itemData.className;

  let documentationValue = '';

  if (item.kind === CompletionItemKind.Constant) {
    const code = stripInitialNewline(`
\\$reflector = new ReflectionClass('${className}');
echo json_encode(\\$reflector->getConstant('${item.label}'));
`);
    const resJsonStr = await runTinkerReflection(code, artisanPath);
    if (!resJsonStr) return item;

    const classConstantValue = JSON.parse(resJsonStr) as string | false;
    if (!classConstantValue) return item;

    documentationValue += '```php\n<?php\n';
    documentationValue += `public const ${item.label} = "${classConstantValue}";\n`;
    documentationValue += '```\n';
  } else if (item.kind === CompletionItemKind.Method) {
    const code = stripInitialNewline(`
\\$reflector = new ReflectionClass('${className}');
\\$staticMethod = \\$reflector->getMethod('${item.label}');
echo json_encode(\\$staticMethod->__toString());
`);

    const resJsonStr = await runTinkerReflection(code, artisanPath);
    if (!resJsonStr) return item;

    const staticMethodData = JSON.parse(resJsonStr) as string;
    if (!staticMethodData) return item;

    documentationValue += '```php\n<?php\n';
    documentationValue += staticMethodData;
    documentationValue += '```\n';
  }

  const documentation: MarkupContent = {
    kind: 'markdown',
    value: documentationValue,
  };

  item.documentation = documentation;

  return item;
}
