import fs from 'fs';
import path from 'path';

import { BUILTIN_FUNCTIONS_JSON_PATH } from '../../constant';
import * as phpFunctionProjectService from '../services/phpFunction';
import { PHPFunctionType } from '../types';
import { getArtisanPath } from '../../common/shared';

export class PHPFunctionProjectManager {
  phpFunctionMapStore: Map<string, PHPFunctionType>;
  workspaceRoot: string;

  initialized: boolean;

  private isReady: boolean = false;
  private readyCallbacks: (() => void)[] = [];

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.phpFunctionMapStore = new Map();
    this.initialized = false;
  }

  private setReady() {
    this.isReady = true;
    this.initialized = true;

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
    const abusoluteAutoloadedFunctionsFiles = phpFunctionProjectService.getAbusoluteAutoloadFunctionFilesFromCode(
      autoloadFunctionFilePHPCode,
      this.workspaceRoot
    );

    // Some of the PATHs read do not exist or cause errors
    try {
      for (const autoloadedFunctionFile of abusoluteAutoloadedFunctionsFiles) {
        const relativeFilePath = autoloadedFunctionFile.replace(this.workspaceRoot, '').replace(/^\//, '');
        const targetPHPCode = await fs.promises.readFile(autoloadedFunctionFile, { encoding: 'utf8' });
        const autoloadedFunctions = phpFunctionProjectService.getPHPFunctions(targetPHPCode, relativeFilePath);
        if (autoloadedFunctions) {
          phpFunctions.push(...autoloadedFunctions);
        }
      }
    } catch (e) {}

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

    await this.initialize();
  }

  list() {
    return this.phpFunctionMapStore.entries();
  }
}
