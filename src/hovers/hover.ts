import {
  CancellationToken,
  ExtensionContext,
  Hover,
  HoverProvider,
  LinesTextDocument,
  MarkupContent,
  MarkupKind,
  OutputChannel,
  Position,
  languages,
} from 'coc.nvim';

import { DOCUMENT_SELECTOR } from '../constant';
import { type ProjectManagerType } from '../projects/types';
import * as bladeComponentTagHandler from './handlers/bladeComponentTagHandler';

export async function register(
  context: ExtensionContext,
  projectManager: ProjectManagerType,
  outputChannel: OutputChannel
) {
  outputChannel.appendLine('Start registration for hover feature');

  context.subscriptions.push(
    languages.registerHoverProvider(DOCUMENT_SELECTOR, new LaravelHoverProvider(context, projectManager, outputChannel))
  );
}

class LaravelHoverProvider implements HoverProvider {
  extensionContext: ExtensionContext;
  projectManager: ProjectManagerType;
  outputChannel: OutputChannel;

  constructor(context: ExtensionContext, projectManager: ProjectManagerType, outputChannel: OutputChannel) {
    this.extensionContext = context;
    this.projectManager = projectManager;
    this.outputChannel = outputChannel;
  }

  async provideHover(
    document: LinesTextDocument,
    position: Position,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _token: CancellationToken
  ): Promise<Hover | null | undefined> {
    const contents: MarkupContent = {
      kind: MarkupKind.Markdown,
      value: '',
    };

    const bladeComponentTagValue = await bladeComponentTagHandler.doHover(
      document,
      position,
      this.projectManager.bladeProjectManager
    );
    if (bladeComponentTagValue) {
      contents.value += `${bladeComponentTagValue}\n\n`;
    }

    if (contents.value.length === 0) return null;

    return {
      contents,
    };
  }
}
