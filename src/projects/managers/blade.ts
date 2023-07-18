import { workspace } from 'coc.nvim';

import { kebabCase } from 'case-anything';
import fg from 'fast-glob';
import path from 'path';

import { getArtisanPath, runTinker } from '../../common/shared';

type Props = {
  propsKey: string;
  propsValue: string;
};

type ComponentMapValueType = {
  path: string;
  props: Props[];
};

export class BladeProjectsManager {
  bladeMapStore: Map<string, string>;
  componentMapStore: Map<string, ComponentMapValueType>;

  workspaceRoot: string;
  initialized: boolean;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.bladeMapStore = new Map();
    this.componentMapStore = new Map();
    this.initialized = false;
  }

  async initialize() {
    const artisanPath = getArtisanPath();
    if (!artisanPath) return;

    const getViewPathPHPCode = `echo json_encode(app()->viewPath())`;
    const resViewPath = await runTinker(getViewPathPHPCode, artisanPath);
    const viewPath = resViewPath
      .replace(/["']/g, '')
      .replace(/\\/g, '') // remove json quate
      .replace(/\\\\/g, '/') // replace window path to posix path
      .replace('\n', '');

    const bladeGlobPattern = path.join('**', viewPath.replace(workspace.root, ''), '**', '*.blade.php');

    const bladeFiles = await fg(bladeGlobPattern, {
      ignore: ['**/.git/**', '**/vendor/**', '**/node_modules/**'],
      absolute: true,
    });

    // ====
    await this.setBlade(bladeFiles);

    ////

    const getAppPathPHPCode = `echo json_encode(app()->path())`;
    const resAppPath = await runTinker(getAppPathPHPCode, artisanPath);
    const appPath = resAppPath
      .replace(/["']/g, '')
      .replace(/\\/g, '') // remove json quate
      .replace(/\\\\/g, '/') // replace window path to posix path
      .replace('\n', '');

    const classBasedViewGlobPattern = path.posix.join(
      '**',
      appPath.replace(workspace.root, ''),
      'View',
      'Components',
      '**',
      '*.php'
    );

    const classBasedViewFiles = await fg(classBasedViewGlobPattern, {
      ignore: ['**/.git/**', '**/vendor/**', '**/node_modules/**'],
      absolute: true,
    });

    const componentFiles: string[] = [];
    if (bladeFiles) {
      componentFiles.push(...bladeFiles);
    }
    if (classBasedViewFiles) {
      componentFiles.push(...classBasedViewFiles);
    }

    // ====
    await this.setComponent(componentFiles);

    ////

    // ====
    this.initialized = true;
  }

  isInitialized() {
    return this.initialized;
  }

  async setBlade(files: string[]) {
    for (const file of files) {
      const pathName = this.getBladePathName(file);
      const component: [string, string] = [pathName, file];
      this.doSetBladeMap(component);
    }
  }

  doSetBladeMap(component: [string, string]) {
    this.bladeMapStore.set(component[0], component[1]);
  }

  async setComponent(files: string[]) {
    for (const file of files) {
      if (file.endsWith('.blade.php')) {
        const pathName = this.getBladePathName(file);
        const component: [string, string] = [pathName, file];
        this.doSetComponentMap(component);
      } else if (file.endsWith('.php')) {
        const fileWithoutExtName = path.basename(file).replace('.php', '');
        const kebabCaseName = kebabCase(fileWithoutExtName);
        const componentKey = 'x-' + kebabCaseName;
        const component: [string, string] = [componentKey, file];
        this.doSetComponentMap(component);
      }
    }
  }

  doSetComponentMap(component: [string, string]) {
    if (component[0].startsWith('x-')) {
      this.componentMapStore.set(component[0], {
        path: component[1],
        props: [],
      });
    } else if (component[0].startsWith('components.')) {
      const componentKey = component[0].replace('components.', 'x-');
      this.componentMapStore.set(componentKey, {
        path: component[1],
        props: [],
      });
    }
  }

  deleteBlade(files: string[]) {
    for (const file of files) {
      const pathName = this.getBladePathName(file);
      this.bladeMapStore.delete(pathName);
    }
  }

  deleteComponent(files: string[]) {
    for (const file of files) {
      if (file.endsWith('.blade.php')) {
        const pathName = this.getBladePathName(file);
        const componentKey = this.getComponentKeyByPathName(pathName);
        if (!componentKey) continue;

        this.componentMapStore.delete(componentKey);
      } else if (file.endsWith('.php')) {
        const fileWithoutExtName = path.basename(file).replace('.php', '');
        const kebabCaseName = kebabCase(fileWithoutExtName);
        const componentKey = 'x-' + kebabCaseName;

        this.componentMapStore.delete(componentKey);
      }
    }
  }

  async restart() {
    this.bladeMapStore.clear();
    ////this.componentMapStore.clear();

    await this.initialize();
  }

  bladeFilelist() {
    return this.bladeMapStore.entries();
  }

  componentList() {
    return this.componentMapStore.entries();
  }

  getBladePathName(file: string): string {
    return file
      .replace(path.join(this.workspaceRoot, 'resources', 'views'), '')
      .replace(/^\//, '')
      .replace('.blade.php', '')
      .replace(/\//g, '.');
  }

  getComponentKeyByPathName(pathName: string) {
    if (pathName.startsWith('components.')) {
      const componentKey = pathName.replace('components.', 'x-');
      return componentKey;
    }
    return undefined;
  }
}
