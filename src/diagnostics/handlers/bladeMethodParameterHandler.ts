import { Diagnostic, TextDocument } from 'coc.nvim';
import { DirectiveNode } from 'stillat-blade-parser/out/nodes/nodes';

import * as bladeParser from '../../parsers/blade/parser';

const METHODS = ['PUT', 'PATCH', 'DELETE'];

export async function doValidate(textDocument: TextDocument) {
  const diagnostics: Diagnostic[] = [];

  const code = textDocument.getText();
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return [];

  for (const node of bladeDoc.getAllNodes()) {
    if (node instanceof DirectiveNode) {
      if (node.directiveName !== 'method') continue;
      if (!node.directiveParametersPosition) continue;
      if (!node.directiveParametersPosition.start?.offset) continue;
      if (!node.directiveParametersPosition.end?.offset) continue;

      const methodParameter = node.directiveParameters.replace(/^\(["']/, '').replace(/["']\)$/, '');
      if (METHODS.includes(methodParameter)) continue;

      const diagnostic: Diagnostic = {
        source: 'laravel',
        severity: 2,
        message: 'There is an error in the parameter of the method directive',
        range: {
          start: textDocument.positionAt(node.directiveParametersPosition.start.offset),
          end: textDocument.positionAt(node.directiveParametersPosition.end.offset),
        },
      };

      diagnostics.push(diagnostic);
    }
  }

  return diagnostics;
}
