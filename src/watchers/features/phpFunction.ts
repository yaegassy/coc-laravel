import { ExtensionContext, workspace } from 'coc.nvim';

import path from 'path';

import { type ProjectManagerType } from '../../projects/types';

import { SUPPORTED_LANGUAGE } from '../../constant';

export async function register(context: ExtensionContext, projectManager: ProjectManagerType) {
  if (!workspace.getConfiguration('laravel').get('completion.enable')) return;
  if (!workspace.getConfiguration('laravel').get('completion.phpFunctionEnable')) return;

  const { document } = await workspace.getCurrentState();
  if (!SUPPORTED_LANGUAGE.includes(document.languageId)) return;

  const globPattern = path.join('**', 'vendor', 'composer', 'autoload_files.php');
  const watcher = workspace.createFileSystemWatcher(globPattern, false, false, true);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  watcher.onDidCreate(async (_e) => {
    await projectManager.phpFunctionProjectManager.restart();
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  watcher.onDidChange(async (_e) => {
    await projectManager.phpFunctionProjectManager.restart();
  });

  context.subscriptions.push(watcher);
}
