import { workspace } from 'coc.nvim';

import fg from 'fast-glob';
import path from 'path';

import { getArtisanPath, runTinker } from '../../common/shared';

export class BladeProjectsManager {
  bladeMapStore: Map<string, string>;
  workspaceRoot: string;
  initialized: boolean;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.bladeMapStore = new Map();
    this.initialized = false;
  }

  async initialize() {
    const artisanPath = getArtisanPath();
    if (!artisanPath) return;

    const getViewPathPHPCode = `echo json_encode(app()->viewPath(), JSON_PRETTY_PRINT)`;
    const resViewPath = await runTinker(getViewPathPHPCode, artisanPath);
    const viewPath = resViewPath.replace(/["']/g, '').replace(/\\/g, '').replace('\n', '');

    const globPattern = path.join('**', viewPath.replace(workspace.root, ''), '**/*.blade.php');

    const files = await fg(globPattern, {
      ignore: ['**/.git/**', '**/vendor/**', '**/node_modules/**'],
      absolute: true,
    });

    this.set(files);
    this.initialized = true;
  }

  isInitialized() {
    return this.initialized;
  }

  set(files: string[]) {
    for (const file of files) {
      // TODO: Resource locations are taken from the project state, not from absolute specification
      // TODO: Windows check (check if you need to be careful with directory separators, regular expression replacement, etc.)
      const pathName = this.getPathName(file);
      this.bladeMapStore.set(pathName, file);
    }
  }

  delete(files: string[]) {
    for (const file of files) {
      const pathName = this.getPathName(file);
      this.bladeMapStore.delete(pathName);
    }
  }

  async restart() {
    this.bladeMapStore.clear();
    await this.initialize();
  }

  list() {
    return this.bladeMapStore.entries();
  }

  getPathName(file: string): string {
    return file
      .replace(path.join(this.workspaceRoot, 'resources', 'views'), '')
      .replace(/^\//, '')
      .replace('.blade.php', '')
      .replace(/\//g, '.');
  }
}
