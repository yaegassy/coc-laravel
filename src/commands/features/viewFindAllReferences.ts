import { Document, ExtensionContext, Location, Position, Range, Uri, commands, workspace } from 'coc.nvim';

import path from 'path';

import { type ProjectManagerType } from '../../projects/types';

export async function register(context: ExtensionContext, projectManager: ProjectManagerType) {
  if (!workspace.getConfiguration('laravel').get('reference.enable')) return;

  context.subscriptions.push(
    commands.registerCommand('laravel.view.findAllReferences', async () => {
      const { document } = await workspace.getCurrentState();
      if (document.languageId !== 'blade') return;

      const filePath = Uri.parse(document.uri).fsPath;
      const bladePathName = filePath
        .replace(path.join(workspace.root, 'resources', 'views'), '')
        .replace(/^\//, '')
        .replace('.blade.php', '')
        .replace(/\//g, '.');

      const viewReferences = Array.from(projectManager.viewReferenceProjectManager.list());

      const refs: Location[] = [];
      for (const [, v] of viewReferences) {
        if (v.callViewFunctions.length === 0) continue;

        for (const callViewFunction of v.callViewFunctions) {
          if (callViewFunction.name !== bladePathName) continue;

          let refDocument: Document | undefined;
          try {
            refDocument = await workspace.openTextDocument(v.path);
          } catch (e) {}
          if (!refDocument) continue;

          const startPostion = refDocument.textDocument.positionAt(callViewFunction.startOffset);
          const endPostion = refDocument.textDocument.positionAt(callViewFunction.endOffset);
          const range = Range.create(startPostion, endPostion);

          refs.push({
            uri: Uri.parse(v.path).toString(),
            range,
          });
        }
      }

      if (refs.length === 0) return;
      await commands.executeCommand('editor.action.showReferences', document.uri, Position.create(0, 0), refs);
    })
  );
}
