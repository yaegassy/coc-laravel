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
  phpFunctionProjectManager: PHPFunctionProjectManagerType
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

    const data: CompletionItemDataType = {
      source: 'laravel-php-function',
      filePath: phpFunction[1].path,
      isStubs: phpFunction[1].isStubs,
    };

    items.push({
      label: phpFunction[0],
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

  const resoveItem = item.data as CompletionItemDataType;
  if (resoveItem.source !== 'laravel-php-function') return item;
  if (!resoveItem.filePath) return item;

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
  documentationValue += `${resoveItem.filePath}\n`;

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

  documentationValue += resoveItem.filePath;

  const documentation: MarkupContent = {
    kind: 'markdown',
    value: documentationValue,
  };

  item.documentation = documentation;

  return item;
}
