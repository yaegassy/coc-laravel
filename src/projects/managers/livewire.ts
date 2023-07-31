import { Uri } from 'coc.nvim';

import fs from 'fs';
import path from 'path';

import {
  getComposerJsonContent,
  getProjectNamespacesFromComposerJson,
  getRelativeClassFilePathFromNamespaces,
} from '../../common/composer';
import * as livewireCommon from '../../common/livewire';
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

    const livewireComponentMaps = await this.getLivewireComponentMapsWrapper();
    if (!livewireComponentMaps) return;

    const files: string[] = [];
    for (const componentMap of livewireComponentMaps) {
      const relativeClassFilePath = getRelativeClassFilePathFromNamespaces(this.projectNamespaces, componentMap.value);
      if (!relativeClassFilePath) continue;

      const absoluteClassFilePath = path.join(this.rootDir, relativeClassFilePath);
      files.push(absoluteClassFilePath);
    }

    await this.set(files);

    this.initialized = true;
  }

  isInitialized() {
    return this.initialized;
  }

  async set(files: string[]) {
    const livewireComponentMaps = await this.getLivewireComponentMapsWrapper();
    if (!livewireComponentMaps) return;

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

  async delete(files: string[]) {
    const livewireComponentMaps = await this.getLivewireComponentMapsWrapper();
    if (!livewireComponentMaps) return;

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
