import { CodeAction, CodeActionContext, CodeActionKind, Diagnostic, Range, TextDocument, workspace } from 'coc.nvim';

import { cursorRange, lineRange } from '../helpers';
import { type DiagnosticDataType } from '../../common/types';

export async function doAction(document: TextDocument, range: Range, context: CodeActionContext) {
  const codeActions: CodeAction[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  if (!context.diagnostics.length) return [];

  const missingComponentDiags: Diagnostic[] = [];
  for (const diag of context.diagnostics) {
    if (!diag.source) continue;
    if (!diag.code) continue;
    if (typeof diag.code !== 'string') continue;
    if (diag.source !== 'laravel') continue;
    if (!diag.code.startsWith('BMC')) continue;

    missingComponentDiags.push(diag);
  }
  if (!missingComponentDiags.length) return [];

  if (lineRange(range) || cursorRange(range)) {
    for (const bmcDiag of missingComponentDiags) {
      const bmcDiagData = bmcDiag.data as DiagnosticDataType;
      if (!bmcDiagData.bladeComponentName) continue;

      const codeAction: CodeAction = {
        title: `Create blade component: ${bmcDiagData.bladeComponentName}`,
        kind: CodeActionKind.QuickFix,
        command: {
          title: '',
          command: 'laravel.internal.createBladeComponent',
          arguments: [doc, bmcDiagData.bladeComponentName],
        },
      };

      codeActions.push(codeAction);
    }
  }

  return codeActions;
}
