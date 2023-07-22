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

export async function register(context: ExtensionContext, projectManager: ProjectManagerType) {
  context.subscriptions.push(
    languages.registerHoverProvider(DOCUMENT_SELECTOR, new LaravelHoverProvider(context, projectManager))
  );
}

class LaravelHoverProvider implements HoverProvider {
  _context: ExtensionContext;
  projectManager: ProjectManagerType;

  constructor(context: ExtensionContext, projectManager: ProjectManagerType) {
    this._context = context;
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

    if (contents.value.length === 0) return null;

    return {
      contents,
    };
  }
}
