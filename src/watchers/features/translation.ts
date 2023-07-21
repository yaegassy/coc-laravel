import { ExtensionContext, workspace } from 'coc.nvim';

import path from 'path';

import { getArtisanPath, runTinker } from '../../common/shared';
import { SUPPORTED_LANGUAGE } from '../../constant';
import { type ProjectManagerType } from '../../projects/types';

export async function register(context: ExtensionContext, projectManager: ProjectManagerType) {
  if (!workspace.getConfiguration('laravel').get('completion.enable')) return;
  if (!workspace.getConfiguration('laravel').get('completion.translationEnable')) return;

  const { document } = await workspace.getCurrentState();

  if (!SUPPORTED_LANGUAGE.includes(document.languageId)) return;

  const artisanPath = getArtisanPath();
  if (!artisanPath) return;

  const getLangPathPHPCode = `echo json_encode(app()->langPath())`;
  const resLangPath = await runTinker(getLangPathPHPCode, artisanPath);
  if (!resLangPath) return;
  const langPath = resLangPath.replace(/["']/g, '').replace(/\\/g, '').replace('\n', '');

  const getLocalePHPCode = `echo json_encode(config('app.locale'))`;
  const resLocale = await runTinker(getLocalePHPCode, artisanPath);
  if (!resLocale) return;
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
