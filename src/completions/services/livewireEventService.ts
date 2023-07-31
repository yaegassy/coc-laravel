import { CompletionItem, LinesTextDocument, Position, workspace } from 'coc.nvim';

import * as htmlLanguageService from 'vscode-html-languageservice';

import {
  isBladeEchoRegionByOffset,
  isDirectiveWithParametersRegionByOffset,
  isInlinePHPRegionByOffset,
  isPHPDirectiveRegionByOffset,
} from '../shared';

export function getLivewireEventGlobalAttributeData() {
  const globalAttributes: htmlLanguageService.IAttributeData[] = [];

  const attributes = workspace.getConfiguration('laravel').get<string[]>('livewire.wireEventAttributes', []);

  if (attributes.length > 0) {
    for (const attribute of attributes) {
      globalAttributes.push({
        name: `wire:${attribute}`,
      });
    }
  }

  return globalAttributes;
}

export function getComponentCompletionItems(
  document: LinesTextDocument,
  position: Position,
  globalAttributes: htmlLanguageService.IAttributeData[]
) {
  const items: CompletionItem[] = [];

  const provider = htmlLanguageService.newHTMLDataProvider('livewireEvent', {
    version: 1,
    globalAttributes,
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
