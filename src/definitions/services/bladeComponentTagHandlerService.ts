import path from 'path';
import fs from 'fs';

import { getAppPath, getArtisanPath } from '../../common/shared';
import * as phpParser from '../../parsers/php/parser';
import { Call, Name, String as StringNode } from 'php-parser';

export async function getClassBasedComponentFilePath(name: string) {
  const classComponentBaseDir = await getClassComponentBaseDir();
  if (!classComponentBaseDir) return;

  const relativeComponentClassFilePath = getRelativeComponentClassFilePathFromComponentTagName(name);
  const componentClassFilePath = path.join(classComponentBaseDir, relativeComponentClassFilePath);

  return componentClassFilePath;
}

async function getClassComponentBaseDir() {
  const artisanPath = getArtisanPath();
  if (!artisanPath) return;

  const appPath = await getAppPath(artisanPath);
  if (!appPath) return;

  return path.join(appPath, 'View', 'Components');
}

function getRelativeComponentClassFilePathFromComponentTagName(name: string) {
  const stripComponentPrefix = name.replace(/^x-/, '');
  const splitName = stripComponentPrefix.split('.');
  const capitalizedArr = splitName.map((v) => capitalize(v));
  const relativeComponentClassFilePath = capitalizedArr.join(path.sep) + '.php';

  return relativeComponentClassFilePath;
}

function capitalize(s: string) {
  if (typeof s !== 'string' || !s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export async function getCallViewOfViewValue(file: string) {
  const code = await fs.promises.readFile(file, { encoding: 'utf8' });
  const ast = phpParser.getAst(code);
  if (!ast) return;

  let value: string | undefined | undefined;

  phpParser.walk((node) => {
    if (node.kind !== 'call') return;

    const callNode = node as Call;
    if (!callNode.loc) return;
    if (callNode.what.kind !== 'name') return;

    const nameNode = callNode.what as Name;
    if (nameNode.name !== 'view') return;
    if (callNode.arguments.length === 0) return;
    if (callNode.arguments[0].kind !== 'string') return;
    const stringNode = callNode.arguments[0] as StringNode;

    value = stringNode.value;
  }, ast);

  return value;
}
