import path from 'path';

import fg from 'fast-glob';

export class BladeCacheManager {
  bladeMapStore: Map<string, string>;
  workspaceRoot: string;
  initialized: boolean;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.bladeMapStore = new Map();
    this.initialized = false;
  }

  async initial() {
    const files = await fg('**/resources/views/**/*.blade.php', {
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
      // TODO: リソースの場所は絶対指定ではなく、可変できるようにしたい
      // TODO: Windows 対応 (ディレクトリセパレーターとか正規表現での置換とか)
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

  async regenerate() {
    this.bladeMapStore.clear();
    await this.initial();
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
