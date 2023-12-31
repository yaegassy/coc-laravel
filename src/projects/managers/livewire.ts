import { OutputChannel, Uri } from 'coc.nvim';

import fg from 'fast-glob';
import fs from 'fs';
import path from 'path';

import {
  getComposerJsonContent,
  getFileNamespace,
  getProjectNamespacesFromComposerJson,
  getRelativeClassFilePathFromNamespaces,
} from '../../common/composer';
import * as livewireCommon from '../../common/livewire';
import { getAppPath, getArtisanPath } from '../../common/shared';
import { LivewireComponentMapType, PHPNamespaceType } from '../../common/types';
import { elapsed } from '../../common/utils';
import * as phpParser from '../../parsers/php/parser';
import { LivewireMapValueType } from '../types';

export class LivewireProjectManager {
  workspaceRoot: string;
  outputChannel: OutputChannel;
  initializedAt: [number, number];
  initialized: boolean;
  livewireMapStore: Map<string, LivewireMapValueType>;
  projectNamespaces: PHPNamespaceType[];

  private isReady: boolean = false;
  private readyCallbacks: (() => void)[] = [];

  constructor(workspaceRoot: string, outputChannel: OutputChannel) {
    this.initializedAt = process.hrtime();
    this.initialized = false;

    this.workspaceRoot = workspaceRoot;
    this.outputChannel = outputChannel;

    this.livewireMapStore = new Map();

    this.projectNamespaces = [];
  }

  private setReady() {
    this.isReady = true;
    this.initialized = true;

    this.outputChannel.appendLine(`[Livewire] Initialized in ${elapsed(this.initializedAt).toFixed()} ms`);
    this.outputChannel.appendLine(`[Livewire] Store count is ${this.livewireMapStore.size}`);

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
    this.outputChannel.appendLine('[Livewire] Initializing...');

    const composerJsonContent = await getComposerJsonContent(this.workspaceRoot);
    if (!composerJsonContent) return;
    const projectNamespaces = getProjectNamespacesFromComposerJson(composerJsonContent);
    if (!projectNamespaces) return;
    this.projectNamespaces = projectNamespaces;

    const artisanPath = getArtisanPath();
    if (!artisanPath) return;

    const files: string[] = [];

    const livewireComponentMaps = await this.getLivewireComponentMapsWrapper();

    //
    // livewire v2 or earlier
    //

    if (livewireComponentMaps.length > 0) {
      for (const componentMap of livewireComponentMaps) {
        const relativeClassFilePath = getRelativeClassFilePathFromNamespaces(
          this.projectNamespaces,
          componentMap.value
        );
        if (!relativeClassFilePath) continue;

        const absoluteClassFilePath = path.join(this.workspaceRoot, relativeClassFilePath);
        files.push(absoluteClassFilePath);
      }
    }

    //
    // livewire v3
    //

    if (livewireComponentMaps.length === 0) {
      const appPath = await getAppPath(artisanPath);
      if (appPath) {
        const relativeAppPath = this.getRelativePosixFilePath(appPath, this.workspaceRoot);
        const livewire3GlobPattern = `**/${relativeAppPath}/Livewire/**/*.php`;

        const resFiles = await fg(livewire3GlobPattern, {
          ignore: ['**/.git/**', '**/vendor/**', '**/node_modules/**'],
          absolute: true,
          cwd: this.workspaceRoot,
        });
        files.push(...resFiles);
      }
    }

    await this.set(files);

    this.setReady();
  }

  isInitialized() {
    return this.initialized;
  }

  async set(files: string[]) {
    const livewireComponentMaps = await this.getLivewireComponentMapsWrapper();

    // livewire v2 or earlier
    if (livewireComponentMaps.length > 0) {
      await this._doSetV2(files, livewireComponentMaps);
    }

    // livewire v3
    if (livewireComponentMaps.length === 0) {
      await this._doSetV3(files);
    }
  }

  // livewire v2 or earlier
  private async _doSetV2(files: string[], livewireComponentMaps: LivewireComponentMapType[]) {
    for (const file of files) {
      for (const componentMap of livewireComponentMaps) {
        const relativeClassFilePath = getRelativeClassFilePathFromNamespaces(
          this.projectNamespaces,
          componentMap.value
        );
        if (!relativeClassFilePath) continue;

        const absoluteClassFilePath = path.join(this.workspaceRoot, relativeClassFilePath);

        if (file !== absoluteClassFilePath) continue;

        let targetClassFilePhpCode: string | undefined = undefined;
        try {
          targetClassFilePhpCode = await fs.promises.readFile(absoluteClassFilePath, { encoding: 'utf8' });
        } catch (e) {
          //
        }
        if (!targetClassFilePhpCode) continue;

        const targetClassAst = phpParser.getAst(targetClassFilePhpCode);
        if (!targetClassAst) continue;

        const livewireComponentClassNode = livewireCommon.getLivewireComponentClassNode(targetClassAst);
        if (!livewireComponentClassNode) continue;

        const livewireComponentProperties =
          livewireCommon.getLivewireComponentPropertiesFromClassNode(livewireComponentClassNode);

        const livewireComponentMethods =
          livewireCommon.getLivewireComponentMethodsFromClassNode(livewireComponentClassNode);

        const renderMethodNode = livewireCommon.getRenderMethodNodeFromClassNode(livewireComponentClassNode);
        const templateKey = livewireCommon.getTemplateKeyOfCallViewFuncArgumentsFromMethodNode(renderMethodNode);

        const livewireMapValue: LivewireMapValueType = {
          keyName: componentMap.key,
          namespacePathName: componentMap.value,
          filePath: absoluteClassFilePath,
          properties: livewireComponentProperties,
          methods: livewireComponentMethods,
          templateKey,
        };

        this.livewireMapStore.set(componentMap.key, livewireMapValue);
      }
    }
  }

