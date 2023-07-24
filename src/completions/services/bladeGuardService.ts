import {
  isStaticMethodNameInBladeEchoFromOffset,
  isStaticMethodNameInComponentPropsFromOffset,
  isStaticMethodNameInDirectiveWithParametersFromOffset,
  isStaticMethodNameInPHPDirectiveFromOffset,
  isTargetDirectiveWithParametersFromOffset,
} from '../shared';

export function canCompletionFromContext(code: string, editorOffset: number) {
  const flags: boolean[] = [];

  //
  // Static Method
  //

  flags.push(isStaticMethodNameInBladeEchoFromOffset(code, editorOffset, 'Auth', 'guard'));
  flags.push(isStaticMethodNameInPHPDirectiveFromOffset(code, editorOffset, 'Auth', 'guard'));
  flags.push(isStaticMethodNameInDirectiveWithParametersFromOffset(code, editorOffset, 'Auth', 'guard'));
  flags.push(isStaticMethodNameInComponentPropsFromOffset(code, editorOffset, 'Auth', 'guard'));

  //
  // TargetDirectiveParameter
  //

  flags.push(isTargetDirectiveWithParametersFromOffset(code, editorOffset, 'auth'));
  flags.push(isTargetDirectiveWithParametersFromOffset(code, editorOffset, 'guest'));

  if (flags.includes(true)) {
    return true;
  } else {
    return false;
  }
}
