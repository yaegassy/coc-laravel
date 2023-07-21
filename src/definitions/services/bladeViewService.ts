import { BladeDocument } from 'stillat-blade-parser/out/document/bladeDocument';
import { DirectiveNode } from 'stillat-blade-parser/out/nodes/nodes';
import { Range as ParserRange } from 'stillat-blade-parser/out/nodes/position';

import * as bladeParser from '../../parsers/blade/parser';

export const getBladeDocument = bladeParser.getBladeDocument;

export function getServiceLocations(bladeDoc: BladeDocument) {
  const ranges: ParserRange[] = [];

  for (const node of bladeDoc.getAllNodes()) {
    if (!(node instanceof DirectiveNode)) continue;
    if (node.directiveName !== 'extends' && node.directiveName !== 'include') continue;
    if (!node.hasDirectiveParameters) continue;

    if (node.directiveParametersPosition) {
      ranges.push(node.directiveParametersPosition);
    }
  }

  return ranges;
}

export function canProvideService(documentOffset: number, parserLocations: ParserRange[]) {
  for (const p of parserLocations) {
    if (p.start && p.end) {
      if (p.start.offset <= documentOffset && p.end.offset >= documentOffset) {
        return true;
      }
    }
  }

  return false;
}
