import { ExtensionContext, FileSystemWatcher, Uri, workspace } from 'coc.nvim';

import { minimatch } from 'minimatch';

import { getAppPath, getArtisanPath, getLangPath, getLocale, getViewPath } from '../../common/shared';
import { SUPPORTED_LANGUAGE } from '../../constant';
import { type ProjectManagerType } from '../../projects/types';

export async function register(context: ExtensionContext, projectManager: ProjectManagerType) {
  if (
    !workspace.getConfiguration('laravel').get('completion.enable') &&
    !workspace.getConfiguration('laravel').get('definition.enable') &&
    !workspace.getConfiguration('laravel').get('reference.enable') &&
    !workspace.getConfiguration('laravel').get('hover.enable')
  )
    return;

  const { document } = await workspace.getCurrentState();
  if (!SUPPORTED_LANGUAGE.includes(document.languageId)) return;

  const artisanPath = getArtisanPath();
  if (!artisanPath) return;

  const appPath = await getAppPath(artisanPath);
  const viewPath = await getViewPath(artisanPath);
  const langPath = await getLangPath(artisanPath);
  const locale = await getLocale(artisanPath);

  const phpFileExtensionManager = new PHPFileExtentionWatcherManager(
    projectManager,
    workspace.root,
    appPath,
    viewPath,
    langPath,
    locale
  );
  phpFileExtensionManager.initialize();

  const watcher = phpFileExtensionManager.getWatcher();
  context.subscriptions.push(watcher);
}

class PHPFileExtentionWatcherManager {
  watcher: FileSystemWatcher;
  projectManager: ProjectManagerType;
  workspaceRoot: string;
  bladeFileGlobPattern?: string;
  classBasedViewGlobPattern?: string;
  viewReferenceGlobPattern?: string;
  translationGlobPattern?: string;
  livewireGlobPattern?: string;
  appGlobPatternPattern?: string;

  constructor(
    projectManager: ProjectManagerType,
    workspaceRoot: string,
    appPath?: string,
    viewPath?: string,
    langPath?: string,
    locale?: string
  ) {
    this.projectManager = projectManager;
    this.workspaceRoot = workspaceRoot;

    const watcherGlobPattern = `**/*.php`;
    this.watcher = workspace.createFileSystemWatcher(watcherGlobPattern, false, false, false);

    if (appPath) {
      const relativeAppPath = this.getRelativePosixFilePath(appPath, this.workspaceRoot);

      this.classBasedViewGlobPattern = `**/${relativeAppPath}/View/Components/**/*.php`;
      this.viewReferenceGlobPattern = `**/{routes,${relativeAppPath}/Http/{Controllers,Livewire},${relativeAppPath}/View/Components,${relativeAppPath}/Livewire}/**/*.php`;
      this.livewireGlobPattern = `**/{bootstrap/cache/livewire-components.php,${relativeAppPath}/Http/Livewire/**/*.php,${relativeAppPath}/Livewire/**/*.php}`;
      this.appGlobPatternPattern = `**/${relativeAppPath}/**/*.php`;
    }

    if (viewPath) {
      const relativeViewPath = this.getRelativePosixFilePath(viewPath, this.workspaceRoot);

      this.bladeFileGlobPattern = `**/${relativeViewPath}/**/*.blade.php`;
    }

    if (langPath && locale) {
      const relativeLangPath = this.getRelativePosixFilePath(langPath, this.workspaceRoot);

      this.translationGlobPattern = `**/${relativeLangPath}/${locale}/**/*.php`;
    }
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
    this.watcher.onDidCreate(async (e) => {
      if (this.bladeFileGlobPattern && minimatch(e.path, this.bladeFileGlobPattern)) {
        await this.projectManager.bladeProjectManager.setBlade([e.path]);
        await this.projectManager.bladeProjectManager.setComponent([e.path]);
      }

      if (this.classBasedViewGlobPattern && minimatch(e.path, this.classBasedViewGlobPattern)) {
        await this.projectManager.bladeProjectManager.setComponent([e.path]);
      }

      if (this.viewReferenceGlobPattern && minimatch(e.path, this.viewReferenceGlobPattern)) {
        await this.projectManager.viewReferenceProjectManager.set([e.path]);
      }

      if (this.translationGlobPattern && minimatch(e.path, this.translationGlobPattern)) {
        this.projectManager.translationProjectManager.set([e.path]);
      }

      if (this.livewireGlobPattern && minimatch(e.path, this.livewireGlobPattern)) {
        this.projectManager.livewireProjectManager.set([e.path]);
      }

      if (this.appGlobPatternPattern && minimatch(e.path, this.appGlobPatternPattern)) {
        this.projectManager.phpClassProjectManager.set([e.path]);
      }
    });
  }

  async onDidChange() {
    this.watcher.onDidChange(async (e) => {
      if (this.bladeFileGlobPattern && minimatch(e.path, this.bladeFileGlobPattern)) {
        await this.projectManager.bladeProjectManager.setBlade([e.path]);
        await this.projectManager.bladeProjectManager.setComponent([e.path]);
      }

      if (this.classBasedViewGlobPattern && minimatch(e.path, this.classBasedViewGlobPattern)) {
        await this.projectManager.bladeProjectManager.setComponent([e.path]);
      }

      if (this.viewReferenceGlobPattern && minimatch(e.path, this.viewReferenceGlobPattern)) {
        await this.projectManager.viewReferenceProjectManager.set([e.path]);
      }

      if (this.translationGlobPattern && minimatch(e.path, this.translationGlobPattern)) {
        this.projectManager.translationProjectManager.restart();
      }

      if (this.livewireGlobPattern && minimatch(e.path, this.livewireGlobPattern)) {
        this.projectManager.livewireProjectManager.set([e.path]);
      }

      if (this.appGlobPatternPattern && minimatch(e.path, this.appGlobPatternPattern)) {
        this.projectManager.phpClassProjectManager.set([e.path]);
      }
    });
  }

  async onDidDelete() {
    this.watcher.onDidDelete(async (e) => {
      if (this.bladeFileGlobPattern && minimatch(e.path, this.bladeFileGlobPattern)) {
        this.projectManager.bladeProjectManager.deleteBlade([e.path]);
        this.projectManager.bladeProjectManager.deleteComponent([e.path]);
      }

      if (this.classBasedViewGlobPattern && minimatch(e.path, this.classBasedViewGlobPattern)) {
        this.projectManager.bladeProjectManager.deleteComponent([e.path]);
      }

      if (this.viewReferenceGlobPattern && minimatch(e.path, this.viewReferenceGlobPattern)) {
        await this.projectManager.viewReferenceProjectManager.delete([e.path]);
      }

      if (this.translationGlobPattern && minimatch(e.path, this.translationGlobPattern)) {
        this.projectManager.translationProjectManager.restart();
      }

      if (this.livewireGlobPattern && minimatch(e.path, this.livewireGlobPattern)) {
        this.projectManager.livewireProjectManager.restart();
      }

      if (this.appGlobPatternPattern && minimatch(e.path, this.appGlobPatternPattern)) {
        this.projectManager.phpClassProjectManager.set([e.path]);
      }
    });
  }

  getRelativePosixFilePath(absoluteFilePath: string, rootPath: string) {
    const rootUri = Uri.parse(rootPath).toString();
    const abusoluteFileUri = Uri.parse(absoluteFilePath).toString();
    return abusoluteFileUri.replace(rootUri + '/', '');
  }
}
