import fs from 'fs';
import path from 'path';
import { Array as ArrayNode, Bin, Entry, Return, String as StringNode, Variable } from 'php-parser';

import * as phpParser from '../parsers/php/parser';
import { ComposerJsonContentType, PHPNamespaceType } from './types';

export async function getComposerJsonContent(rootDir: string) {
  const composerJsonPath = path.join(rootDir, 'composer.json');
  let composerJsonContent: ComposerJsonContentType | null = null;
  try {
    composerJsonContent = JSON.parse(await fs.promises.readFile(composerJsonPath, 'utf8'));
  } catch (error) {
    composerJsonContent = null;
  }

  return composerJsonContent;
}

export function getProjectNamespacesFromComposerJson(composerJsonContent: ComposerJsonContentType) {
  const projectNamespaces: { [key: string]: string }[] = [];

  if (composerJsonContent.autoload) {
    if ('psr-4' in composerJsonContent.autoload) {
      for (const [k, v] of Object.entries(composerJsonContent.autoload['psr-4'])) {
        projectNamespaces.push({
          [k]: v,
        });
      }
    }
  }

  if (composerJsonContent['autoload-dev']) {
    if ('psr-4' in composerJsonContent['autoload-dev']) {
      for (const [k, v] of Object.entries(composerJsonContent['autoload-dev']['psr-4'])) {
        projectNamespaces.push({
          [k]: v,
        });
      }
    }
  }

  return projectNamespaces;
}

export function getRelativeClassFilePathFromNamespaces(namespaces: PHPNamespaceType[], namespaceClass: string) {
  for (const namespace of namespaces) {
    for (const [k, v] of Object.entries(namespace)) {
      if (namespaceClass.startsWith(k)) {
        const converted = namespaceClass
          .replace(/^\\\\/, '') // For FQCN, remove the first backslash
          .replace(k, v)
          .replace(/\\/g, '/'); // Replace backslash with path-style slash

        return converted + '.php';
      }
    }
  }
}

export function getFileNamespace(namespaces: PHPNamespaceType[], relativeFilePath: string) {
  const fileName = path.basename(relativeFilePath);

  for (const namespace of namespaces) {
    for (const k of Object.keys(namespace)) {
      if (relativeFilePath.startsWith(namespace[k])) {
        const fileNamespace = relativeFilePath
          .replace(namespace[k], k)
          .replace(/\//g, '\\')
          .replace(fileName, '')
          .replace(/\\$/, '');

        return fileNamespace;
      }
    }
  }
}

export function getAbusoluteFileResourcesAtVendorComposerTargetFileOfphpCode(code: string, rootDir: string) {
  const resourceFiles: { key: string; value: string; dirVariable: string }[] = [];

  const ast = phpParser.getAstByParseCode(code);
  if (!ast) return [];

  phpParser.walk((node) => {
    if (node.kind !== 'return') return;
    const returnNode = node as Return;
    if (!returnNode.expr) return;
    if (returnNode.expr.kind !== 'array') return;
    const arrayNode = returnNode.expr as ArrayNode;
    if (arrayNode.items.length === 0) return;
    for (const item of arrayNode.items) {
      if (item.kind !== 'entry') continue;
      const entryNode = item as Entry;
      if (!entryNode.key) continue;
      if (entryNode.key.kind !== 'string') continue;
      // ===
      const keyStringNode = entryNode.key as StringNode;
      const key = keyStringNode.value;

      if (entryNode.value.kind !== 'bin') continue;
      const binNode = entryNode.value as Bin;
      if (binNode.left.kind !== 'variable') continue;
      const variableNode = binNode.left as Variable;
      if (typeof variableNode.name !== 'string') return;
      // ===
      const dirVariable = variableNode.name;
      if (binNode.right.kind !== 'string') continue;
      const stringNode = binNode.right as StringNode;
      // ===
      const value = stringNode.value;

      resourceFiles.push({
        key,
        value,
        dirVariable,
      });
    }
  }, ast);

  if (resourceFiles.length === 0) return [];

  const abusoluteFileResources = resourceFiles.map((f) => {
    const absolutePath =
      f.dirVariable === 'vendorDir'
        ? path.join(rootDir, 'vendor', f.value.replace(/^\//, ''))
        : path.join(rootDir, f.value.replace(/^\//, ''));

    return {
      name: f.key,
      path: absolutePath,
    };
  });

  return abusoluteFileResources;
}
