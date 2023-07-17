import { ExtensionContext, workspace } from 'coc.nvim';

import path from 'path';

import { type ProjectManagerType } from '../projects/types';

import { getArtisanPath, runTinker } from '../completions/common/shared';

import { SUPPORTED_LANGUAGE } from '../constant';

export async function register(context: ExtensionContext, projectManager: ProjectManagerType) {
  if (!workspace.getConfiguration('laravel').get('completion.enable')) return;

  const { document } = await workspace.getCurrentState();

  if (!SUPPORTED_LANGUAGE.includes(document.languageId)) return;

  const artisanPath = getArtisanPath();
  if (!artisanPath) return;

  const getLangPathPHPCode = `echo json_encode(app()->langPath(), JSON_PRETTY_PRINT)`;
  const resLangPath = await runTinker(getLangPathPHPCode, artisanPath);
  const langPath = resLangPath.replace(/["']/g, '').replace(/\\/g, '').replace('\n', '');

  const getLocalePHPCode = `echo json_encode(config('app.locale'), JSON_PRETTY_PRINT)`;
  const resLocale = await runTinker(getLocalePHPCode, artisanPath);
  const locale = resLocale.replace(/["']/g, '').replace(/\\/g, '').replace('\n', '');

  const globPattern = path.join('**', langPath.replace(workspace.root, ''), locale, '**/*.{php,json}');

  const watcher = workspace.createFileSystemWatcher(globPattern, false, false, false);

  watcher.onDidCreate((e) => {
    projectManager.translationProjectManager.set([e.fsPath]);
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  watcher.onDidChange(async (_e) => {
    await projectManager.translationProjectManager.restart();
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  watcher.onDidDelete(async (_e) => {
    await projectManager.translationProjectManager.restart();
  });

  context.subscriptions.push(watcher);
}
