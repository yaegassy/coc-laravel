import { LinesTextDocument, Position, workspace } from 'coc.nvim';

import * as bladeParser from '../../parsers/blade/parser';
import { type ProjectManagerType } from '../../projects/types';

export async function doHover(document: LinesTextDocument, position: Position, projectManager: ProjectManagerType) {
  let value: string | null = null;

  const doc = workspace.getDocument(document.uri);
  if (!doc) return null;
  const wordRange = doc.getWordRangeAtPosition(position, '.-_');
  if (!wordRange) return null;
  const text = document.getText(wordRange) || '';
  if (!text) return null;

  const code = document.getText();
  const isComponentRegion = bladeParser.isComponentRegion(code, position);
  if (!isComponentRegion) return null;

  const component = projectManager.bladeProjectManager.componentMapStore.get(text);
  if (component) {
    const relativeComponentPathPath = component.path.replace(workspace.root, '').replace(/^\//, '');

    let documentation: string | undefined = undefined;
    if (component.props.length > 0) {
      documentation = `Props:\n`;
      for (const prop of component.props) {
        documentation += '  - ' + prop.propsKey + ' => ' + prop.propsValue + '\n';
      }
    }

    if (documentation) {
      value = relativeComponentPathPath + '\n\n' + documentation;
    } else {
      value = relativeComponentPathPath;
    }
  }

  if (!value) return undefined;

  return value;
}
