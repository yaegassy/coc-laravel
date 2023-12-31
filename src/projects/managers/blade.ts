import { OutputChannel, Uri } from 'coc.nvim';

import { kebabCase } from 'case-anything';
import fg from 'fast-glob';
import fs from 'fs';
import path from 'path';

import { getAppPath, getArtisanPath, getViewPath, runTinker } from '../../common/shared';
import { elapsed } from '../../common/utils';
import * as bladeProjectService from '../services/blade';
import { ComponentMapValueType, PropsType } from '../types';

export class BladeProjectsManager {
  bladeMapStore: Map<string, string>;
  componentMapStore: Map<string, ComponentMapValueType>;
  workspaceRoot: string;
  outputChannel: OutputChannel;
  initialized: boolean;
  initializedAt: [number, number];
  bladeFiles: string[];
  classBasedViewDir?: string;

  private isReady: boolean = false;
  private readyCallbacks: (() => void)[] = [];

  constructor(workspaceRoot: string, outputChannel: OutputChannel) {
    this.initializedAt = process.hrtime();
    this.initialized = false;

    this.workspaceRoot = workspaceRoot;
    this.outputChannel = outputChannel;

    this.bladeMapStore = new Map();
    this.componentMapStore = new Map();
    this.bladeFiles = [];
    this.classBasedViewDir = undefined;
  }

  private setReady() {
    this.isReady = true;
    this.initialized = true;

    this.outputChannel.appendLine(`[Blade] Initialized in ${elapsed(this.initializedAt).toFixed()} ms`);
    this.outputChannel.appendLine(`[Blade:File] Store count is ${this.bladeMapStore.size}`);
    this.outputChannel.appendLine(`[Blade:Component] Store count is ${this.componentMapStore.size}`);

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
    this.outputChannel.appendLine('[Blade] Initializing...');

    const artisanPath = getArtisanPath();
    if (!artisanPath) return;

    const viewPath = await getViewPath(artisanPath);
    if (viewPath) {
      const relativeViewPath = this.getRelativePosixFilePath(viewPath, this.workspaceRoot);
      const bladeFileGlobPattern = `**/${relativeViewPath}/**/*.blade.php`;

      this.bladeFiles = await fg(bladeFileGlobPattern, {
        ignore: ['**/.git/**', '**/vendor/**', '**/node_modules/**'],
        absolute: true,
        cwd: this.workspaceRoot,
      });

      await this.setBlade(this.bladeFiles);
    }

    const appPath = await getAppPath(artisanPath);
    if (appPath) {
      this.classBasedViewDir = path.join(appPath, 'View', 'Components');
      const relativeAppPath = this.getRelativePosixFilePath(appPath, this.workspaceRoot);

      const classBasedViewGlobPattern = `**/${relativeAppPath}/View/Components/**/*.php`;

      const classBasedViewFiles = await fg(classBasedViewGlobPattern, {
        ignore: ['**/.git/**', '**/vendor/**', '**/node_modules/**'],
        absolute: true,
        cwd: this.workspaceRoot,
      });

      const componentFiles: string[] = [];
      if (this.bladeFiles) {
        componentFiles.push(...this.bladeFiles);
      }
      if (classBasedViewFiles) {
        componentFiles.push(...classBasedViewFiles);
      }

      await this.setComponent(componentFiles);
    }

    this.setReady();
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
        await this.doSetComponentMap(component);
      } else if (file.endsWith('.php')) {
        if (!this.classBasedViewDir) return;
        const relativeClassComponentFilePath = file.replace(this.classBasedViewDir, '').replace(/^\//, '');
        const relativeFilePathWithoutExtName = relativeClassComponentFilePath.replace('.php', '');
        const splitRelativeClassComponentName = relativeFilePathWithoutExtName.split(path.sep);
        const kebabedArr = splitRelativeClassComponentName.map((v) => kebabCase(v));
        const componentKey = 'x-' + kebabedArr.join('.');
        const component: [string, string] = [componentKey, file];
        await this.doSetComponentMap(component);
      }
    }
  }

  async doSetComponentMap(component: [string, string]) {
    if (component[0].startsWith('x-')) {
      //
      // From class based component
      //

      const code = await fs.promises.readFile(component[1], { encoding: 'utf8' });
      const props = bladeProjectService.getPropsFromClassBasedComponent(code);

      if (props) {
        this.componentMapStore.set(component[0], {
          path: component[1],
          props,
        });
      }
    } else if (component[0].startsWith('components.')) {
      //
      // From blade file component
      //

      const props: PropsType[] = [];

      const code = await fs.promises.readFile(component[1], { encoding: 'utf8' });
      const parsedBladeDoc = bladeProjectService.getBladeDocument(code);

      let phpCodeInProps: string | undefined = undefined;
      if (parsedBladeDoc) {
        phpCodeInProps = bladeProjectService.getPHPCodeInProps(parsedBladeDoc);
      }

      if (phpCodeInProps) {
        const artisanPath = getArtisanPath();
        if (artisanPath) {
          const jsonEncodedPHPCode = `echo json_encode(${phpCodeInProps})`;
          const resJsonStr = await runTinker(jsonEncodedPHPCode, artisanPath);
          if (!resJsonStr) return;
          const resJson = JSON.parse(resJsonStr);

          if (Array.isArray(resJson)) {
            for (const i in resJson) {
              props.push({ propsKey: i, propsValue: resJson[i] });
            }
          } else if (typeof resJson === 'object') {
            Object.keys(resJson).map((key) => {
              props.push({ propsKey: key, propsValue: resJson[key] });
            });
          }
        }
      }

      const componentKey = component[0].replace('components.', 'x-');
      this.componentMapStore.set(componentKey, {
        path: component[1],
        props,
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
    this.componentMapStore.clear();

    this.isReady = false;
    this.initialized = false;
    this.initializedAt = process.hrtime();

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

  getRelativePosixFilePath(absoluteFilePath: string, rootPath: string) {
    const rootUri = Uri.parse(rootPath).toString();
    const abusoluteFileUri = Uri.parse(absoluteFilePath).toString();
    return abusoluteFileUri.replace(rootUri + '/', '');
  }
}
