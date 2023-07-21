import { ExtensionContext, workspace } from 'coc.nvim';

import path from 'path';

import { getArtisanPath, runTinker } from '../../common/shared';
import { SUPPORTED_LANGUAGE } from '../../constant';
import { type ProjectManagerType } from '../../projects/types';

export async function register(context: ExtensionContext, projectManager: ProjectManagerType) {
  if (!workspace.getConfiguration('laravel').get('completion.enable')) return;

  const { document } = await workspace.getCurrentState();

  if (!SUPPORTED_LANGUAGE.includes(document.languageId)) return;

  await registerBladeWatcher(context, projectManager);
  await registerClassBasedViewWatcher(context, projectManager);
}

async function registerBladeWatcher(context: ExtensionContext, projectManager: ProjectManagerType) {
  const artisanPath = getArtisanPath();
  if (!artisanPath) return;

  const getViewPathPHPCode = `echo json_encode(app()->viewPath())`;
  const resViewPath = await runTinker(getViewPathPHPCode, artisanPath);
  if (!resViewPath) return;
  const viewPath = resViewPath
    .replace(/["']/g, '')
    .replace(/\\/g, '') // remove json quate
    .replace(/\\\\/g, '/') // replace window path to posix path
    .replace('\n', '');

  const globPattern = path.join('**', viewPath.replace(workspace.root, ''), '**/*.blade.php');
  const watcher = workspace.createFileSystemWatcher(globPattern, false, false, false);
  watcher.onDidCreate(async (e) => {
    await projectManager.bladeProjectManager.setBlade([e.fsPath]);
    await projectManager.bladeProjectManager.setComponent([e.fsPath]);
  });
  watcher.onDidChange(async (e) => {
    await projectManager.bladeProjectManager.setBlade([e.fsPath]);
    await projectManager.bladeProjectManager.setComponent([e.fsPath]);
  });
  watcher.onDidDelete((e) => {
    projectManager.bladeProjectManager.deleteBlade([e.fsPath]);
    projectManager.bladeProjectManager.deleteComponent([e.fsPath]);
  });

  context.subscriptions.push(watcher);
}

async function registerClassBasedViewWatcher(context: ExtensionContext, projectManager: ProjectManagerType) {
  const artisanPath = getArtisanPath();
  if (!artisanPath) return;

  const getAppPathPHPCode = `echo json_encode(app()->path())`;
  const resAppPath = await runTinker(getAppPathPHPCode, artisanPath);
  if (!resAppPath) return;
  const appPath = resAppPath
    .replace(/["']/g, '')
    .replace(/\\/g, '') // remove json quate
    .replace(/\\\\/g, '/') // replace window path to posix path
    .replace('\n', '');

  const globPattern = path.posix.join('**', appPath.replace(workspace.root, ''), 'View', 'Components', '**', '*.php');

  const watcher = workspace.createFileSystemWatcher(globPattern, false, false, false);

  watcher.onDidCreate(async (e) => {
    await projectManager.bladeProjectManager.setComponent([e.fsPath]);
  });
  watcher.onDidChange(async (e) => {
    await projectManager.bladeProjectManager.setComponent([e.fsPath]);
  });
  watcher.onDidDelete((e) => {
    projectManager.bladeProjectManager.deleteComponent([e.fsPath]);
  });

  context.subscriptions.push(watcher);
}
