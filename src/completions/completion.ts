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

import * as bladeCommon from '../common/blade';
import { getArtisanPath, getViewPath } from '../common/shared';
import { config } from '../config';
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
import * as eloquentModelFieldCompletionHandler from './handlers/eloquentModelFieldHandler';
import * as envCompletionHandler from './handlers/envHandler';
import * as guardCompletionHandler from './handlers/guardHandler';
import * as livewireActionCompletionHandler from './handlers/livewireActionHandler';
import * as livewireDirectiveCompletionHandler from './handlers/livewireDirectiveHandler';
import * as livewireEventCompletionHandler from './handlers/livewireEventHandler';
import * as livewirePropertyHandler from './handlers/livewirePropertyHandler';
import * as livewireTagCompletionHandler from './handlers/livewireTagHandler';
import * as middlewareCompletionHandler from './handlers/middlewareHandler';
import * as phpClassCompletionHandler from './handlers/phpClassHandler';
import * as phpConstantCompletionHandler from './handlers/phpConstantHandler';
import * as phpFunctionCompletionHandler from './handlers/phpFunctionHandler';
import * as phpKeywordCompletionHandler from './handlers/phpKeywordHandler';
import * as phpObjectMemberCompletionHandler from './handlers/phpObjectMemberHandler';
import * as phpStaticClassCompletionHandler from './handlers/phpStaticClassHandler';
import * as phpVariableCompletionHandler from './handlers/phpVariableHandler';
import * as routeCompletionHandler from './handlers/routeHandler';
import * as translationCompletionHandler from './handlers/translationHandler';
import * as validationCompletionHandler from './handlers/validationHandler';
import * as viewCompletionHandler from './handlers/viewHandler';
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
      new LaravelCompletionProvider(context, projectManager, viewPath, artisanPath, outputChannel),
      [
        '>', //  php object member
        '\\', //  php related
        '$', // livewire property completion, php related
        '@', // directive,
        '<', // component,
        ':', // guard, php related
        '.', // route, view
        '"', // config, validation, env, route, view, middleware, eloquentModelField
        "'", // config, validation, env, route, view, middleware, eloquentModelField
        '|', // validation
      ]
    )
  );
}

class LaravelCompletionProvider implements CompletionItemProvider {
  extensionContext: ExtensionContext;
  projectManager: ProjectManagerType;
  artisanPath: string;
  viewPath: string;
  outputChannel: OutputChannel;

  private isCocBladeCompletionEnableDirective: boolean;

