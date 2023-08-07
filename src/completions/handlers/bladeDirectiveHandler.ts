import { CompletionItem, CompletionItemKind, LinesTextDocument, Position, TextEdit, workspace } from 'coc.nvim';

export async function doCompletion(document: LinesTextDocument, position: Position) {
  if (document.languageId !== 'blade') return [];

  const items: CompletionItem[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  let wordWithExtraChars: string | undefined = undefined;
  const wordWithExtraCharsRange = doc.getWordRangeAtPosition(
    Position.create(position.line, position.character - 1),
    '@'
  );
  if (wordWithExtraCharsRange) {
    wordWithExtraChars = document.getText(wordWithExtraCharsRange);
  }
  if (!wordWithExtraChars) return [];
  if (!wordWithExtraChars.startsWith('@')) return [];

  const directives = workspace.getConfiguration('laravel').get<string[]>('completion.directiveList', []);

  for (const directive of directives) {
    const adjustStartCharacter = wordWithExtraChars
      ? position.character - wordWithExtraChars.length
      : position.character;

    const edit: TextEdit = {
      range: {
        start: { line: position.line, character: adjustStartCharacter },
        end: position,
      },
      newText: directive,
    };

    items.push({
      label: directive,
      kind: CompletionItemKind.Keyword,
      insertText: directive,
      textEdit: edit,
    });
  }

  return items;
}
