import { CompletionItem, LinesTextDocument, Position, workspace } from 'coc.nvim';

import * as htmlLanguageService from 'vscode-html-languageservice';

import { LivewireMapValueType } from '../../projects/types';
import {
  isBladeEchoRegionByOffset,
  isDirectiveWithParametersRegionByOffset,
  isInlinePHPRegionByOffset,
  isPHPDirectiveRegionByOffset,
} from '../shared';

export function getLivewireActionGlobalAttributeAndValueSetsData(livewireComponent: [string, LivewireMapValueType]) {
  const globalAttributes: htmlLanguageService.IAttributeData[] = [];
  const valueSets: htmlLanguageService.IValueSet[] = [];

  const wireClickAttributes = workspace.getConfiguration('laravel').get<string[]>('livewire.wireClickAttributes', []);
  const wireModelAttributes = workspace.getConfiguration('laravel').get<string[]>('livewire.wireModelAttributes', []);

  //
  // methods | wire:click related
  //

  const methodValueSetValues: htmlLanguageService.IValueData[] = [];
  for (const method of livewireComponent[1].methods) {
    let description: string | undefined = undefined;
    if (method.arguments) {
      description = '```\n';
      description += `(`;
      for (const [index, args] of method.arguments.entries()) {
        if (index !== 0) {
          description += ', ';
        }
        if (args.typehint) {
          description += args.typehint + ' ';
        }
        if (args.byref) {
          description += '&';
        }
        if (args.nullable) {
          description += '?';
        }
        if (args.variadic) {
          description += '...';
        }

        description += '$' + args.name;
      }
      description += ')';
      description += '\n```';
    }

    methodValueSetValues.push({
      name: method.name,
      description,
      //references
    });
  }
  if (methodValueSetValues) {
    valueSets.push({
      name: 'wire-click',
      values: methodValueSetValues,
    });

    for (const wireClickAttribute of wireClickAttributes) {
      globalAttributes.push({
        name: `wire:${wireClickAttribute}`,
        valueSet: 'wire-click',
      });
    }

    // TODO: ...and more, e.g. wire:click.prefetch, etc
  }

  //
  // properties | wire:model related
  //

  const propertyValueSetValues: htmlLanguageService.IValueData[] = [];
  for (const property of livewireComponent[1].properties) {
    propertyValueSetValues.push({
      name: property.name,
      //description
      //references
    });
  }

  if (propertyValueSetValues) {
    valueSets.push({
      name: 'wire-model',
      values: propertyValueSetValues,
    });

    for (const wireModelAttribute of wireModelAttributes) {
      globalAttributes.push({
        name: `wire:${wireModelAttribute}`,
        valueSet: 'wire-model',
      });
    }

    // TODO: ...and more, e.g. wire:model.debounce.100ms, etc
  }

  return { globalAttributes, valueSets };
}

export function getComponentCompletionItems(
  document: LinesTextDocument,
  position: Position,
  globalAttributes?: htmlLanguageService.IAttributeData[],
  valueSets?: htmlLanguageService.IValueSet[]
) {
  const items: CompletionItem[] = [];

  const provider = htmlLanguageService.newHTMLDataProvider('livewireAction', {
    version: 1,
    tags: undefined,
    globalAttributes,
    valueSets,
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
