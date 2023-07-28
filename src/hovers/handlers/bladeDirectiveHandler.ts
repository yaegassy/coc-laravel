import { LinesTextDocument, Position, workspace } from 'coc.nvim';

import fs from 'fs';
import path from 'path';

import { bladeHovers, type BladeDirectiveHoverType } from '../services/bladeDirectiveService';

export async function doHover(document: LinesTextDocument, position: Position, docDataDir: string) {
  let value: string | null = null;

  const doc = workspace.getDocument(document.uri);
  if (!doc) return null;
  const wordRange = doc.getWordRangeAtPosition(position, '@');
  if (!wordRange) return null;
  const text = document.getText(wordRange) || '';
  if (!text) return null;

  value = await getHover(text, docDataDir);
  if (!value) return undefined;

  return value;
}

async function getHover(text: string, docDataDir: string) {
  let r: string | null = null;

  const defineHovers: BladeDirectiveHoverType[] = bladeHovers;

  for (const h in defineHovers) {
    if (text === defineHovers[h].prefix || defineHovers[h].alias.includes(text)) {
      const markdownPath = path.join(
        docDataDir,
        'blade',
        // File names remove the @ and $.
        defineHovers[h].prefix.replace(/@|\$/, '') + '.md'
      );

      try {
        r = await fs.promises.readFile(markdownPath, { encoding: 'utf8' });
      } catch (e) {
        return r;
      }
      break;
    }
  }

  return r;
}
