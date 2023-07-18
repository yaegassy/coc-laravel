import { BladeDocument } from 'stillat-blade-parser/out/document/bladeDocument';

export function getBladeDocument(code: string) {
  const parsedBladeDoc = BladeDocument.fromText(code);
  if (parsedBladeDoc) {
    return parsedBladeDoc;
  }

  return undefined;
}
