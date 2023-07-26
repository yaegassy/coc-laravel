import { Uri } from 'coc.nvim';

import fg from 'fast-glob';

import { getAppPath, getArtisanPath } from '../../common/shared';
import * as viewReferenceProjectService from '../services/viewReference';
import { ViewReferenceMapValueType } from '../types';

export class ViewReferenceProjectManager {
  rootDir: string;
  initialized: boolean;
  viewReferenceMapStore: Map<string, ViewReferenceMapValueType>;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
    this.initialized = false;
    this.viewReferenceMapStore = new Map();
  }

  async initialize() {
    const artisanPath = getArtisanPath();
    if (!artisanPath) return;

    const appPath = await getAppPath(artisanPath);

    if (appPath) {
      const relativeAppPath = this.getRelativePosixFilePath(appPath, this.rootDir);

      const globPattern = `**/{routes,${relativeAppPath}/Http/{Controllers,Livewire},${relativeAppPath}/View/Components}/**/*.php`;

      const files = await fg(globPattern, {
        ignore: ['**/.git/**', '**/vendor/**', '**/node_modules/**'],
        absolute: true,
        cwd: this.rootDir,
      });

      await this.set(files);
    }

    this.initialized = true;
  }

  isInitialized() {
    return this.initialized;
  }

  async set(files: string[]) {
    for (const file of files) {
      const viewReferenceMapValue = await viewReferenceProjectService.getViewReferenceMapValue(file);
      if (!viewReferenceMapValue) continue;
      const relativeFilePath = this.getRelativePosixFilePath(file, this.rootDir);
      this.viewReferenceMapStore.set(relativeFilePath, viewReferenceMapValue);
    }
  }

  async delete(files: string[]) {
    for (const file of files) {
      const relativeFilePath = this.getRelativePosixFilePath(file, this.rootDir);
      this.viewReferenceMapStore.delete(relativeFilePath);
    }
  }

  async restart() {
    this.viewReferenceMapStore.clear();
    this.initialized = false;

    await this.initialize();
  }

  list() {
    return this.viewReferenceMapStore.entries();
  }

  getRelativePosixFilePath(absoluteFilePath: string, rootPath: string) {
    const rootUri = Uri.parse(rootPath).toString();
    const abusoluteFileUri = Uri.parse(absoluteFilePath).toString();
    return abusoluteFileUri.replace(rootUri + '/', '');
  }
}
