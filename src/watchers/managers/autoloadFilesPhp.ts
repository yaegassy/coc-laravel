import { ExtensionContext, workspace, FileSystemWatcher } from 'coc.nvim';

import path from 'path';

import { SUPPORTED_LANGUAGE } from '../../constant';
import { type ProjectManagerType } from '../../projects/types';

export async function register(context: ExtensionContext, projectManager: ProjectManagerType) {
  if (!workspace.getConfiguration('laravel').get('completion.enable')) return;
  if (!workspace.getConfiguration('laravel').get('completion.phpFunctionEnable')) return;

  const { document } = await workspace.getCurrentState();
  if (!SUPPORTED_LANGUAGE.includes(document.languageId)) return;

  const phpFileExtensionManager = new AutoloadFilesPhpWatcherManager(projectManager);
  phpFileExtensionManager.initialize();

  const watcher = phpFileExtensionManager.getWatcher();
  context.subscriptions.push(watcher);
}

class AutoloadFilesPhpWatcherManager {
  watcher: FileSystemWatcher;
  projectManager: ProjectManagerType;
  autoloadFilesPhpGlobPattern: string;

  constructor(projectManager: ProjectManagerType) {
    this.projectManager = projectManager;

    const watcherGlobPattern = path.join('**', 'vendor', 'composer', 'autoload_files.php');
    this.watcher = workspace.createFileSystemWatcher(watcherGlobPattern, false, false, false);

    this.autoloadFilesPhpGlobPattern = watcherGlobPattern;
  }

  async initialize() {
    await this.onDidCreate();
    await this.onDidChange();
    await this.onDidDelete();
  }

  getWatcher() {
    return this.watcher;
  }

  async onDidCreate() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.watcher.onDidCreate(async (_e) => {
      await this.projectManager.phpFunctionProjectManager.restart();
    });
  }

  async onDidChange() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.watcher.onDidChange(async (_e) => {
      await this.projectManager.phpFunctionProjectManager.restart();
    });
  }

  async onDidDelete() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.watcher.onDidDelete(async (_e) => {
      await this.projectManager.phpFunctionProjectManager.restart();
    });
  }
}
