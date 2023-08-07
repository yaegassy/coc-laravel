import { OutputChannel } from 'coc.nvim';

import fs from 'fs';
import path from 'path';

import { getArtisanPath } from '../../common/shared';
import { elapsed } from '../../common/utils';
import { BUILTIN_FUNCTIONS_JSON_PATH } from '../../constant';
import * as phpFunctionProjectService from '../services/phpFunction';
import { PHPFunctionType } from '../types';
import * as composerCommon from '../../common/composer';

export class PHPFunctionProjectManager {
  phpFunctionMapStore: Map<string, PHPFunctionType>;
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

    this.phpFunctionMapStore = new Map();
  }

  private setReady() {
    this.isReady = true;
    this.initialized = true;

    this.outputChannel.appendLine(`[PHPFunction] Initialized in ${elapsed(this.initializedAt).toFixed()} ms`);
    this.outputChannel.appendLine(`[PHPFunction] Store count is ${this.phpFunctionMapStore.size}`);

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
    this.outputChannel.appendLine('[PHPFunction] Initializing...');

    // Checking artisan to determine if it is a laravel project
    const artisanPath = getArtisanPath();
    if (!artisanPath) return;

    const phpFunctions: PHPFunctionType[] = [];

    //
    // builtinFunctions
    //

    const builtinFunctionsJSONStr = await fs.promises.readFile(BUILTIN_FUNCTIONS_JSON_PATH, { encoding: 'utf8' });
    const builtinFunctionsJSON = JSON.parse(builtinFunctionsJSONStr) as PHPFunctionType[];
    if (builtinFunctionsJSON) {
      phpFunctions.push(...builtinFunctionsJSON);
    }

    //
    // autoloadedFunctions
    //

    const autoloadFunctionFilePath = path.join(this.workspaceRoot, 'vendor', 'composer', 'autoload_files.php');

    let fileExists = false;
    try {
      await fs.promises.stat(autoloadFunctionFilePath);
      fileExists = true;
    } catch {}
    if (!fileExists) return;

    const autoloadFunctionFilePHPCode = await fs.promises.readFile(autoloadFunctionFilePath, { encoding: 'utf8' });
    const abusoluteAutoloadedFunctionsFiles = composerCommon.getAbusoluteFilesAutoloadFilesPHPFromCode(
      autoloadFunctionFilePHPCode,
      this.workspaceRoot
    );

    for (const autoloadedFunctionFile of abusoluteAutoloadedFunctionsFiles) {
      const relativeFilePath = autoloadedFunctionFile.replace(this.workspaceRoot, '').replace(/^\//, '');
      const targetPHPCode = await fs.promises.readFile(autoloadedFunctionFile, { encoding: 'utf8' });

      // Some of the PATHs read do not exist or cause errors
      try {
        const autoloadedFunctions = phpFunctionProjectService.getPHPFunctions(targetPHPCode, relativeFilePath);
        if (autoloadedFunctions) {
          phpFunctions.push(...autoloadedFunctions);
        }
      } catch (e: any) {
        this.outputChannel.appendLine(`[PHPFunction:parse_autoload_file_error] ${JSON.stringify(e)}`);
      }
    }

    //
    // Set MapStore
    //

    for (const phpFunction of phpFunctions) {
      this.phpFunctionMapStore.set(phpFunction.name, phpFunction);
    }

    // FIN
    this.setReady();
  }

  isInitialized() {
    return this.initialized;
  }

  async restart() {
    this.phpFunctionMapStore.clear();

    this.isReady = false;
    this.initialized = false;
    this.initializedAt = process.hrtime();

    await this.initialize();
  }

  list() {
    return this.phpFunctionMapStore.entries();
  }
}
