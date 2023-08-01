import { Uri } from 'coc.nvim';

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
import { PhpNamespaceType } from '../../common/types';
import * as phpParser from '../../parsers/php/parser';
import { LivewireMapValueType } from '../types';

export class LivewireProjectManager {
  rootDir: string;
  initialized: boolean;
  livewireMapStore: Map<string, LivewireMapValueType>;
  projectNamespaces: PhpNamespaceType[];

  constructor(rootDir: string) {
    this.rootDir = rootDir;
    this.initialized = false;
    this.livewireMapStore = new Map();

    this.projectNamespaces = [];
  }

  async initialize() {
    const composerJsonContent = await getComposerJsonContent(this.rootDir);
    if (!composerJsonContent) return;
    const projectNamespaces = getProjectNamespacesFromComposerJson(composerJsonContent);
    if (!projectNamespaces) return;
    this.projectNamespaces = projectNamespaces;

    const artisanPath = getArtisanPath();
    if (!artisanPath) return;

    const files: string[] = [];

    const livewireComponentMaps = await this.getLivewireComponentMapsWrapper();

    //
    // livewire v2
    //

    if (livewireComponentMaps.length > 0) {
      for (const componentMap of livewireComponentMaps) {
        const relativeClassFilePath = getRelativeClassFilePathFromNamespaces(
          this.projectNamespaces,
          componentMap.value
        );
        if (!relativeClassFilePath) continue;

        const absoluteClassFilePath = path.join(this.rootDir, relativeClassFilePath);
        files.push(absoluteClassFilePath);
      }
    }

    //
    // livewire v3
    //

    if (livewireComponentMaps.length === 0) {
      const appPath = await getAppPath(artisanPath);
      if (appPath) {
        const relativeAppPath = this.getRelativePosixFilePath(appPath, this.rootDir);
        const livewire3GlobPattern = `**/${relativeAppPath}/Livewire/**/*.php`;

        const resFiles = await fg(livewire3GlobPattern, {
          ignore: ['**/.git/**', '**/vendor/**', '**/node_modules/**'],
          absolute: true,
          cwd: this.rootDir,
        });
        files.push(...resFiles);
      }
    }

    await this.set(files);

    this.initialized = true;
  }

  isInitialized() {
    return this.initialized;
  }

  async set(files: string[]) {
    const livewireComponentMaps = await this.getLivewireComponentMapsWrapper();

    //
    // livewire v2
    //

    if (livewireComponentMaps.length > 0) {
      for (const file of files) {
        for (const componentMap of livewireComponentMaps) {
          const relativeClassFilePath = getRelativeClassFilePathFromNamespaces(
            this.projectNamespaces,
            componentMap.value
          );
          if (!relativeClassFilePath) continue;

          const absoluteClassFilePath = path.join(this.rootDir, relativeClassFilePath);

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

    //
    // livewire v3
    //

    if (livewireComponentMaps.length === 0) {
      for (const file of files) {
        const className = path.basename(file).replace('.php', '');
        const relativeFilePath = this.getRelativePosixFilePath(file, this.rootDir);
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
  }

  async delete(files: string[]) {
    const livewireComponentMaps = await this.getLivewireComponentMapsWrapper();

    //
    // livewire v2
    //

    if (livewireComponentMaps.length > 0) {
      for (const file of files) {
        for (const componentMap of livewireComponentMaps) {
          const relativeClassFilePath = getRelativeClassFilePathFromNamespaces(
            this.projectNamespaces,
            componentMap.value
          );
          if (!relativeClassFilePath) continue;

          const absoluteClassFilePath = path.join(this.rootDir, relativeClassFilePath);

          if (file !== absoluteClassFilePath) continue;

          this.livewireMapStore.delete(componentMap.key);
        }
      }
    }

    //
    // livewire v3
    //

    if (livewireComponentMaps.length === 0) {
      for (const file of files) {
        const stores = Array.from(this.list());
        for (const store of stores) {
          if (store[1].filePath === file) {
            this.livewireMapStore.delete(store[0]);
          }
        }
      }
    }
  }

  async restart() {
    this.livewireMapStore.clear();
    this.initialized = false;

    await this.initialize();
  }

  list() {
    return this.livewireMapStore.entries();
  }

  async getLivewireComponentMapsWrapper() {
    const livewireComponentMapFilePath = path.join(this.rootDir, 'bootstrap', 'cache', 'livewire-components.php');
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
