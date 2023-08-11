import * as bladeParser from '../../parsers/blade/parser';

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

  flags.push(isEditorOffsetInBladeEchoRegionOfPhpNodeKind(code, editorOffset, 'useitem'));
  flags.push(isEditorOffsetInPHPDirectiveRegionOfPhpNodeKind(code, editorOffset, 'useitem'));
  flags.push(isEditorOffsetInInlinePHPRegionOfPhpNodeKind(code, editorOffset, 'useitem'));
  flags.push(isEditorOffsetInDirectiveWithParametersRegionOfPhpNodeKind(code, editorOffset, 'name'));
  flags.push(isEditorOffsetInPropsValueRegionOfPhpNodeKind(code, editorOffset, 'useitem'));

  if (flags.includes(true)) {
    return true;
  } else {
    return false;
  }
}
