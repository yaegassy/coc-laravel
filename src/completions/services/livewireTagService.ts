import { CompletionItem, LinesTextDocument, Position, workspace } from 'coc.nvim';

import { kebabCase } from 'case-anything';
import * as htmlLanguageService from 'vscode-html-languageservice';

import { LivewireMapValueType } from '../../projects/types';
import {
  isBladeEchoRegionByOffset,
  isDirectiveWithParametersRegionByOffset,
  isInlinePHPRegionByOffset,
  isPHPDirectiveRegionByOffset,
} from '../shared';

export function getLivewireTagsData(livewireComponents: [string, LivewireMapValueType][]) {
  const tags: htmlLanguageService.ITagData[] = [];
  for (const livewireComponent of livewireComponents) {
    const attributes: htmlLanguageService.IAttributeData[] = [];

    // props
    if (livewireComponent[1].properties.length > 0) {
      for (const prop of livewireComponent[1].properties) {
        attributes.push({
          name: kebabCase(prop.name),
          description: prop.value,
          values: [],
        });
        attributes.push({
          name: ':' + kebabCase(prop.name),
          description: prop.value,
          values: [],
        });
      }
    }

    // Reference
    const references: htmlLanguageService.IReference[] = [];
    if (livewireComponent[1].properties.length) {
      for (const prop of livewireComponent[1].properties) {
        references.push({
          name: prop.name,
          url: prop.value,
        });
      }
    }

    const tag: htmlLanguageService.ITagData = {
      name: 'livewire:' + livewireComponent[0],
      description: {
        kind: 'markdown',
        value: livewireComponent[1].filePath.replace(workspace.root, '').replace(/^\//, ''),
      },
      attributes,
      references,
    };

    tags.push(tag);
  }

  return tags;
}

export function getComponentCompletionItems(
  document: LinesTextDocument,
  position: Position,
  tags: htmlLanguageService.ITagData[]
) {
  const items: CompletionItem[] = [];

  const provider = htmlLanguageService.newHTMLDataProvider('livewireComponent', {
    version: 1,
    tags,
    globalAttributes: [],
    valueSets: [],
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
  if (isInlinePHPRegionByOffset(code, editorOffset)) return false;

  return true;
}
