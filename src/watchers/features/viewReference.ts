import { ExtensionContext, workspace } from 'coc.nvim';

import { SUPPORTED_LANGUAGE } from '../../constant';
import { type ProjectManagerType } from '../../projects/types';

export async function register(context: ExtensionContext, projectManager: ProjectManagerType) {
  if (!workspace.getConfiguration('laravel').get('reference.enable')) return;

  const { document } = await workspace.getCurrentState();
  if (!SUPPORTED_LANGUAGE.includes(document.languageId)) return;

  const globPattern = '**/{routes,app/Http/{Controllers,Livewire}}/**/*.php';
  const watcher = workspace.createFileSystemWatcher(globPattern, false, false, false);

  watcher.onDidCreate(async (e) => {
    await projectManager.viewReferenceProjectManager.set([e.fsPath]);
  });

  watcher.onDidChange(async (e) => {
    await projectManager.viewReferenceProjectManager.set([e.fsPath]);
  });

  watcher.onDidChange(async (e) => {
    await projectManager.viewReferenceProjectManager.delete([e.fsPath]);
  });

  context.subscriptions.push(watcher);
}
