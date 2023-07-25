import {
  isBladeEchoRegionByOffset,
  isComponentRegionAfterComponentNameByOffset,
  isDirectiveWithParametersRegionByOffset,
  isPHPDirectiveRegionByOffset,
} from '../shared';

import * as htmlLsParser from '../../parsers/html/parser';

export function canCompletionFromContext(code: string, editorOffset: number) {
  if (isBladeEchoRegionByOffset(code, editorOffset)) return false;
  if (isDirectiveWithParametersRegionByOffset(code, editorOffset)) return false;
  if (isPHPDirectiveRegionByOffset(code, editorOffset)) return false;

  const parsedHtmlDoc = htmlLsParser.parse(code);
  const currentHtmlNode = parsedHtmlDoc.findNodeAt(editorOffset);
  // true | If there is no tag name
  if (!currentHtmlNode.tag) {
    return true;
  }
  // false | If the tag name does not start with x
  if (!currentHtmlNode.tag.startsWith('x')) return false;

  if (isComponentRegionAfterComponentNameByOffset(code, editorOffset)) return false;

  return true;
}
