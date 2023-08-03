import { OutputChannel } from 'coc.nvim';

import fg from 'fast-glob';
import fs from 'fs';
import path from 'path';
import { Array as ArrayNode, Entry, Return, String as StringNode } from 'php-parser';

import { getArtisanPath, runTinker } from '../../common/shared';
import { elapsed } from '../../common/utils';
import * as parser from '../../parsers/php/parser';

export class TranslationProjectManager {
  mapStore: Map<string, string>;
  workspaceRoot: string;
  outputChannel: OutputChannel;
  initialized: boolean;
  initializedAt: [number, number];
  langPath?: string;
  locale?: string;

  private isReady: boolean = false;
  private readyCallbacks: (() => void)[] = [];

  constructor(workspaceRoot: string, outputChannel: OutputChannel) {
    this.initializedAt = process.hrtime();

    this.workspaceRoot = workspaceRoot;
    this.outputChannel = outputChannel;

    this.mapStore = new Map();
    this.initialized = false;
  }

  private setReady() {
    this.isReady = true;
    this.initialized = true;

    this.outputChannel.appendLine(`[Translation] Initialized in ${elapsed(this.initializedAt).toFixed()} ms`);
    this.outputChannel.appendLine(`[Translation] Store count is ${this.mapStore.size}`);

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
    this.outputChannel.appendLine('[Translation] Initializing...');

    const artisanPath = getArtisanPath();
    if (!artisanPath) return;

    const getLangPathPHPCode = `echo json_encode(app()->langPath())`;
    const resLangPath = await runTinker(getLangPathPHPCode, artisanPath);
    if (!resLangPath) return;
    this.langPath = resLangPath.replace(/["']/g, '').replace(/\\/g, '').replace('\n', '');

    const getLocalePHPCode = `echo json_encode(config('app.locale'))`;
    const resLocale = await runTinker(getLocalePHPCode, artisanPath);
    if (!resLocale) return;
    this.locale = resLocale.replace(/["']/g, '').replace(/\\/g, '').replace('\n', '');

    const globPattern = path.join(this.langPath, this.locale, '**/*.{php,json}');

    const files = await fg(globPattern, {
      ignore: ['**/.git/**', '**/vendor/**', '**/node_modules/**'],
      absolute: true,
    });

    this.set(files);

    this.setReady();
  }

  isInitialized() {
    return this.initialized;
  }

  async set(files: string[]) {
    for (const file of files) {
      const code = await fs.promises.readFile(file, { encoding: 'utf8' });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const filenameWitoutExt = this.getPathName(file);
      if (path.extname(file) === '.php' && filenameWitoutExt) {
        this.handlePHP(code, filenameWitoutExt);
      }
    }
  }

  handlePHP(code: string, filenameWitoutExt: string) {
    const ast = parser.getAst(code);
    if (!ast) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    parser.walk((node, _parent) => {
      let targetKeyName: string | undefined = undefined;
      let targetKeyValue: string | undefined = undefined;

      if (node.kind === 'return') {
        const returnNode = node as Return;
        if (!returnNode.expr) return;
        if (returnNode.expr.kind !== 'array') return;

        const arrayNode = returnNode.expr as ArrayNode;

        for (const item of arrayNode.items) {
          if (item.kind !== 'entry') continue;
          const entryNode = item as Entry;

          if (!entryNode.key) continue;
          if (entryNode.key.kind !== 'string') continue;
          const keyNameNode = entryNode.key as StringNode;
          targetKeyName = keyNameNode.value;

          // MEMO: Does an array need to be addressed?
          if (entryNode.value.kind !== 'string') continue;
          const keyValueNode = entryNode.value as StringNode;
          targetKeyValue = keyValueNode.value;

          if (targetKeyName && targetKeyValue) {
            this.mapStore.set(filenameWitoutExt + '.' + targetKeyName, targetKeyValue);
          }
        }
      }
    }, ast);
  }

  delete(files: string[]) {
    for (const file of files) {
      const pathName = this.getPathName(file);
      if (pathName) {
        this.mapStore.delete(pathName);
      }
    }
  }

  async restart() {
    this.mapStore.clear();

    this.isReady = false;
    this.initialized = false;
    this.initializedAt = process.hrtime();

    await this.initialize();
  }

  list() {
    return this.mapStore.entries();
  }

  getPathName(file: string): string | undefined {
    if (this.langPath && this.locale) {
      return file
        .replace(path.join(this.langPath, this.locale), '')
        .replace(/^\//, '')
        .replace('.php', '')
        .replace(/\//g, '.');
    } else {
      return undefined;
    }
  }
}
