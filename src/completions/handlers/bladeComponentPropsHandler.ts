import {
  CompletionItem,
  CompletionItemKind,
  InsertTextFormat,
  LinesTextDocument,
  Position,
  SnippetString,
  TextEdit,
  workspace,
} from 'coc.nvim';

import { kebabCase } from 'case-anything';

import { type BladeProjectsManagerType } from '../../projects/types';
import * as bladeComponentPropsCompletionService from '../services/bladeComponentPropsService';

type PropItemType = {
  name: string;
  default?: string;
};

export async function doCompletion(
  document: LinesTextDocument,
  position: Position,
  bladeProjectManager: BladeProjectsManagerType
) {
  if (document.languageId !== 'blade') return [];

  const items: CompletionItem[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  const code = document.getText();

  const cursolPositionComponent = bladeComponentPropsCompletionService.getCursolPostionComponent(code, position);
  if (!cursolPositionComponent) return [];

  const component = bladeProjectManager.componentMapStore.get(cursolPositionComponent);
  if (!component) return [];

  let wordWithExtraChars: string | undefined = undefined;
  const wordWithExtraCharsRange = doc.getWordRangeAtPosition(
    Position.create(position.line, position.character - 1),
    '-'
  );
  if (wordWithExtraCharsRange) {
    wordWithExtraChars = document.getText(wordWithExtraCharsRange);
  }

  const props: PropItemType[] = [];
  for (const componentProp of component.props) {
    if (!isNaN(Number(componentProp.propsKey))) {
      props.push({
        name: kebabCase(componentProp.propsValue),
      });
      props.push({
        name: ':' + kebabCase(componentProp.propsValue),
      });
    } else {
      props.push({
        name: kebabCase(componentProp.propsKey),
        default: componentProp.propsValue,
      });
      props.push({
        name: ':' + kebabCase(componentProp.propsKey),
        default: componentProp.propsValue,
      });
    }
  }

  for (const prop of props) {
    const adjustStartCharacter = wordWithExtraChars
      ? position.character - wordWithExtraChars.length
      : position.character;
    const edit: TextEdit = {
      range: {
        start: { line: position.line, character: adjustStartCharacter },
        end: position,
      },
      newText: prop.default
        ? new SnippetString(`${prop.name}="\${1:${prop.default}}"`).value
        : new SnippetString(`${prop.name}="\${1}"`).value,
    };

    items.push({
      label: prop.name,
      kind: CompletionItemKind.Text,
      insertTextFormat: InsertTextFormat.Snippet,
      textEdit: edit,
    });
  }

  return items;
}
