import { CompletionItemKind } from 'coc.nvim';

import * as bladeParser from '../../parsers/blade/parser';
import { PHPClassItemKindEnum } from '../../projects/types';

import {
  isEditorOffsetInBladeEchoRegionOfPhpNodeKind,
  isEditorOffsetInDirectiveWithParametersRegionOfPhpNodeKind,
  isEditorOffsetInInlinePHPRegionOfPhpNodeKind,
  isEditorOffsetInPHPDirectiveRegionOfPhpNodeKind,
  isEditorOffsetInPropsValueRegionOfPhpNodeKind,
} from '../shared';

export function canCompletionFromContext(code: string, editorOffset: number) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return undefined;

  const flags: boolean[] = [];

  flags.push(isEditorOffsetInBladeEchoRegionOfPhpNodeKind(code, editorOffset, 'name'));
  flags.push(isEditorOffsetInPHPDirectiveRegionOfPhpNodeKind(code, editorOffset, 'name'));
  flags.push(isEditorOffsetInInlinePHPRegionOfPhpNodeKind(code, editorOffset, 'name'));
  flags.push(isEditorOffsetInDirectiveWithParametersRegionOfPhpNodeKind(code, editorOffset, 'name'));
  flags.push(isEditorOffsetInPropsValueRegionOfPhpNodeKind(code, editorOffset, 'name'));

  if (flags.includes(true)) {
    return true;
  } else {
    return false;
  }
}

export function getCompletionItemKindAtClassItemKind(classItemKind: PHPClassItemKindEnum) {
  if (classItemKind === PHPClassItemKindEnum.Class) {
    return CompletionItemKind.Class;
  } else if (classItemKind === PHPClassItemKindEnum.Interface) {
    return CompletionItemKind.Interface;
  } else if (classItemKind === PHPClassItemKindEnum.Trait) {
    return CompletionItemKind.Module;
  } else if (classItemKind === PHPClassItemKindEnum.Enum) {
    return CompletionItemKind.Enum;
  }

  return undefined;
}
