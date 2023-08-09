import {
  Diagnostic,
  DiagnosticCollection,
  ExtensionContext,
  OutputChannel,
  TextDocument,
  languages,
  workspace,
} from 'coc.nvim';

import { SUPPORTED_LANGUAGE } from '../constant';
import { type ProjectManagerType } from '../projects/types';
import * as bladeMethodParameterDiagnosticHandler from './handlers/bladeMethodParameterHandler';
import * as bladeMissingComponentDiagnosticHandler from './handlers/bladeMissingComponentHandler';

export async function register(
  context: ExtensionContext,
  projectManager: ProjectManagerType,
  outputChannel: OutputChannel
) {
  if (!workspace.getConfiguration('laravel').get('diagnostic.enable')) return;

  const { document } = await workspace.getCurrentState();
  if (!SUPPORTED_LANGUAGE.includes(document.languageId)) return;

  outputChannel.appendLine('Start registration for diagnostic feature');

  const diagManager = new LaravelDiagnosticManager(projectManager, outputChannel);

  // FistOpen and onOpen
  workspace.documents.map(async (doc) => {
    if (SUPPORTED_LANGUAGE.includes(doc.languageId)) {
      await diagManager.doValidate(doc.textDocument);
    }
  });
  workspace.onDidOpenTextDocument(
    async (e) => {
      if (SUPPORTED_LANGUAGE.includes(e.languageId)) {
        await diagManager.doValidate(e);
      }
    },
    null,
    context.subscriptions
  );

  // onChange
  workspace.onDidChangeTextDocument(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (_e) => {
      const doc = await workspace.document;
      if (SUPPORTED_LANGUAGE.includes(doc.languageId)) {
        await diagManager.doValidate(doc.textDocument);
      }
    },
    null,
    context.subscriptions
  );

  // onSave
  workspace.onDidSaveTextDocument(
    async (e) => {
      if (SUPPORTED_LANGUAGE.includes(e.languageId)) {
        await diagManager.doValidate(e);
      }
    },
    null,
    context.subscriptions
  );
}

class LaravelDiagnosticManager {
  private collection: DiagnosticCollection;
  projectManager: ProjectManagerType;
  outputChannel: OutputChannel;

  constructor(projectManager: ProjectManagerType, outputChannel: OutputChannel) {
    this.projectManager = projectManager;
    this.collection = languages.createDiagnosticCollection('laravel');
    this.outputChannel = outputChannel;
  }

  async doValidate(textDocument: TextDocument): Promise<void> {
    const diagnostics: Diagnostic[] = [];

    // blade missing component
    const missingComponentDiagnostics = await bladeMissingComponentDiagnosticHandler.doValidate(
      textDocument,
      this.projectManager.bladeProjectManager
    );
    if (missingComponentDiagnostics) diagnostics.push(...missingComponentDiagnostics);

    // blade method parameter
    const methodParameterDiagnostics = await bladeMethodParameterDiagnosticHandler.doValidate(textDocument);
    if (methodParameterDiagnostics) diagnostics.push(...methodParameterDiagnostics);

    // Set
    if (diagnostics.length === 0) this.collection.clear();
    this.collection.set(textDocument.uri, diagnostics);
  }
}
