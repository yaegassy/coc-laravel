import { ExtensionContext, OutputChannel, workspace } from 'coc.nvim';

import fs from 'fs';
import path from 'path';

import * as composerCommon from '../../common/composer';
import * as phpCommon from '../../common/php';
import * as projectCommon from '../../common/project';
import * as stubsCommon from '../../common/stubs';
import { elapsed } from '../../common/utils';
import { STUBS_VENDOR_NAME } from '../../constant';
import { PHPConstantType } from '../types';

export class PHPConstantProjectManager {
  phpConstantMapStore: Map<string, PHPConstantType>;

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

    this.phpConstantMapStore = new Map();
  }

  private setReady() {
    this.isReady = true;
    this.initialized = true;

    this.outputChannel.appendLine(`[PHPConstant] Initialized in ${elapsed(this.initializedAt).toFixed()} ms`);
    this.outputChannel.appendLine(`[PHPConstant] Store count is ${this.phpConstantMapStore.size}`);

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
    this.outputChannel.appendLine('[PHPConstant] Initializing...');

    const phpConstants: PHPConstantType[] = [];

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

    const builtinConstantContextList = stubsCommon.getContextListFromStubMapPHPCode(stubsMapPHPCode, 'CONSTANTS');
    if (!builtinConstantContextList) return;

    const builtinConstants = builtinConstantContextList.filter((c) => stubsCommon.isAllowStubFile(c.path, useStubs));

    for (const c of builtinConstants) {
      phpConstants.push({
        name: c.name,
        path: c.path,
        isStubs: true,
      });
    }

    //
    // autoloaded
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

        const autoloadedConstants = phpCommon.getConstantOfDefineNameFromPHPCode(targetPHPCode);
        if (autoloadedConstants.length === 0) continue;

        for (const c of autoloadedConstants) {
          phpConstants.push({
            name: c,
            path: relativeFilePath,
            isStubs: false,
          });
        }
      } catch (e: any) {
        this.outputChannel.appendLine(`[PHPConstant:parse_autoload_file_error] ${JSON.stringify(e)}`);
      }
    }

    //
    // Set MapStore
    //

    for (const phpConstant of phpConstants) {
      this.phpConstantMapStore.set(phpConstant.name, phpConstant);
    }

    // FIN
    this.setReady();
  }

  isInitialized() {
    return this.initialized;
  }

  async restart() {
    this.phpConstantMapStore.clear();

    this.isReady = false;
    this.initialized = false;
    this.initializedAt = process.hrtime();

    await this.initialize();
  }

  list() {
    return this.phpConstantMapStore.entries();
  }
}
