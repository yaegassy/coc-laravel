import { commands, Document, ExtensionContext, Range, TextEdit, window } from 'coc.nvim';

import { METHOD_DIRECTIVE_PARAMETERS, SUPPORTED_LANGUAGE } from '../../constant';

export function register(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand(
      'laravel.internal.fixMethodDirectiveParameter',
      fixMethodDirectiveParameter(),
      null,
      true // internal
    )
  );
}

function fixMethodDirectiveParameter() {
  return async (doc: Document, range: Range) => {
    if (!SUPPORTED_LANGUAGE.includes(doc.languageId)) return;

    const picked = await window.showMenuPicker(METHOD_DIRECTIVE_PARAMETERS, `Select`);

    if (picked !== -1) {
      const replaceText = '("' + METHOD_DIRECTIVE_PARAMETERS[picked] + '")';
      const edits = [TextEdit.replace(range, replaceText)];
      await doc.applyEdits(edits);
    }
  };
}
