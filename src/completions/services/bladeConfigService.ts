import {
  isCallNameFuncInBladeEchoFromOffset,
  isCallNameFuncInComponentPropsFromOffset,
  isCallNameFuncInDirectiveWithParametersFromOffset,
  isCallNameFuncInPHPDirectiveFromOffset,
} from '../shared';

export function canCompletionFromContext(code: string, editorOffset: number) {
  const flags: boolean[] = [];

  flags.push(isCallNameFuncInBladeEchoFromOffset(code, editorOffset, 'config'));
  flags.push(isCallNameFuncInPHPDirectiveFromOffset(code, editorOffset, 'config'));
  flags.push(isCallNameFuncInDirectiveWithParametersFromOffset(code, editorOffset, 'config'));
  flags.push(isCallNameFuncInComponentPropsFromOffset(code, editorOffset, 'config'));

  if (flags.includes(true)) {
    return true;
  } else {
    return false;
  }
}
