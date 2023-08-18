import { LinesTextDocument, Position, workspace } from 'coc.nvim';

import * as bladeCommon from '../../common/blade';
import { type BladeProjectsManagerType } from '../../projects/types';

export async function doHover(
  document: LinesTextDocument,
  position: Position,
  bladeProjectManager: BladeProjectsManagerType
) {
  let value: string | null = null;

  const doc = workspace.getDocument(document.uri);
  if (!doc) return null;
  const wordRange = doc.getWordRangeAtPosition(position, '.-_');
  if (!wordRange) return null;
  const text = document.getText(wordRange) || '';
  if (!text) return null;

  const code = document.getText();
  const isComponentRegion = bladeCommon.isEditorPositionInComponentRegion(code, position);
  if (!isComponentRegion) return null;

  const component = bladeProjectManager.componentMapStore.get(text);
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
