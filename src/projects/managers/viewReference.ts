import fg from 'fast-glob';

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
    const globPattern = '**/{routes,app/Http/{Controllers,Livewire},app/View/Components}/**/*.php';

    const files = await fg(globPattern, {
      ignore: ['**/.git/**', '**/vendor/**', '**/node_modules/**'],
      absolute: true,
      cwd: this.rootDir,
    });

    await this.set(files);

    this.initialized = true;
  }

  isInitialized() {
    return this.initialized;
  }

  async set(files: string[]) {
    for (const file of files) {
      const viewReferenceMapValue = await viewReferenceProjectService.getViewReferenceMapValue(file);
      if (!viewReferenceMapValue) continue;
      const relativeFilePath = this.getRelativeFilePath(file);
      this.viewReferenceMapStore.set(relativeFilePath, viewReferenceMapValue);
    }
  }

  async delete(files: string[]) {
    for (const file of files) {
      const relativeFilePath = this.getRelativeFilePath(file);
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

  getRelativeFilePath(file: string) {
    return file.replace(this.rootDir, '').replace(/^\//, '');
  }
}
