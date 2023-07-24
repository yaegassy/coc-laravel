import {
  isCallNameFuncInBladeEchoFromOffset,
  isCallNameFuncInComponentPropsFromOffset,
  isCallNameFuncInDirectiveWithParametersFromOffset,
  isCallNameFuncInPHPDirectiveFromOffset,
  isTargetDirectiveWithParametersFromOffset,
} from '../shared';

export function canCompletionFromContext(code: string, editorOffset: number) {
  const flags: boolean[] = [];

  //
  // Function
  //

  flags.push(isCallNameFuncInBladeEchoFromOffset(code, editorOffset, 'view'));
  flags.push(isCallNameFuncInPHPDirectiveFromOffset(code, editorOffset, 'view'));
  flags.push(isCallNameFuncInDirectiveWithParametersFromOffset(code, editorOffset, 'view'));
  flags.push(isCallNameFuncInComponentPropsFromOffset(code, editorOffset, 'view'));

  //
  // TargetDirectiveParameter
  //

  flags.push(isTargetDirectiveWithParametersFromOffset(code, editorOffset, 'extends'));
  flags.push(isTargetDirectiveWithParametersFromOffset(code, editorOffset, 'include'));
  flags.push(isTargetDirectiveWithParametersFromOffset(code, editorOffset, 'includeIf'));
  flags.push(isTargetDirectiveWithParametersFromOffset(code, editorOffset, 'each'));

  // TODO: More support
  // @includeWhen
  // @includeUnless
  // @includeFirst

  if (flags.includes(true)) {
    return true;
  } else {
    return false;
  }
}
