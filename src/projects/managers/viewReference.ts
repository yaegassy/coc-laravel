import { OutputChannel, Uri } from 'coc.nvim';

import fg from 'fast-glob';

import { getAppPath, getArtisanPath } from '../../common/shared';
import { elapsed } from '../../common/utils';
import * as viewReferenceProjectService from '../services/viewReference';
import { ViewReferenceMapValueType } from '../types';

export class ViewReferenceProjectManager {
  workspaceRoot: string;
  outputChannel: OutputChannel;
  initializedAt: [number, number];
  initialized: boolean;
  viewReferenceMapStore: Map<string, ViewReferenceMapValueType>;

  private isReady: boolean = false;
  private readyCallbacks: (() => void)[] = [];

  constructor(workspaceRoot: string, outputChannel: OutputChannel) {
    this.initializedAt = process.hrtime();
    this.initialized = false;

    this.workspaceRoot = workspaceRoot;
    this.outputChannel = outputChannel;

    this.viewReferenceMapStore = new Map();
  }

  private setReady() {
    this.isReady = true;
    this.initialized = true;

    this.outputChannel.appendLine(`[ViewReference] Initialized in ${elapsed(this.initializedAt).toFixed()} ms`);
    this.outputChannel.appendLine(`[ViewReference] Store count is ${this.viewReferenceMapStore.size}`);

    this.readyCallbacks.forEach((callback) => callback());
    this.readyCallbacks = [];
  }

  async onReady(callback: () => void) {
    if (this.isReady) {
      callback();
    } else {
      this.readyCallbacks.push(callback);
    }
  }

  async initialize() {
    this.outputChannel.appendLine('[ViewReference] Initializing...');

    const artisanPath = getArtisanPath();
    if (!artisanPath) return;

    const appPath = await getAppPath(artisanPath);

    if (appPath) {
      const relativeAppPath = this.getRelativePosixFilePath(appPath, this.workspaceRoot);

      const globPattern = `**/{routes,${relativeAppPath}/Http/{Controllers,Livewire},${relativeAppPath}/View/Components,${relativeAppPath}/Livewire}/**/*.php`;

      const files = await fg(globPattern, {
        ignore: ['**/.git/**', '**/vendor/**', '**/node_modules/**'],
        absolute: true,
        cwd: this.workspaceRoot,
      });

      await this.set(files);
    }

    this.setReady();
  }

  isInitialized() {
    return this.initialized;
  }

  async set(files: string[]) {
    for (const file of files) {
      const viewReferenceMapValue = await viewReferenceProjectService.getViewReferenceMapValue(file);
      if (!viewReferenceMapValue) continue;
      const relativeFilePath = this.getRelativePosixFilePath(file, this.workspaceRoot);
      this.viewReferenceMapStore.set(relativeFilePath, viewReferenceMapValue);
    }
  }

  async delete(files: string[]) {
    for (const file of files) {
      const relativeFilePath = this.getRelativePosixFilePath(file, this.workspaceRoot);
      this.viewReferenceMapStore.delete(relativeFilePath);
    }
  }

  async restart() {
    this.viewReferenceMapStore.clear();

    this.isReady = false;
    this.initialized = false;
    this.initializedAt = process.hrtime();

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
