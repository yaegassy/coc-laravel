import { isTargetDirectiveWithParametersFromOffset } from '../shared';

export function canCompletionFromContext(code: string, editorOffset: number) {
  const flags: boolean[] = [];

  //
  // TargetDirectiveParameter
  //

  flags.push(isTargetDirectiveWithParametersFromOffset(code, editorOffset, 'livewire'));

  if (flags.includes(true)) {
    return true;
  } else {
    return false;
  }
}
