import {
  isBladeEchoRegionByOffset,
  isDirectiveWithParametersRegionByOffset,
  isInlinePHPRegionByOffset,
  isPHPDirectiveRegionByOffset,
} from '../shared';

export function canCompletionFromContext(code: string, editorOffset: number) {
  const flags: boolean[] = [];

  if (isBladeEchoRegionByOffset(code, editorOffset)) flags.push(true);
  if (isDirectiveWithParametersRegionByOffset(code, editorOffset)) flags.push(true);
  if (isPHPDirectiveRegionByOffset(code, editorOffset)) flags.push(true);
  if (isInlinePHPRegionByOffset(code, editorOffset)) flags.push(true);

  if (flags.includes(true)) {
    return true;
  } else {
    return false;
  }
}
