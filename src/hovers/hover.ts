import {
  CancellationToken,
  ExtensionContext,
  Hover,
  HoverProvider,
  LinesTextDocument,
  MarkupContent,
  MarkupKind,
  Position,
  languages,
} from 'coc.nvim';

import { DOCUMENT_SELECTOR } from '../constant';
import { type ProjectManagerType } from '../projects/types';
import * as bladeComponentTagHandler from './handlers/bladeComponentTagHandler';
import * as bladeDirectiveHandler from './handlers/bladeDirectiveHandler';

import path from 'path';

export async function register(context: ExtensionContext, projectManager: ProjectManagerType) {
  context.subscriptions.push(
    languages.registerHoverProvider(DOCUMENT_SELECTOR, new LaravelHoverProvider(context, projectManager))
  );
}

class LaravelHoverProvider implements HoverProvider {
  extensionContext: ExtensionContext;
  projectManager: ProjectManagerType;

  constructor(context: ExtensionContext, projectManager: ProjectManagerType) {
    this.extensionContext = context;
    this.projectManager = projectManager;
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

    const bladeComponentTagValue = await bladeComponentTagHandler.doHover(document, position, this.projectManager);
    if (bladeComponentTagValue) {
      contents.value += `${bladeComponentTagValue}\n\n`;
    }

    const docDataDir = path.join(this.extensionContext.extensionPath, 'resources', 'markdownData');
    const bladeDirectiveValue = await bladeDirectiveHandler.doHover(document, position, docDataDir);
    if (bladeDirectiveValue) {
      contents.value += `${bladeDirectiveValue}\n\n`;
    }

    if (contents.value.length === 0) return null;

    return {
      contents,
    };
  }
}
