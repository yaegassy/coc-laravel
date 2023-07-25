import * as bladeParser from '../../parsers/blade/parser';

import {
  isBladeEchoRegionByOffset,
  isComponentPropsValueRegionByOffset,
  isDenyKindNameInBladeEchoFromOffset,
  isDenyKindNameInComponentPropsFromOffset,
  isDenyKindNameInDirectiveWithParametersFromOffset,
  isDenyKindNameInPHPDirectiveFromOffset,
  isDirectiveWithParametersRegionByOffset,
  isPHPDirectiveRegionByOffset,
} from '../shared';

export function canCompletionFromPHPRegionInBladeByOffset(code: string, editorOffset: number) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return undefined;

  const flags: boolean[] = [];

  flags.push(isBladeEchoRegionByOffset(code, editorOffset));
  flags.push(isPHPDirectiveRegionByOffset(code, editorOffset));
  flags.push(isDirectiveWithParametersRegionByOffset(code, editorOffset));
  flags.push(isComponentPropsValueRegionByOffset(code, editorOffset));

  if (flags.includes(true)) {
    return true;
  } else {
    return false;
  }
}

/**
 * If the cursor is on one of the following php ast nodes, completion stops!
 *
 * - string node
 *   - "|", '|'
 * - staticlookup node
 *   - XXXX::|
 * - propertylookup node
 *   - XXXX()->|
 */
export function hasDenyKindNameFromPHPRegionInBladeByOffset(code: string, editorOffset: number) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return undefined;

  const flags: boolean[] = [];

  //
  // BladeEcho
  //

  flags.push(isDenyKindNameInBladeEchoFromOffset(code, editorOffset, 'string'));
  flags.push(isDenyKindNameInBladeEchoFromOffset(code, editorOffset, 'staticlookup'));
  flags.push(isDenyKindNameInBladeEchoFromOffset(code, editorOffset, 'propertylookup'));

  //
  // PHP directive
  //

  flags.push(isDenyKindNameInPHPDirectiveFromOffset(code, editorOffset, 'string'));
  flags.push(isDenyKindNameInPHPDirectiveFromOffset(code, editorOffset, 'staticlookup'));
  flags.push(isDenyKindNameInPHPDirectiveFromOffset(code, editorOffset, 'propertylookup'));

  //
  // Directive with parameters
  //

  flags.push(isDenyKindNameInDirectiveWithParametersFromOffset(code, editorOffset, 'string'));
  flags.push(isDenyKindNameInDirectiveWithParametersFromOffset(code, editorOffset, 'staticlookup'));
  flags.push(isDenyKindNameInDirectiveWithParametersFromOffset(code, editorOffset, 'propertylookup'));

  //
  // Component props
  //

  flags.push(isDenyKindNameInComponentPropsFromOffset(code, editorOffset, 'string'));
  flags.push(isDenyKindNameInComponentPropsFromOffset(code, editorOffset, 'staticlookup'));
  flags.push(isDenyKindNameInComponentPropsFromOffset(code, editorOffset, 'propertylookup'));

  if (flags.includes(true)) {
    return true;
  } else {
    return false;
  }
}
