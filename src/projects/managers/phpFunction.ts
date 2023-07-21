import { workspace } from 'coc.nvim';

import fs from 'fs';
import path from 'path';

import { BUILTIN_FUNCTIONS_JSON_PATH } from '../../constant';
import * as phpFunctionProjectService from '../services/phpFunction';
import { PHPFunctionType } from '../types';

export class PHPFunctionProjectManager {
  phpFunctionMapStore: Map<string, PHPFunctionType>;

  initialized: boolean;

  constructor() {
    this.phpFunctionMapStore = new Map();
    this.initialized = false;
  }

  async initialize() {
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

    const autoloadFunctionFilePath = path.join(workspace.root, 'vendor', 'composer', 'autoload_files.php');

    let fileExists = false;
    try {
      await fs.promises.stat(autoloadFunctionFilePath);
      fileExists = true;
    } catch {}
    if (!fileExists) return;

    const autoloadFunctionFilePHPCode = await fs.promises.readFile(autoloadFunctionFilePath, { encoding: 'utf8' });
    const abusoluteAutoloadedFunctionsFiles = phpFunctionProjectService.getAbusoluteAutoloadFunctionFilesFromCode(
      autoloadFunctionFilePHPCode,
      workspace.root
    );

    for (const autoloadedFunctionFile of abusoluteAutoloadedFunctionsFiles) {
      const relativeFilePath = autoloadedFunctionFile.replace(workspace.root, '').replace(/^\//, '');
      const targetPHPCode = await fs.promises.readFile(autoloadedFunctionFile, { encoding: 'utf8' });
      const autoloadedFunctions = phpFunctionProjectService.getPHPFunctions(targetPHPCode, relativeFilePath);
      if (autoloadedFunctions) {
        phpFunctions.push(...autoloadedFunctions);
      }
    }

    //
    // Set MapStore
    //

    for (const phpFunction of phpFunctions) {
      this.phpFunctionMapStore.set(phpFunction.name, phpFunction);
    }

    // FIN
    this.initialized = true;
  }

  isInitialized() {
    return this.initialized;
  }

  async restart() {
    this.phpFunctionMapStore.clear();
    this.initialized = false;

    await this.initialize();
  }

  list() {
    return this.phpFunctionMapStore.entries();
  }
}
