import { CompletionItem, LinesTextDocument, Position, workspace } from 'coc.nvim';

import { kebabCase } from 'case-anything';
import * as htmlLanguageService from 'vscode-html-languageservice';

import { ComponentMapValueType } from '../../projects/types';
import {
  isBladeEchoRegionByOffset,
  isDirectiveWithParametersRegionByOffset,
  isPHPDirectiveRegionByOffset,
} from '../shared';

export function getComponentTagsData(components: [string, ComponentMapValueType][]) {
  const tags: htmlLanguageService.ITagData[] = [];
  for (const component of components) {
    const attributes: htmlLanguageService.IAttributeData[] = [];

    if (component[1].props.length) {
      for (const prop of component[1].props) {
        if (!isNaN(Number(prop.propsKey))) {
          attributes.push({
            name: kebabCase(prop.propsValue),
          });
          attributes.push({
            name: ':' + kebabCase(prop.propsValue),
          });
        } else {
          attributes.push({
            name: kebabCase(prop.propsKey),
            description: prop.propsValue,
            values: [],
          });
          attributes.push({
            name: ':' + kebabCase(prop.propsKey),
            description: prop.propsValue,
            values: [],
          });
        }
      }
    }

    const references: htmlLanguageService.IReference[] = [];
    if (component[1].props.length) {
      for (const prop of component[1].props) {
        references.push({
          name: prop.propsKey,
          url: prop.propsValue,
        });
      }
    }

    const tag: htmlLanguageService.ITagData = {
      name: component[0],
      description: {
        kind: 'markdown',
        value: component[1].path.replace(workspace.root, '').replace(/^\//, ''),
      },
      attributes,
      references,
    };

    tags.push(tag);
  }

  return tags;
}

export function getComponentCompletionItems(
  tags: htmlLanguageService.ITagData[],
  document: LinesTextDocument,
  position: Position
) {
  const items: CompletionItem[] = [];

  const provider = htmlLanguageService.newHTMLDataProvider('bladeTag', {
    version: 1,
    tags,
    //globalAttributes,
    //valueSets,
  });

  const languageOptions: htmlLanguageService.LanguageServiceOptions = {
    useDefaultDataProvider: false,
    customDataProviders: [provider],
  };

  const ls = htmlLanguageService.getLanguageService(languageOptions);
  const htmlDoc = ls.parseHTMLDocument(document);
  const htmlCompletionList = ls.doComplete(document, position, htmlDoc);

  items.push(...htmlCompletionList.items);

  return items;
}

export function canCompletionFromContext(code: string, editorOffset: number) {
  if (isBladeEchoRegionByOffset(code, editorOffset)) return false;
  if (isDirectiveWithParametersRegionByOffset(code, editorOffset)) return false;
  if (isPHPDirectiveRegionByOffset(code, editorOffset)) return false;

  return true;
}
