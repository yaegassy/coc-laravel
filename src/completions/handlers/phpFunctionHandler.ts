import {
  CancellationToken,
  CompletionContext,
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

import { getArtisanPath, runTinkerReflection } from '../../common/shared';
import { stripInitialNewline } from '../../common/utils';
import { type PHPFunctionProjectManagerType } from '../../projects/types';
import * as phpFunctionCompletionService from '../services/phpFunctionService';
import { CompletionItemDataType } from '../types';

type ReflectorFunctionType = {
  returnType: string[] | null;
  parameters: ReflectorParameterType[];
};

type ReflectorParameterType = {
  name: string;
  position: number;
  allowsNull: boolean;
  canBePassedByValue: boolean;
  defaultValue: string | null;
  isOptional: boolean;
  isPassedByReference: boolean;
  isVariadic: boolean;
  type: string | null;
  __toString: string;
};

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

  const phpFunctionItems = getPHPFunctionItems(phpFunctionProjectManager, position, wordWithExtraChars, context);
  if (phpFunctionItems) {
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

export async function doResolveCompletionItem(
  item: CompletionItem,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _token: CancellationToken
) {
  if (!item.data) return item;

  const itemData = item.data as CompletionItemDataType;
  if (itemData.source !== 'laravel-php-function') return item;
  if (!itemData.filePath) return item;

  const artisanPath = getArtisanPath();
  if (!artisanPath) return item;

  const reflectionCode = stripInitialNewline(`
\\$reflector = new ReflectionFunction('${item.label}');
\\$hasReturnType = \\$reflector->hasReturnType();
\\$returnType = [];
if (\\$hasReturnType) {
    \\$reflectionType = \\$reflector->getReturnType();
    if (\\$reflectionType instanceof ReflectionNamedType) {
        \\$returnType = [\\$reflectionType->getName()];
    } elseif (\\$reflectionType instanceof ReflectionUnionType) {
        \\$returnType = array_map(function (ReflectionNamedType \\$type) {
            return \\$type->getName();
        }, \\$reflectionType->getTypes());
    }
}
\\$parameters = array_map(function (ReflectionParameter \\$param) {
    return [
        'name' => \\$param->getName(),
        'position' => \\$param->getPosition(),
        'allowsNull' => \\$param->allowsNull(),
        'canBePassedByValue' => \\$param->canBePassedByValue(),
        'defaultValue' => \\$param->isDefaultValueAvailable() ? \\$param->getDefaultValue() : null,
        'isOptional' => \\$param->isOptional(),
        'isPassedByReference' => \\$param->isPassedByReference(),
        'isVariadic' => \\$param->isVariadic(),
        'type' => \\$param->hasType() ? (string) \\$param->getType() : null,
        '__toString' => \\$param->__toString(),
    ];
}, \\$reflector->getParameters());
echo json_encode(['returnType' => \\$returnType, 'parameters' => \\$parameters], JSON_PRETTY_PRINT);
`);

  let documentationValue = '';
  documentationValue += `${itemData.filePath}\n`;

  // Temporary assignment to item.documantaion in case tinker fails
  item.documentation = documentationValue;
  // Reset documentationValue
  documentationValue = '';

  const resJsonStr = await runTinkerReflection(reflectionCode, artisanPath);
  if (!resJsonStr) return item;

  const reflectorFunction = JSON.parse(resJsonStr) as ReflectorFunctionType;

  // documentation & detail
  if (reflectorFunction) {
    let detail = '';

    detail += `${item.label}(`;

    if (reflectorFunction.parameters.length > 0) {
      for (const [i, v] of reflectorFunction.parameters.entries()) {
        if (i !== 0) {
          detail += `, `;
        }

        if (v.type) {
          detail += `${v.type} `;
        }

        detail += '$' + v.name;

        if (v.defaultValue) {
          detail += ` = ${v.defaultValue}`;
        }
      }
    }

    detail += `)`;

    // returnType
    if (reflectorFunction.returnType && reflectorFunction.returnType.length > 0) {
      detail += `: `;
      for (const [i, v] of reflectorFunction.returnType.entries()) {
        if (i !== 0) {
          detail += `|`;
        }
        detail += v;
      }
    }

    // parameters
    if (reflectorFunction.parameters.length > 0) {
      for (const p of reflectorFunction.parameters) {
        documentationValue += `${p.__toString}\n`;
      }
    }

    item.detail = detail;
  }

  documentationValue += itemData.filePath;

  const documentation: MarkupContent = {
    kind: 'markdown',
    value: documentationValue,
  };

  item.documentation = documentation;

  return item;
}
