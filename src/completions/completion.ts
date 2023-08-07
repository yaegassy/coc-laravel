import {
  CancellationToken,
  CompletionContext,
  CompletionItem,
  CompletionItemProvider,
  CompletionList,
  ExtensionContext,
  LinesTextDocument,
  OutputChannel,
  Position,
  extensions,
  languages,
  workspace,
} from 'coc.nvim';

import { DOCUMENT_SELECTOR, SUPPORTED_LANGUAGE } from '../constant';
import { type ProjectManagerType } from '../projects/types';
import * as bladeComponentCompletionHandler from './handlers/bladeComponentHandler';
import * as bladeConfigCompletionHandler from './handlers/bladeConfigHandler';
import * as bladeDirectiveCompletionHandler from './handlers/bladeDirectiveHandler';
import * as bladeEnvCompletionHandler from './handlers/bladeEnvHandler';
import * as bladeGuardCompletionHandler from './handlers/bladeGuardHandler';
import * as bladeMethodParameterHandler from './handlers/bladeMethodParameterHandler';
import * as bladeRouteCompletionHandler from './handlers/bladeRouteHandler';
import * as bladeTranslationCompletionHandler from './handlers/bladeTranslationHandler';
import * as bladeViewCompletionHanlder from './handlers/bladeViewHandler';
import * as configCompletionHandler from './handlers/configHandler';
import * as envCompletionHandler from './handlers/envHandler';
import * as guardCompletionHandler from './handlers/guardHandler';
import * as livewireActionCompletionHandler from './handlers/livewireActionHandler';
import * as livewireDirectiveCompletionHandler from './handlers/livewireDirectiveHandler';
import * as livewireEventCompletionHandler from './handlers/livewireEventHandler';
import * as livewirePropertyHandler from './handlers/livewirePropertyHandler';
import * as livewireTagCompletionHandler from './handlers/livewireTagHandler';
import * as middlewareCompletionHandler from './handlers/middlewareHandler';
import * as phpConstantCompletionHandler from './handlers/phpConstantHandler';
import * as phpFunctionCompletionHandler from './handlers/phpFunctionHandler';
import * as phpKeywordCompletionHandler from './handlers/phpKeywordHandler';
import * as routeCompletionHandler from './handlers/routeHandler';
import * as translationCompletionHandler from './handlers/translationHandler';
import * as validationCompletionHandler from './handlers/validationHandler';
import * as viewCompletionHandler from './handlers/viewHandler';

import { getArtisanPath, getViewPath } from '../common/shared';
import { CompletionItemDataType } from './types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function register(
  context: ExtensionContext,
  projectManager: ProjectManagerType,
  outputChannel: OutputChannel
) {
  if (!workspace.getConfiguration('laravel').get('completion.enable')) return;

  const { document } = await workspace.getCurrentState();
  if (!SUPPORTED_LANGUAGE.includes(document.languageId)) return;

  await projectManager.bladeProjectManager.onReady(() => {});
  await projectManager.phpFunctionProjectManager.onReady(() => {});
  await projectManager.translationProjectManager.onReady(() => {});
  await projectManager.livewireProjectManager.onReady(() => {});

  outputChannel.appendLine('Start registration for completion feature');

  const artisanPath = getArtisanPath();
  if (!artisanPath) return;

  const viewPath = await getViewPath(artisanPath);
  if (!viewPath) return;

  // Register provider
  context.subscriptions.push(
    languages.registerCompletionItemProvider(
      'Laravel',
      'Laravel',
      DOCUMENT_SELECTOR,
      new LaravelCompletionProvider(context, projectManager, viewPath, outputChannel),
      [
        '$', // livewire property completion, php related
        '@', // directive,
        '<', // component,
        ':', // guard, php related
        '.', // route, view
        '"', // config, validation, env, route, view, middleware
        "'", // config, validation, env, route, view, middleware
        '|', // validation
      ]
    )
  );
}

class LaravelCompletionProvider implements CompletionItemProvider {
  extensionContext: ExtensionContext;
  projectManager: ProjectManagerType;
  viewPath: string;
  outputChannel: OutputChannel;

  private isCocBladeCompletionEnableDirective: boolean;

