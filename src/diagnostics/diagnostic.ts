import { Diagnostic, DiagnosticCollection, ExtensionContext, TextDocument, languages, workspace } from 'coc.nvim';

import * as bladeMethodParameterDiagnosticHandler from './handlers/bladeMethodParameterHandler';

export async function register(context: ExtensionContext) {
  if (!workspace.getConfiguration('laravel').get('diagnostic.enable')) return;
  const { document } = await workspace.getCurrentState();
  if (document.languageId !== 'blade') return;

  const diagManager = new LaravelDiagnosticManager();

  // FistOpen and onOpen
  workspace.documents.map(async (doc) => {
    await diagManager.doValidate(doc.textDocument);
  });
  workspace.onDidOpenTextDocument(
    async (e) => {
      await diagManager.doValidate(e);
    },
    null,
    context.subscriptions
  );

  // onChange
  workspace.onDidChangeTextDocument(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (_e) => {
      const doc = await workspace.document;
      await diagManager.doValidate(doc.textDocument);
    },
    null,
    context.subscriptions
  );

  // onSave
  workspace.onDidSaveTextDocument(
    async (e) => {
      await diagManager.doValidate(e);
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

  public async doValidate(textDocument: TextDocument): Promise<void> {
    if (textDocument.languageId !== 'blade') return;

    const diagnostics: Diagnostic[] = [];

    const methodParameterDiagnostics = await bladeMethodParameterDiagnosticHandler.doValidate(textDocument);
    if (methodParameterDiagnostics) diagnostics.push(...methodParameterDiagnostics);

    if (diagnostics.length === 0) this.collection.clear();
    this.collection.set(textDocument.uri, diagnostics);
  }
}
