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

  flags.push(isEditorOffsetInBladeEchoRegionOfPhpNodeKind(code, editorOffset, 'variable'));
  flags.push(isEditorOffsetInPHPDirectiveRegionOfPhpNodeKind(code, editorOffset, 'variable'));
  flags.push(isEditorOffsetInInlinePHPRegionOfPhpNodeKind(code, editorOffset, 'variable'));
  flags.push(isEditorOffsetInDirectiveWithParametersRegionOfPhpNodeKind(code, editorOffset, 'variable'));
  flags.push(isEditorOffsetInPropsValueRegionOfPhpNodeKind(code, editorOffset, 'variable'));

  if (flags.includes(true)) {
    return true;
  } else {
    return false;
  }
}