  // livewire v3
  private async _doSetV3(files: string[]) {
    for (const file of files) {
      const className = path.basename(file).replace('.php', '');
      const relativeFilePath = this.getRelativePosixFilePath(file, this.workspaceRoot);
      const fileNamespace = getFileNamespace(this.projectNamespaces, relativeFilePath);
      const namespacePathName = fileNamespace + '\\' + className;

      let targetClassFilePhpCode: string | undefined = undefined;
      try {
        targetClassFilePhpCode = await fs.promises.readFile(file, { encoding: 'utf8' });
      } catch (e) {
        //
      }
      if (!targetClassFilePhpCode) continue;

      const targetClassAst = phpParser.getAst(targetClassFilePhpCode);
      if (!targetClassAst) continue;
      const livewireComponentClassNode = livewireCommon.getLivewireComponentClassNode(targetClassAst);
      if (!livewireComponentClassNode) continue;

      const livewireComponentProperties =
        livewireCommon.getLivewireComponentPropertiesFromClassNode(livewireComponentClassNode);
      const livewireComponentMethods =
        livewireCommon.getLivewireComponentMethodsFromClassNode(livewireComponentClassNode);
      const renderMethodNode = livewireCommon.getRenderMethodNodeFromClassNode(livewireComponentClassNode);
      const templateKey = livewireCommon.getTemplateKeyOfCallViewFuncArgumentsFromMethodNode(renderMethodNode);

      const keyName = templateKey.replace('livewire.', '');

      const livewireMapValue: LivewireMapValueType = {
        keyName,
        namespacePathName,
        filePath: file,
        properties: livewireComponentProperties,
        methods: livewireComponentMethods,
        templateKey,
      };

      this.livewireMapStore.set(keyName, livewireMapValue);
    }
  }

  async delete(files: string[]) {
    const livewireComponentMaps = await this.getLivewireComponentMapsWrapper();

    // livewire v2 or earlier
    if (livewireComponentMaps.length > 0) {
      await this._doDeleteV2(files, livewireComponentMaps);
    }

    // livewire v3
    if (livewireComponentMaps.length === 0) {
      await this._doDeleteV3(files);
    }
  }

  // livewire v2 or earlier
  private async _doDeleteV2(files: string[], livewireComponentMaps: LivewireComponentMapType[]) {
    for (const file of files) {
      for (const componentMap of livewireComponentMaps) {
        const relativeClassFilePath = getRelativeClassFilePathFromNamespaces(
          this.projectNamespaces,
          componentMap.value
        );
        if (!relativeClassFilePath) continue;

        const absoluteClassFilePath = path.join(this.workspaceRoot, relativeClassFilePath);

        if (file !== absoluteClassFilePath) continue;

        this.livewireMapStore.delete(componentMap.key);
      }
    }
  }

  // livewire v3
  private async _doDeleteV3(files: string[]) {
    for (const file of files) {
      const stores = Array.from(this.list());
      for (const store of stores) {
        if (store[1].filePath === file) {
          this.livewireMapStore.delete(store[0]);
        }
      }
    }
  }

  async restart() {
    this.livewireMapStore.clear();

    this.isReady = false;
    this.initialized = false;
    this.initializedAt = process.hrtime();

    await this.initialize();
  }

  list() {
    return this.livewireMapStore.entries();
  }

  async getLivewireComponentMapsWrapper() {
    const livewireComponentMapFilePath = path.join(this.workspaceRoot, 'bootstrap', 'cache', 'livewire-components.php');
    let componentMapPhpCode: string | undefined = undefined;
    try {
      componentMapPhpCode = await fs.promises.readFile(livewireComponentMapFilePath, { encoding: 'utf8' });
    } catch (e) {
      //
    }
    if (!componentMapPhpCode) return [];
    const componentMapAst = phpParser.getAst(componentMapPhpCode);
    if (!componentMapAst) return [];

    const livewireComponentMaps = livewireCommon.getLivewireComponentMapsFromNode(componentMapAst);
    if (!livewireComponentMaps) return [];

    return livewireComponentMaps;
  }

  getRelativePosixFilePath(absoluteFilePath: string, rootPath: string) {
    const rootUri = Uri.parse(rootPath).toString();
    const abusoluteFileUri = Uri.parse(absoluteFilePath).toString();
    return abusoluteFileUri.replace(rootUri + '/', '');
  }
}
