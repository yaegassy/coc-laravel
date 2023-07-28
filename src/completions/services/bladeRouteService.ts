import {
  isCallNameFuncInBladeEchoFromOffset,
  isCallNameFuncInComponentPropsFromOffset,
  isCallNameFuncInDirectiveWithParametersFromOffset,
  isCallNameFuncInInlinePHPFromOffset,
  isCallNameFuncInPHPDirectiveFromOffset,
  isStaticMethodNameInBladeEchoFromOffset,
  isStaticMethodNameInComponentPropsFromOffset,
  isStaticMethodNameInDirectiveWithParametersFromOffset,
  isStaticMethodNameInInlinePHPFromOffset,
  isStaticMethodNameInPHPDirectiveFromOffset,
} from '../shared';

export function canCompletionFromContext(code: string, editorOffset: number) {
  const flags: boolean[] = [];

  flags.push(isCallNameFuncInBladeEchoFromOffset(code, editorOffset, 'route'));
  flags.push(isCallNameFuncInPHPDirectiveFromOffset(code, editorOffset, 'route'));
  flags.push(isCallNameFuncInInlinePHPFromOffset(code, editorOffset, 'route'));
  flags.push(isCallNameFuncInDirectiveWithParametersFromOffset(code, editorOffset, 'route'));
  flags.push(isCallNameFuncInComponentPropsFromOffset(code, editorOffset, 'route'));

  flags.push(isStaticMethodNameInBladeEchoFromOffset(code, editorOffset, 'Route', 'has'));
  flags.push(isStaticMethodNameInDirectiveWithParametersFromOffset(code, editorOffset, 'Route', 'has'));
  flags.push(isStaticMethodNameInPHPDirectiveFromOffset(code, editorOffset, 'Route', 'has'));
  flags.push(isStaticMethodNameInInlinePHPFromOffset(code, editorOffset, 'Route', 'has'));
  flags.push(isStaticMethodNameInComponentPropsFromOffset(code, editorOffset, 'Route', 'has'));

  if (flags.includes(true)) {
    return true;
  } else {
    return false;
  }
}
