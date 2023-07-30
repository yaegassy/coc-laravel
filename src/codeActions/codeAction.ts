import {
  CodeAction,
  CodeActionContext,
  CodeActionProvider,
  ExtensionContext,
  languages,
  Range,
  TextDocument,
  workspace,
} from 'coc.nvim';

import { DOCUMENT_SELECTOR, SUPPORTED_LANGUAGE } from '../constant';
import * as bladeMethodDirectiveParameterHandler from './handlers/bladeMethodDirectiveParameterHandler';
import * as bladeMissingComponentHandler from './handlers/bladeMissingComponentHandler';
import * as createBladeComponentInternalCommand from './internalCommands/createBladeComponent';
import * as fixMethodDirectiveParameterInternalCommand from './internalCommands/fixMethodDirectiveParameter';

export async function register(context: ExtensionContext) {
  if (!workspace.getConfiguration('laravel').get('codeAction.enable')) return;
  const { document } = await workspace.getCurrentState();
  if (!SUPPORTED_LANGUAGE.includes(document.languageId)) return;

  context.subscriptions.push(
    languages.registerCodeActionProvider(DOCUMENT_SELECTOR, new LaravelCodeActionProvider(), 'laravel')
  );

  // Register Internal Commands
  fixMethodDirectiveParameterInternalCommand.register(context);
  createBladeComponentInternalCommand.register(context);
}

class LaravelCodeActionProvider implements CodeActionProvider {
  constructor() {}

  async provideCodeActions(document: TextDocument, range: Range, context: CodeActionContext) {
    const codeActions: CodeAction[] = [];

    // blade missing component
    const bladeMissingComponentActions = await bladeMissingComponentHandler.doAction(document, range, context);
    if (bladeMissingComponentActions) codeActions.push(...bladeMissingComponentActions);

    // blade method directive parameter
    const bladeMethodDirectiveParameterActions = await bladeMethodDirectiveParameterHandler.doAction(
      document,
      range,
      context
    );
    if (bladeMethodDirectiveParameterActions) codeActions.push(...bladeMethodDirectiveParameterActions);

    return codeActions;
  }
}
