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

import * as bladeCommon from '../../common/blade';
import { runTinkerReflection } from '../../common/shared';
import { quoteForTerminalExecution, stripInitialNewline } from '../../common/utils';
import * as bladeParser from '../../parsers/blade/parser';
import * as phpObjectMemberCompletionService from '../services/phpObjectMemberService';
import { CompletionItemDataType } from '../types';

export async function doCompletion(document: LinesTextDocument, position: Position, artisanPath: string) {
  if (document.languageId !== 'blade') return [];

  const items: CompletionItem[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  const code = document.getText();
  const offset = document.offsetAt(position);

  if (!phpObjectMemberCompletionService.canCompletionFromContext(code, offset)) return [];

  let wordWithExtraChars: string | undefined = undefined;
  const wordWithExtraCharsRange = doc.getWordRangeAtPosition(
    Position.create(position.line, position.character - 1),
    '_$->'
  );
  if (wordWithExtraCharsRange) {
    wordWithExtraChars = document.getText(wordWithExtraCharsRange);
  }
  if (!wordWithExtraChars) return [];

  const objectMemberCompletionItems = await getObjectCompletionItems(
    code,
    position,
    offset,
    wordWithExtraChars,
    artisanPath
  );

  if (objectMemberCompletionItems.length > 0) {
    items.push(...objectMemberCompletionItems);
  }

  return items;
}

async function getObjectCompletionItems(
  code: string,
  position: Position,
  editorOffset: number,
  wordWithExtraChars: string,
  artisanPath: string
) {
  const items: CompletionItem[] = [];

  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return [];

  const beforeInputString = code.slice(0, editorOffset - wordWithExtraChars.length);
  const afterInputString = code.slice(editorOffset, code.length - 1);
  const dummyCode = "'__DUMMY__';";
  const replacedCode = beforeInputString + dummyCode + afterInputString;

  const virtualPhpCode = bladeCommon.generateVirtualPhpEvalCode(replacedCode);
  if (!virtualPhpCode) return [];

  const quotedVirtualPhpCode = quoteForTerminalExecution(virtualPhpCode);

  const objectName = wordWithExtraChars.split('->')[0];

  const reflectionCode = stripInitialNewline(`
${quotedVirtualPhpCode}

try {
     \\$reflector = new ReflectionObject(\\${objectName});
     echo json_encode(array_map(fn(ReflectionMethod \\$m) => \\$m->name, \\$reflector->getMethods()));
} catch (\\Throwable \\$th) {}
`);

  const methods: string[] = [];

  try {
    const resJsonStr = await runTinkerReflection(reflectionCode, artisanPath);
    if (resJsonStr) {
      const resMethods = JSON.parse(resJsonStr) as string[];
      methods.push(...resMethods);
    }
  } catch (e) {}

  if (methods.length === 0) return [];

  for (const m of methods) {
    const edit: TextEdit = {
      range: {
        start: position,
        end: { line: position.line, character: position.character - m.length },
      },
      newText: new SnippetString(`${m}(\${1})`).value,
    };

    const data: CompletionItemDataType = {
      source: 'laravel-php-object-member',
      objectName: objectName,
      virtualContent: virtualPhpCode,
    };

    items.push({
      label: m,
      kind: CompletionItemKind.Method,
      insertTextFormat: InsertTextFormat.Snippet,
      commitCharacters: ['>'],
      textEdit: edit,
      sortText: m.startsWith('_') ? `zzz_${m}` : m,
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
  if (itemData.source !== 'laravel-php-object-member') return item;
  if (!itemData.objectName) return item;
  const objectName = itemData.objectName;

  if (!itemData.virtualContent) return item;
  const virtualContent = itemData.virtualContent;

  const quotedVirtualPhpCode = quoteForTerminalExecution(virtualContent);

  const reflectionCode = stripInitialNewline(`
${quotedVirtualPhpCode}

try {
  \\$reflector = new ReflectionObject(\\${objectName});
  \\$method = \\$reflector->getMethod('${item.label}');
  echo json_encode(\\$method->__toString());
} catch (\\Throwable \\$th) {}
`);

  const resJsonStr = await runTinkerReflection(reflectionCode, artisanPath);
  if (!resJsonStr) return item;

  const methodData = JSON.parse(resJsonStr) as string;
  if (!methodData) return item;

  let documentationValue = '';
  documentationValue += '```php\n<?php\n';
  documentationValue += methodData;
  documentationValue += '```\n';

  const documentation: MarkupContent = {
    kind: 'markdown',
    value: documentationValue,
  };

  item.documentation = documentation;

  return item;
}
