import {
  isCallNameFuncInBladeEchoFromOffset,
  isCallNameFuncInComponentPropsFromOffset,
  isCallNameFuncInDirectiveWithParametersFromOffset,
  isCallNameFuncInInlinePHPFromOffset,
  isCallNameFuncInPHPDirectiveFromOffset,
  isTargetDirectiveWithParametersFromOffset,
} from '../shared';

export function canCompletionFromContext(code: string, editorOffset: number) {
  const flags: boolean[] = [];

  //
  // Function
  //

  flags.push(isCallNameFuncInBladeEchoFromOffset(code, editorOffset, '__'));
  flags.push(isCallNameFuncInPHPDirectiveFromOffset(code, editorOffset, '__'));
  flags.push(isCallNameFuncInInlinePHPFromOffset(code, editorOffset, '__'));
  flags.push(isCallNameFuncInDirectiveWithParametersFromOffset(code, editorOffset, '__'));
  flags.push(isCallNameFuncInComponentPropsFromOffset(code, editorOffset, '__'));

  flags.push(isCallNameFuncInBladeEchoFromOffset(code, editorOffset, 'trans'));
  flags.push(isCallNameFuncInPHPDirectiveFromOffset(code, editorOffset, 'trans'));
  flags.push(isCallNameFuncInInlinePHPFromOffset(code, editorOffset, 'trans'));
  flags.push(isCallNameFuncInDirectiveWithParametersFromOffset(code, editorOffset, 'trans'));
  flags.push(isCallNameFuncInComponentPropsFromOffset(code, editorOffset, 'trans'));

  //
  // TargetDirectiveParameter
  //

  flags.push(isTargetDirectiveWithParametersFromOffset(code, editorOffset, 'lang'));

  if (flags.includes(true)) {
    return true;
  } else {
    return false;
  }
}
