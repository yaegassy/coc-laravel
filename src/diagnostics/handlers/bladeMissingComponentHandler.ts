import { Diagnostic, TextDocument } from 'coc.nvim';

import { BladeComponentNode } from 'stillat-blade-parser/out/nodes/nodes';

import { type DiagnosticDataType } from '../../common/types';
import * as bladeParser from '../../parsers/blade/parser';
import { type ProjectManagerType } from '../../projects/types';

export async function doValidate(textDocument: TextDocument, projectManager: ProjectManagerType) {
  if (textDocument.languageId !== 'blade') return;

  const diagnostics: Diagnostic[] = [];

  const code = textDocument.getText();
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return [];

  const documentComponents: { name: string; startOffset: number; endOffset: number }[] = [];

  for (const node of bladeDoc.getAllNodes()) {
    if (node instanceof BladeComponentNode) {
      if (!node.startPosition) continue;
      const componentName = 'x-' + node.getComponentName();

      const startOffset = node.startPosition.offset;
      const endOffset = node.endPosition ? node.endPosition.offset : node.startPosition.offset;

      documentComponents.push({
        name: componentName,
        startOffset,
        endOffset,
      });
    }
  }

  for (const documentComponent of documentComponents) {
    if (documentComponent.name === 'x-slot') continue;
    if (!projectManager.bladeProjectManager.isInitialized()) continue;
    if (projectManager.bladeProjectManager.componentMapStore.get(documentComponent.name)) continue;

    const diagnostic: Diagnostic = {
      source: 'laravel',
      severity: 2,
      code: 'BMC001',
      message: `Blade component not found: ${documentComponent.name}`,
      range: {
        start: textDocument.positionAt(documentComponent.startOffset),
        end: textDocument.positionAt(documentComponent.endOffset),
      },
      data: <DiagnosticDataType>{
        bladeComponentName: documentComponent.name,
      },
    };

    diagnostics.push(diagnostic);
  }

  return diagnostics;
}
