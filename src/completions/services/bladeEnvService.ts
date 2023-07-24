import {
  isCallNameFuncInBladeEchoFromOffset,
  isCallNameFuncInComponentPropsFromOffset,
  isCallNameFuncInDirectiveWithParametersFromOffset,
  isCallNameFuncInPHPDirectiveFromOffset,
} from '../shared';

export function canCompletionFromContext(code: string, editorOffset: number) {
  const flags: boolean[] = [];

  flags.push(isCallNameFuncInBladeEchoFromOffset(code, editorOffset, 'env'));
  flags.push(isCallNameFuncInPHPDirectiveFromOffset(code, editorOffset, 'env'));
  flags.push(isCallNameFuncInDirectiveWithParametersFromOffset(code, editorOffset, 'env'));
  flags.push(isCallNameFuncInComponentPropsFromOffset(code, editorOffset, 'env'));

  if (flags.includes(true)) {
    return true;
  } else {
    return false;
  }
}