  constructor(
    context: ExtensionContext,
    projectManager: ProjectManagerType,
    viewPath: string,
    artisanPath: string,
    outputChannel: OutputChannel
  ) {
    this.extensionContext = context;
    this.projectManager = projectManager;
    this.viewPath = viewPath;
    this.artisanPath = artisanPath;
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
    context?: CompletionContext
  ) {
    const items: CompletionItem[] | CompletionList = [];
    const isIncompletes: boolean[] = [];

    const code = document.getText();
    const offset = document.offsetAt(position);

    let isOffsetInPhpRelatedRegion: boolean = false;
    if (document.languageId === 'blade') {
      isOffsetInPhpRelatedRegion = await bladeCommon.isEditorOffsetInBladePhpRelatedRegion(code, offset);
    }

    // config [php, blade]
    if (config.completion.configEnable) {
      const configCompletionItems = await configCompletionHandler.doCompletion(document, position);
      if (configCompletionItems) items.push(...configCompletionItems);

      if (isOffsetInPhpRelatedRegion) {
        const bladeConfigCompletionItems = await bladeConfigCompletionHandler.doCompletion(document, position);
        if (bladeConfigCompletionItems) items.push(...bladeConfigCompletionItems);
      }
    }

    // env [php, blade]
    if (config.completion.envEnable) {
      const envCompletionItems = await envCompletionHandler.doCompletion(document, position);
      if (envCompletionItems) items.push(...envCompletionItems);

      if (isOffsetInPhpRelatedRegion) {
        const bladeEnvCompletionItems = await bladeEnvCompletionHandler.doCompletion(document, position);
        if (bladeEnvCompletionItems) items.push(...bladeEnvCompletionItems);
      }
    }

    // validation [php]
    if (config.completion.validationEnable) {
      const validationCompletionItems = await validationCompletionHandler.doCompletion(document, position);
      if (validationCompletionItems) items.push(...validationCompletionItems);
    }

    // route [php, blade]
    if (config.completion.routeEnable) {
      const routeCompletionItems = await routeCompletionHandler.doCompletion(document, position);
      if (routeCompletionItems) items.push(...routeCompletionItems);

      if (isOffsetInPhpRelatedRegion) {
        const bladeRouteCompletionItems = await bladeRouteCompletionHandler.doCompletion(document, position);
        if (bladeRouteCompletionItems) items.push(...bladeRouteCompletionItems);
      }
    }

    // view [php, blade]
    if (config.completion.viewEnable) {
      const viewCompletionItems = await viewCompletionHandler.doCompletion(
        document,
        position,
        this.projectManager.bladeProjectManager
      );
      if (viewCompletionItems) items.push(...viewCompletionItems);

      const bladeViewCompletionItems = await bladeViewCompletionHanlder.doCompletion(
        document,
        position,
        this.projectManager.bladeProjectManager
      );
      if (bladeViewCompletionItems) items.push(...bladeViewCompletionItems);
    }

    // middleware [php]
    if (config.completion.middlewareEnable) {
      const middlewareCompletionItems = await middlewareCompletionHandler.doCompletion(document, position);
      if (middlewareCompletionItems) items.push(...middlewareCompletionItems);
    }

    // guard [php, blade]
    if (config.completion.guardEnable) {
      const guardCompletionItems = await guardCompletionHandler.doCompletion(document, position);
      if (guardCompletionItems) items.push(...guardCompletionItems);

      const bladeGuardCompletionItems = await bladeGuardCompletionHandler.doCompletion(document, position);
      if (bladeGuardCompletionItems) items.push(...bladeGuardCompletionItems);
    }

    // translation [php, blade]
    if (config.completion.translationEnable) {
      const translationCompletionItems = await translationCompletionHandler.doCompletion(
        document,
        position,
        this.projectManager.translationProjectManager
      );
      if (translationCompletionItems) items.push(...translationCompletionItems);

      const bladeTranslationCompletionItems = await bladeTranslationCompletionHandler.doCompletion(
        document,
        position,
        this.projectManager.translationProjectManager
      );
      if (bladeTranslationCompletionItems) items.push(...bladeTranslationCompletionItems);
    }

    // component (tag) [blade]
    if (config.completion.componentEnable) {
      // falsy
      if (!isOffsetInPhpRelatedRegion) {
        const componentCompletionItems = await bladeComponentCompletionHandler.doCompletion(
          document,
          position,
          this.projectManager.bladeProjectManager
        );
        if (componentCompletionItems) items.push(...componentCompletionItems);
      }
    }

    // php function [blade]
    if (config.completion.phpFunctionEnable) {
      if (isOffsetInPhpRelatedRegion) {
        const phpFunctionCompletionItems = await phpFunctionCompletionHandler.doCompletion(
          document,
          position,
          this.projectManager.phpFunctionProjectManager,
          context
        );
        if (phpFunctionCompletionItems) items.push(...phpFunctionCompletionItems);
      }
    }

    // php class (class, interface, trait, enum) [blade]
    if (config.completion.phpClassEnable) {
      if (isOffsetInPhpRelatedRegion) {
        const phpClassCompletionItems = await phpClassCompletionHandler.doCompletion(
          document,
          position,
          this.projectManager.phpClassProjectManager,
          context
        );
        if (phpClassCompletionItems) items.push(...phpClassCompletionItems);
      }
    }

    // php static class (DateTime::|) [blade]
    if (config.completion.phpStaticClassEnable) {
      if (isOffsetInPhpRelatedRegion) {
        const phpStaticClassCompletionItems = await phpStaticClassCompletionHandler.doCompletion(
          document,
          position,
          this.projectManager.phpClassProjectManager,
          this.artisanPath
        );
        if (phpStaticClassCompletionItems) items.push(...phpStaticClassCompletionItems);
      }
    }

    // php object member ($obj->|) [blade]
    if (config.completion.phpObjectMemberEnable) {
      if (isOffsetInPhpRelatedRegion) {
        const phpObjectMemberCompletionItems = await phpObjectMemberCompletionHandler.doCompletion(
          document,
          position,
          this.artisanPath
        );
        if (phpObjectMemberCompletionItems) items.push(...phpObjectMemberCompletionItems);
      }
    }

    // php variable [blade]
    if (config.completion.phpVariableEnable) {
      if (isOffsetInPhpRelatedRegion) {
        const phpVariableCompletionItems = await phpVariableCompletionHandler.doCompletion(document, position);
        if (phpVariableCompletionItems) items.push(...phpVariableCompletionItems);
      }
    }

    // php constant [blade]
    if (config.completion.phpConstantEnable) {
      if (isOffsetInPhpRelatedRegion) {
        const phpConstantCompletionItems = await phpConstantCompletionHandler.doCompletion(
          document,
          position,
          this.projectManager.phpConstantProjectManager
        );
        if (phpConstantCompletionItems) items.push(...phpConstantCompletionItems);
      }
    }

    // php keyword [blade]
    if (config.completion.phpKeywordEnable) {
      if (isOffsetInPhpRelatedRegion) {
        const phpKeywordCompletionItems = await phpKeywordCompletionHandler.doCompletion(document, position);
        if (phpKeywordCompletionItems) items.push(...phpKeywordCompletionItems);
      }
    }

    // method parameter [blade]
    if (config.completion.methodParameterEnable) {
      const methodParameterCompletionItems = await bladeMethodParameterHandler.doCompletion(document, position);
      if (methodParameterCompletionItems) items.push(...methodParameterCompletionItems);
    }

    // directive [blade]
    if (config.completion.directiveEnable && !this.isCocBladeCompletionEnableDirective) {
      const bladeDirectiveCompletionItems = await bladeDirectiveCompletionHandler.doCompletion(document, position);
      if (bladeDirectiveCompletionItems) items.push(...bladeDirectiveCompletionItems);
    }

    // livewire [blade]
    if (config.completion.livewireEnable) {
      // falsy
      if (!isOffsetInPhpRelatedRegion) {
        const livewireTagCompletionItems = await livewireTagCompletionHandler.doCompletion(
          document,
          position,
          this.projectManager.livewireProjectManager
        );
        if (livewireTagCompletionItems) items.push(...livewireTagCompletionItems);
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

      if (isOffsetInPhpRelatedRegion) {
        const livewirePropertyCompletionItems = await livewirePropertyHandler.doCompletion(
          document,
          position,
          this.projectManager.livewireProjectManager,
          this.viewPath
        );
        if (livewirePropertyCompletionItems) items.push(...livewirePropertyCompletionItems);
      }
    }

    // eloquentModelField [php]
    if (config.completion.eloquentModelFieldEnable) {
      const eloquentModelFieldCompletionItems = await eloquentModelFieldCompletionHandler.doCompletion(
        document,
        position,
        this.projectManager.eloquentModelProjectManager
      );
      if (eloquentModelFieldCompletionItems) items.push(...eloquentModelFieldCompletionItems);
    }

    if (isIncompletes.includes(true)) {
      return CompletionList.create(items, true);
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
    } else if (itemData.source === 'laravel-php-function') {
      const resolveItem = await phpFunctionCompletionHandler.doResolveCompletionItem(
        item,
        _token,
        this.extensionContext
      );
      return resolveItem;
    } else if (itemData.source === 'laravel-php-class') {
      const resolveItem = await phpClassCompletionHandler.doResolveCompletionItem(item, _token, this.extensionContext);
      return resolveItem;
    } else if (itemData.source === 'laravel-php-static-class') {
      const resolveItem = await phpStaticClassCompletionHandler.doResolveCompletionItem(item, _token, this.artisanPath);
      return resolveItem;
    } else if (itemData.source === 'laravel-php-variable') {
      const resolveItem = await phpVariableCompletionHandler.doResolveCompletionItem(item, _token, this.artisanPath);
      return resolveItem;
    } else if (itemData.source === 'laravel-php-object-member') {
      const resolveItem = await phpObjectMemberCompletionHandler.doResolveCompletionItem(
        item,
        _token,
        this.artisanPath
      );
      return resolveItem;
    }

    return item;
  }
}
