import { ExtensionContext, FileSystemWatcher, window, workspace } from 'coc.nvim';

import path from 'path';

import { SUPPORTED_LANGUAGE } from '../../constant';
import { type ProjectManagerType } from '../../projects/types';

export async function register(context: ExtensionContext, projectManager: ProjectManagerType) {
  if (!workspace.getConfiguration('laravel').get('completion.enable')) return;
  if (
    !workspace.getConfiguration('laravel').get('completion.phpClassEnable') &&
    !workspace.getConfiguration('laravel').get('completion.phpFunctionEnable') &&
    !workspace.getConfiguration('laravel').get('completion.phpConstantEnable')
  )
    return;

  const { document } = await workspace.getCurrentState();
  if (!SUPPORTED_LANGUAGE.includes(document.languageId)) return;

  const phpFileExtensionManager = new VendorComposerWatcherManager(projectManager);
  phpFileExtensionManager.initialize();

  const watcher = phpFileExtensionManager.getWatcher();
  context.subscriptions.push(watcher);
}

class VendorComposerWatcherManager {
  watcher: FileSystemWatcher;
  projectManager: ProjectManagerType;
  vendorComposerGlobPattern: string;

  constructor(projectManager: ProjectManagerType) {
    this.projectManager = projectManager;

    const watcherGlobPattern = path.join('**', 'vendor', 'composer', '**', '*.php');
    this.watcher = workspace.createFileSystemWatcher(watcherGlobPattern, false, false, false);

    this.vendorComposerGlobPattern = watcherGlobPattern;
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
      window.showInformationMessage('[coc-laravel] (update) Project reinitialization...');

      await this.projectManager.phpClassProjectManager.restart();
      await this.projectManager.phpFunctionProjectManager.restart();
      await this.projectManager.phpConstantProjectManager.restart();

      // Since the most time-consuming part is phpClassProjectManager
      // initialization, use the onReady of phpClassProjectManager
      // initialization to display the message
      await this.projectManager.phpClassProjectManager.onReady(() => {
        window.showInformationMessage('[coc-laravel] (success) Project reinitialization succeeded!');
      });
    });
  }

  async onDidChange() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.watcher.onDidChange(async (_e) => {
      window.showInformationMessage('[coc-laravel] (update) Project reinitialization...');

      await this.projectManager.phpClassProjectManager.restart();
      await this.projectManager.phpFunctionProjectManager.restart();
      await this.projectManager.phpConstantProjectManager.restart();

      // Since the most time-consuming part is phpClassProjectManager
      // initialization, use the onReady of phpClassProjectManager
      // initialization to display the message
      await this.projectManager.phpClassProjectManager.onReady(() => {
        window.showInformationMessage('[coc-laravel] (success) Project reinitialization succeeded!');
      });
    });
  }

  async onDidDelete() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.watcher.onDidDelete(async (_e) => {
      window.showInformationMessage('[coc-laravel] (update) Project reinitialization...');

      await this.projectManager.phpClassProjectManager.restart();
      await this.projectManager.phpFunctionProjectManager.restart();
      await this.projectManager.phpConstantProjectManager.restart();

      // Since the most time-consuming part is phpClassProjectManager
      // initialization, use the onReady of phpClassProjectManager
      // initialization to display the message
      await this.projectManager.phpClassProjectManager.onReady(() => {
        window.showInformationMessage('[coc-laravel] (success) Project reinitialization succeeded!');
      });
    });
  }
}
