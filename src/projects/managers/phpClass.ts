import { ExtensionContext, OutputChannel, workspace } from 'coc.nvim';

import fs from 'fs';
import path from 'path';

import * as composerCommon from '../../common/composer';
import * as phpCommon from '../../common/php';
import * as projectCommon from '../../common/project';
import * as stubsCommon from '../../common/stubs';
import { elapsed } from '../../common/utils';
import { STUBS_VENDOR_NAME } from '../../constant';
import { PHPClassType } from '../types';

export class PHPClassProjectManager {
  phpClassMapStore: Map<string, PHPClassType>;

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

    this.phpClassMapStore = new Map();
  }

  private setReady() {
    this.isReady = true;
    this.initialized = true;

    this.outputChannel.appendLine(`[PHPClass] Initialized in ${elapsed(this.initializedAt).toFixed()} ms`);
    this.outputChannel.appendLine(`[PHPClass] Store count is ${this.phpClassMapStore.size}`);

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
    this.outputChannel.appendLine('[PHPClass] Initializing...');

    const phpClasses: PHPClassType[] = [];

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

    const builtinClassContextList = stubsCommon.getContextListFromStubMapPHPCode(stubsMapPHPCode, 'CLASSES');
    if (!builtinClassContextList) return;

    const builtinClasses = builtinClassContextList.filter((c) => stubsCommon.isAllowStubFile(c.path, useStubs));

    for (const f of builtinClasses) {
      const stubPath = path.join(this.context.storagePath, STUBS_VENDOR_NAME, f.path);
      let existsStubPath = false;
      try {
        await fs.promises.stat(stubPath);
        existsStubPath = true;
      } catch {}
      if (!existsStubPath) continue;

      const stubPathOfPHPCode = await fs.promises.readFile(stubPath, { encoding: 'utf8' });

      const classItemKind = phpCommon.getClassItemKindFromPHPCodeByName(stubPathOfPHPCode, f.name);
      if (!classItemKind) continue;

      phpClasses.push({
        name: f.name,
        path: f.path,
        kind: classItemKind,
        isStubs: true,
      });
    }

    //
    // autoload
    //

    const composerAutoloadClassMapPHPPath = path.join(
      this.workspaceRoot,
      'vendor',
      'composer',
      'autoload_classmap.php'
    );

    let existsComposerAutoloadClassMapPHPPath = false;
    try {
      await fs.promises.stat(composerAutoloadClassMapPHPPath);
      existsComposerAutoloadClassMapPHPPath = true;
    } catch {}
    if (!existsComposerAutoloadClassMapPHPPath) return;

    const composerAutoloadClassMapPHPCode = await fs.promises.readFile(composerAutoloadClassMapPHPPath, {
      encoding: 'utf8',
    });

    const abusoluteFileResources = composerCommon.getAbusoluteFileResourcesAtVendorComposerTargetFileOfphpCode(
      composerAutoloadClassMapPHPCode,
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
        const shotName = r.name.replace(namespaces[0], '').replace(/^\\/, '');
        const classItemKind = phpCommon.getClassItemKindFromPHPCodeByName(targetPHPCode, shotName);
        if (!classItemKind) continue;

        phpClasses.push({
          name: r.name,
          path: relativeFilePath,
          kind: classItemKind,
          isStubs: false,
        });
      } catch (e: any) {
        this.outputChannel.appendLine(`[PHPClass:parse_autoload_file_error] ${JSON.stringify(e)}`);
      }
    }

    //
    // Set MapStore
    //

    for (const phpClass of phpClasses) {
      this.phpClassMapStore.set(phpClass.name, phpClass);
    }

    // FIN
    this.setReady();
  }

  isInitialized() {
    return this.initialized;
  }

  async restart() {
    this.phpClassMapStore.clear();

    this.isReady = false;
    this.initialized = false;
    this.initializedAt = process.hrtime();

    await this.initialize();
  }

  list() {
    return this.phpClassMapStore.entries();
  }
}