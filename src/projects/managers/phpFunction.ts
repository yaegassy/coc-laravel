import { ExtensionContext, OutputChannel, workspace } from 'coc.nvim';

import fs from 'fs';
import path from 'path';

import * as composerCommon from '../../common/composer';
import * as phpCommon from '../../common/php';
import * as projectCommon from '../../common/project';
import * as stubsCommon from '../../common/stubs';
import { elapsed } from '../../common/utils';
import { STUBS_VENDOR_NAME } from '../../constant';
import { PHPFunctionType } from '../types';

export class PHPFunctionProjectManager {
  phpFunctionMapStore: Map<string, PHPFunctionType>;

  context: ExtensionContext;
  workspaceRoot: string;
  outputChannel: OutputChannel;

  initializedAt: [number, number];
  initialized: boolean;

  private isReady: boolean = false;
  private readyCallbacks: (() => void)[] = [];

  constructor(context: ExtensionContext, workspaceRoot: string, outputChannel: OutputChannel) {
    this.initializedAt = process.hrtime();
    this.initialized = false;

    this.context = context;
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

    const phpFunctions: PHPFunctionType[] = [];

    //
    // builtin
    //

    const useStubs = workspace.getConfiguration('laravel').get<string[]>('stubs.useStubs', []);

    const stubsMapFilePath = path.resolve(
      path.join(this.context.storagePath, STUBS_VENDOR_NAME, 'PhpStormStubsMap.php')
    );

    let existsStubsMapFilePath = false;
    try {
      await fs.promises.stat(stubsMapFilePath);
      existsStubsMapFilePath = true;
    } catch {}
    if (!existsStubsMapFilePath) return;

    const stubsMapPHPCode = await fs.promises.readFile(stubsMapFilePath, { encoding: 'utf8' });

    const builtinFunctionContextList = stubsCommon.getContextListFromStubMapPHPCode(stubsMapPHPCode, 'FUNCTIONS');
    if (!builtinFunctionContextList) return;

    const builtinFunctions = builtinFunctionContextList.filter((c) => stubsCommon.isAllowStubFile(c.path, useStubs));

    for (const f of builtinFunctions) {
      phpFunctions.push({
        name: f.name,
        path: f.path,
        isStubs: true,
      });
    }

    //
    // autoloadedFunctions
    //

    const composerAutoloadFilesPHPPath = path.join(this.workspaceRoot, 'vendor', 'composer', 'autoload_files.php');

    let existsComposerAutoloadFilesPHPPath = false;
    try {
      await fs.promises.stat(composerAutoloadFilesPHPPath);
      existsComposerAutoloadFilesPHPPath = true;
    } catch {}
    if (!existsComposerAutoloadFilesPHPPath) return;

    const composerAutoloadFilesPHPCode = await fs.promises.readFile(composerAutoloadFilesPHPPath, { encoding: 'utf8' });

    const abusoluteFileResources = composerCommon.getAbusoluteFileResourcesAtVendorComposerTargetFileOfphpCode(
      composerAutoloadFilesPHPCode,
      this.workspaceRoot
    );

    const excludeVendors = workspace.getConfiguration('laravel').get<string[]>('project.excludeVendors', []);

    for (const r of abusoluteFileResources) {
      const relativeFilePath = r.path.replace(this.workspaceRoot, '').replace(/^\//, '');
      if (projectCommon.isExcludeVendor(relativeFilePath, excludeVendors)) continue;

      let existsRelativeFilePath = false;
      try {
        await fs.promises.stat(relativeFilePath);
        existsRelativeFilePath = true;
      } catch {}
      if (!existsRelativeFilePath) continue;

      // Some of the PATHs read do not exist or cause errors
      try {
        const targetPHPCode = await fs.promises.readFile(r.path, { encoding: 'utf8' });

        const namespaces = phpCommon.getNamespaceFromPHPCode(targetPHPCode);

        const autoloadedFunctions = phpCommon.getFunctionFromPHPCode(targetPHPCode);
        if (autoloadedFunctions.length === 0) continue;
        for (const c of autoloadedFunctions) {
          if (namespaces.length > 0) {
            phpFunctions.push({
              name: namespaces[0] + '\\' + c,
              path: relativeFilePath,
              isStubs: false,
            });
          } else {
            phpFunctions.push({
              name: c,
              path: relativeFilePath,
              isStubs: false,
            });
          }
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
