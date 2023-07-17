import { ExtensionContext, workspace } from 'coc.nvim';

import path from 'path';

import { getArtisanPath, runTinker } from '../common/shared';
import { SUPPORTED_LANGUAGE } from '../constant';
import { type ProjectManagerType } from '../projects/types';

export async function register(context: ExtensionContext, projectManager: ProjectManagerType) {
  if (!workspace.getConfiguration('laravel').get('completion.enable')) return;

  const { document } = await workspace.getCurrentState();

  if (!SUPPORTED_LANGUAGE.includes(document.languageId)) return;

  const artisanPath = getArtisanPath();
  if (!artisanPath) return;

  const getViewPathPHPCode = `echo json_encode(app()->viewPath(), JSON_PRETTY_PRINT)`;
  const resViewPath = await runTinker(getViewPathPHPCode, artisanPath);
  const viewPath = resViewPath.replace(/["']/g, '').replace(/\\/g, '').replace('\n', '');

  const globPattern = path.join('**', viewPath.replace(workspace.root, ''), '**/*.blade.php');

  const watcher = workspace.createFileSystemWatcher(globPattern, false, false, false);

  watcher.onDidCreate((e) => {
    projectManager.bladeProjectManager.set([e.fsPath]);
  });

  watcher.onDidChange(async (e) => {
    projectManager.bladeProjectManager.set([e.fsPath]);
  });

  watcher.onDidDelete((e) => {
    projectManager.bladeProjectManager.delete([e.fsPath]);
  });

  context.subscriptions.push(watcher);
}