  constructor(
    context: ExtensionContext,
    projectManager: ProjectManagerType,
    viewPath: string,
    outputChannel: OutputChannel
  ) {
    this.extensionContext = context;
    this.projectManager = projectManager;
    this.viewPath = viewPath;
    this.outputChannel = outputChannel;

    this.isCocBladeCompletionEnableDirective = false;
    if (extensions.all.find((e) => e.id === 'coc-blade')) {
      this.isCocBladeCompletionEnableDirective = workspace
        .getConfiguration('blade')
        .get<boolean>('completion.enableDirective', true);
    }
  }

  async provideCompletionItems(
    document: LinesTextDocument,
    position: Position,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _token: CancellationToken,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context?: CompletionContext | undefined
  ) {
    const items: CompletionItem[] | CompletionList = [];

    // config
    if (workspace.getConfiguration('laravel').get('completion.configEnable')) {
      const configCompletionItems = await configCompletionHandler.doCompletion(document, position);
      if (configCompletionItems) {
        items.push(...configCompletionItems);
      }

      const bladeConfigCompletionItems = await bladeConfigCompletionHandler.doCompletion(document, position);
      if (bladeConfigCompletionItems) {
        items.push(...bladeConfigCompletionItems);
      }
    }

    // env
    if (workspace.getConfiguration('laravel').get('completion.envEnable')) {
      const envCompletionItems = await envCompletionHandler.doCompletion(document, position);
      if (envCompletionItems) {
        items.push(...envCompletionItems);
      }

      const bladeEnvCompletionItems = await bladeEnvCompletionHandler.doCompletion(document, position);
      if (bladeEnvCompletionItems) {
        items.push(...bladeEnvCompletionItems);
      }
    }

    // validation
    if (workspace.getConfiguration('laravel').get('completion.validationEnable')) {
      const validationCompletionItems = await validationCompletionHandler.doCompletion(document, position);
      if (validationCompletionItems) {
        items.push(...validationCompletionItems);
      }
    }

    // route
    if (workspace.getConfiguration('laravel').get('completion.routeEnable')) {
      const routeCompletionItems = await routeCompletionHandler.doCompletion(document, position);
      if (routeCompletionItems) {
        items.push(...routeCompletionItems);
      }

      const bladeRouteCompletionItems = await bladeRouteCompletionHandler.doCompletion(document, position);
      if (bladeRouteCompletionItems) {
        items.push(...bladeRouteCompletionItems);
      }
    }

    // view
    if (workspace.getConfiguration('laravel').get('completion.viewEnable')) {
      const viewCompletionItems = await viewCompletionHandler.doCompletion(
        document,
        position,
        this.projectManager.bladeProjectManager
      );
      if (viewCompletionItems) {
        items.push(...viewCompletionItems);
      }

      const bladeViewCompletionItems = await bladeViewCompletionHanlder.doCompletion(
        document,
        position,
        this.projectManager.bladeProjectManager
      );
      if (bladeViewCompletionItems) {
        items.push(...bladeViewCompletionItems);
      }
    }

    // middleware
    if (workspace.getConfiguration('laravel').get('completion.middlewareEnable')) {
      const middlewareCompletionItems = await middlewareCompletionHandler.doCompletion(document, position);
      if (middlewareCompletionItems) {
        items.push(...middlewareCompletionItems);
      }
    }

    // guard
    if (workspace.getConfiguration('laravel').get('completion.guardEnable')) {
      const guardCompletionItems = await guardCompletionHandler.doCompletion(document, position);
      if (guardCompletionItems) {
        items.push(...guardCompletionItems);
      }

      const bladeGuardCompletionItems = await bladeGuardCompletionHandler.doCompletion(document, position);
      if (bladeGuardCompletionItems) {
        items.push(...bladeGuardCompletionItems);
      }
    }

    // translation
    if (workspace.getConfiguration('laravel').get('completion.translationEnable')) {
      const translationCompletionItems = await translationCompletionHandler.doCompletion(
        document,
        position,
        this.projectManager.translationProjectManager
      );
      if (translationCompletionItems) {
        items.push(...translationCompletionItems);
      }

      const bladeTranslationCompletionItems = await bladeTranslationCompletionHandler.doCompletion(
        document,
        position,
        this.projectManager.translationProjectManager
      );
      if (bladeTranslationCompletionItems) {
        items.push(...bladeTranslationCompletionItems);
      }
    }

    // component
    if (workspace.getConfiguration('laravel').get('completion.componentEnable')) {
      const componentCompletionItems = await bladeComponentCompletionHandler.doCompletion(
        document,
        position,
        this.projectManager.bladeProjectManager
      );
      if (componentCompletionItems) {
        items.push(...componentCompletionItems);
      }
    }

    // php function
    if (workspace.getConfiguration('laravel').get('completion.phpFunctionEnable')) {
      const phpFunctionCompletionItems = await phpFunctionCompletionHandler.doCompletion(
        document,
        position,
        this.projectManager.phpFunctionProjectManager
      );
      if (phpFunctionCompletionItems) {
        items.push(...phpFunctionCompletionItems);
      }
    }

    // php keyword
    if (workspace.getConfiguration('laravel').get('completion.phpKeywordEnable')) {
      const phpKeywordCompletionItems = await phpKeywordCompletionHandler.doCompletion(document, position);
      if (phpKeywordCompletionItems) {
        items.push(...phpKeywordCompletionItems);
      }
    }

    // php constant
    if (workspace.getConfiguration('laravel').get('completion.phpConstantEnable')) {
      const phpConstantCompletionItems = await phpConstantCompletionHandler.doCompletion(
        document,
        position,
        this.projectManager.phpConstantProjectManager
      );
      if (phpConstantCompletionItems) {
        items.push(...phpConstantCompletionItems);
      }
    }

    // method parameter
    if (workspace.getConfiguration('laravel').get('completion.methodParameterEnable')) {
      const methodParameterCompletionItems = await bladeMethodParameterHandler.doCompletion(document, position);
      if (methodParameterCompletionItems) {
        items.push(...methodParameterCompletionItems);
      }
    }

    // directive
    if (
      workspace.getConfiguration('laravel').get('completion.directiveEnable') &&
      !this.isCocBladeCompletionEnableDirective
    ) {
      const bladeDirectiveCompletionItems = await bladeDirectiveCompletionHandler.doCompletion(document, position);
      if (bladeDirectiveCompletionItems) {
        items.push(...bladeDirectiveCompletionItems);
      }
    }

    // livewire
    if (workspace.getConfiguration('laravel').get('completion.livewireEnable')) {
      const livewireTagCompletionItems = await livewireTagCompletionHandler.doCompletion(
        document,
        position,
        this.projectManager.livewireProjectManager
      );
      if (livewireTagCompletionItems) {
        items.push(...livewireTagCompletionItems);
      }

      const livewireActionCompletionItems = await livewireActionCompletionHandler.doCompletion(
        document,
        position,
        this.projectManager.livewireProjectManager,
        this.viewPath
      );
      if (livewireActionCompletionItems) {
        items.push(...livewireActionCompletionItems);
      }

      const livewireEventCompletionItems = await livewireEventCompletionHandler.doCompletion(
        document,
        position,
        this.projectManager.livewireProjectManager,
        this.viewPath
      );
      if (livewireEventCompletionItems) {
        items.push(...livewireEventCompletionItems);
      }

      const livewireDirectiveCompletionItems = await livewireDirectiveCompletionHandler.doCompletion(
        document,
        position,
        this.projectManager.livewireProjectManager
      );
      if (livewireDirectiveCompletionItems) {
        items.push(...livewireDirectiveCompletionItems);
      }

      const livewirePropertyCompletionItems = await livewirePropertyHandler.doCompletion(
        document,
        position,
        this.projectManager.livewireProjectManager,
        this.viewPath
      );
      if (livewirePropertyCompletionItems) {
        items.push(...livewirePropertyCompletionItems);
      }
    }

    return items;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async resolveCompletionItem(item: CompletionItem, _token: CancellationToken) {
    if (!item.data) return item;
    const itemData = item.data as CompletionItemDataType;

    if (itemData.source === 'laravel-php-constant') {
      const resolveItem = await phpConstantCompletionHandler.doResolveCompletionItem(
        item,
        _token,
        this.extensionContext
      );
      return resolveItem;
    }

    return item;
  }
}
