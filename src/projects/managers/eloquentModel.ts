import { OutputChannel } from 'coc.nvim';

import fs from 'fs';
import path from 'path';

import * as eloquentModelCommon from '../../common/eloquentModel';
import { EloquentModelType } from '../../common/types';
import { elapsed } from '../../common/utils';
import { config } from '../../config';

export class EloquentModelProjectManager {
  eloquentModelMapStore: Map<string, EloquentModelType>;

  workspaceRoot: string;
  outputChannel: OutputChannel;

  initializedAt: [number, number];
  initialized: boolean;

  private isReady: boolean = false;
  private readyCallbacks: (() => void)[] = [];

  constructor(workspaceRoot: string, outputChannel: OutputChannel) {
    this.initializedAt = process.hrtime();
    this.initialized = false;

    this.workspaceRoot = workspaceRoot;
    this.outputChannel = outputChannel;

    this.eloquentModelMapStore = new Map();
  }

  private setReady() {
    this.isReady = true;
    this.initialized = true;

    this.outputChannel.appendLine(`[EloquentModel] Initialized in ${elapsed(this.initializedAt).toFixed()} ms`);
    this.outputChannel.appendLine(`[EloquentModel] Store count is ${this.eloquentModelMapStore.size}`);

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
    if (!config.completion.eloquentModelFieldEnable) return;

    this.outputChannel.appendLine('[EloquentModel] Initializing...');

    const ideHelperModelsFilePath = path.join(this.workspaceRoot, '_ide_helper_models.php');

    let existsIdeHelperModelsFilePath = false;
    try {
      await fs.promises.stat(ideHelperModelsFilePath);
      existsIdeHelperModelsFilePath = true;
    } catch {}
    if (!existsIdeHelperModelsFilePath) return;

    const ideHelperModelsPHPCode = await fs.promises.readFile(ideHelperModelsFilePath, { encoding: 'utf8' });
    const ideHelperModels = eloquentModelCommon.getIdeHelperModelsFromCode(ideHelperModelsPHPCode);
    const models = eloquentModelCommon.getEloquentModels(ideHelperModels, ideHelperModelsPHPCode);

    // Set MapStore
    for (const m of models) {
      this.eloquentModelMapStore.set(m.fullQualifiedName, m);
    }

    // FIN
    this.setReady();
  }

  isInitialized() {
    return this.initialized;
  }

  async restart() {
    this.eloquentModelMapStore.clear();

    this.isReady = false;
    this.initialized = false;
    this.initializedAt = process.hrtime();

    await this.initialize();
  }

  list() {
    return this.eloquentModelMapStore.entries();
  }
}
