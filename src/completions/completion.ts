import {
  CancellationToken,
  CompletionContext,
  CompletionItem,
  CompletionItemProvider,
  CompletionList,
  ExtensionContext,
  languages,
  LinesTextDocument,
  Position,
  workspace,
} from 'coc.nvim';

import { DOCUMENT_SELECTOR, SUPPORTED_LANGUAGE } from '../constant';
import { type ProjectManagerType } from '../projects/types';
import * as bladeGuardCompletionHandler from './handlers/bladeGuardHandler';
import * as bladeRouteCompletionHandler from './handlers/bladeRouteHandler';
import * as bladeTranslationCompletionHandler from './handlers/bladeTranslationHandler';
import * as bladeViewCompletionHanlder from './handlers/bladeViewHandler';
import * as configCompletionHandler from './handlers/configHandler';
import * as envCompletionHandler from './handlers/envHandler';
import * as guardCompletionHandler from './handlers/guardHandler';
import * as middlewareCompletionHandler from './handlers/middlewareHandler';
import * as routeCompletionHandler from './handlers/routeHandler';
import * as validationCompletionHandler from './handlers/validationHandler';
import * as viewCompletionHandler from './handlers/viewHandler';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function register(context: ExtensionContext, projectManager: ProjectManagerType) {
  if (!workspace.getConfiguration('laravel').get('completion.enable')) return;

  const { document } = await workspace.getCurrentState();

  if (!SUPPORTED_LANGUAGE.includes(document.languageId)) return;

  // Register provider
  context.subscriptions.push(
    languages.registerCompletionItemProvider(
      'laravel',
      'LV',
      DOCUMENT_SELECTOR,
      new LaravelCompletionProvider(context, projectManager),
      [
        ':', // guard,
        '.', // route, view
        '"', // config, validation, env, route, view, middleware
        "'", // config, validation, env, route, view, middleware
        '|', // validation
      ]
    )
  );
}

class LaravelCompletionProvider implements CompletionItemProvider {
  private _context: ExtensionContext;
  public projectManager: ProjectManagerType;

  constructor(context: ExtensionContext, projectManager: ProjectManagerType) {
    this._context = context;
    this.projectManager = projectManager;
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
    }

    // env
    if (workspace.getConfiguration('laravel').get('completion.envEnable')) {
      const envCompletionItems = await envCompletionHandler.doCompletion(document, position);
      if (envCompletionItems) {
        items.push(...envCompletionItems);
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

      // TODO: Use blade parser to determine if the cursol position is completable.
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

      // TODO: Use blade parser to determine if the cursol position is completable.
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
      const translationCompletionItems = await bladeTranslationCompletionHandler.doCompletion(
        document,
        position,
        this.projectManager.translationProjectManager
      );
      if (translationCompletionItems) {
        items.push(...translationCompletionItems);
      }
    }

    return items;
  }
}
