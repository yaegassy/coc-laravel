import { CodeAction, CodeActionContext, CodeActionKind, Diagnostic, Range, TextDocument, workspace } from 'coc.nvim';

import { cursorRange, lineRange } from '../helpers';

export async function doAction(document: TextDocument, range: Range, context: CodeActionContext) {
  const codeActions: CodeAction[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  if (!context.diagnostics.length) return [];

  const methodDirectiveParameterDiags: Diagnostic[] = [];
  for (const diag of context.diagnostics) {
    if (!diag.source) continue;
    if (!diag.code) continue;
    if (typeof diag.code !== 'string') continue;
    if (diag.source !== 'laravel') continue;
    if (!diag.code.startsWith('MDP')) continue;

    methodDirectiveParameterDiags.push(diag);
  }
  if (!methodDirectiveParameterDiags.length) return [];

  if (lineRange(range) || cursorRange(range)) {
    for (const mdpDiag of methodDirectiveParameterDiags) {
      const codeAction: CodeAction = {
        title: 'Fix Method directive parameter',
        kind: CodeActionKind.QuickFix,
        command: {
          title: '',
          command: 'laravel.internal.fixMethodDirectiveParameter',
          arguments: [doc, mdpDiag.range],
        },
      };

      codeActions.push(codeAction);
    }
  }

  return codeActions;
}
