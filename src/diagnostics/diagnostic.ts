import { Diagnostic, DiagnosticCollection, ExtensionContext, TextDocument, languages, workspace } from 'coc.nvim';

import * as bladeMethodParameterDiagnosticHandler from './handlers/bladeMethodParameterHandler';

import { SUPPORTED_LANGUAGE } from '../constant';

export async function register(context: ExtensionContext) {
  if (!workspace.getConfiguration('laravel').get('diagnostic.enable')) return;
  const { document } = await workspace.getCurrentState();
  if (!SUPPORTED_LANGUAGE.includes(document.languageId)) return;

  const diagManager = new LaravelDiagnosticManager();

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

  constructor() {
    this.collection = languages.createDiagnosticCollection('laravel');
  }

  async doValidate(textDocument: TextDocument): Promise<void> {
    const diagnostics: Diagnostic[] = [];

    const methodParameterDiagnostics = await bladeMethodParameterDiagnosticHandler.doValidate(textDocument);
    if (methodParameterDiagnostics) diagnostics.push(...methodParameterDiagnostics);

    if (diagnostics.length === 0) this.collection.clear();
    this.collection.set(textDocument.uri, diagnostics);
  }
}
