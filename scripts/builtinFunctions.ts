import fs from 'fs';
import path from 'path';

import { Array as ArrayNode, Constant as ConstantNode, Entry, Identifier, String as StringNode } from 'php-parser';

import * as phpParser from '../src/parsers/php/parser';
import * as phpFunctionProjectService from '../src/projects/services/phpFunction';
import { PHPFunctionType } from '../src/projects/types';

const STUBS_PATH = path.resolve(path.join(__dirname, '../stubs'));
const BUILTIN_FUNCTION_JSON_PATH = path.resolve(path.join(__dirname, '../resources/jsonData/builtinFunctions.json'));

function isAllowStubFile(file: string) {
  const allowStubs = ['Core', 'date', 'standard'];

  for (const stub of allowStubs) {
    if (file.startsWith(path.join(STUBS_PATH, stub))) {
      return true;
    }
  }

  return false;
}

function getStubMapFunctionFilesFromCode(code: string) {
  const files: string[] = [];

  const ast = phpParser.getAst(code);
  phpParser.walk((node) => {
    if (node.kind !== 'constant') return;
    const constantNode = node as ConstantNode;
    if (typeof constantNode.name !== 'object') return;
    const identifierNode = constantNode.name as Identifier;
    if (identifierNode.name !== 'FUNCTIONS') return;
    if (!constantNode.value) return;
    if (typeof constantNode.value !== 'object') return;
    if (constantNode.value.kind !== 'array') return;
    const arrayNode = constantNode.value as ArrayNode;
    if (arrayNode.items.length === 0) return;

    for (const item of arrayNode.items) {
      if (item.kind !== 'entry') continue;
      const entryNode = item as Entry;
      if (entryNode.value.kind !== 'string') continue;
      const stringNode = entryNode.value as StringNode;
      files.push(stringNode.value);
    }
  }, ast);

  if (files.length === 0) return [];

  const convSetTypeFiles = new Set(files);
  const uniqFiles = [...convSetTypeFiles];
  return uniqFiles;
}

//
// Entry point
//

// (async () => {
//   const phpFunctions: PHPFunctionType[] = [];

//   const stubsMapPHPCode = await fs.promises.readFile(path.join(STUBS_PATH, 'PhpStormStubsMap.php'), {
//     encoding: 'utf8',
//   });
//   const relativeFiles = getStubMapFunctionFilesFromCode(stubsMapPHPCode);
//   const abusoluteFiles = relativeFiles.map((f) => path.join(STUBS_PATH, f));

//   for (const file of abusoluteFiles) {
//     if (!isAllowStubFile(file)) continue;

//     const phpCode = await fs.promises.readFile(file, { encoding: 'utf8' });
//     const functions = phpFunctionProjectService.getPHPFunctions(phpCode, file);

//     const convedPathFunctions = functions.map((f) => {
//       f.path = f.path.replace(STUBS_PATH, '').replace(/\//, '');
//       return f;
//     });

//     phpFunctions.push(...convedPathFunctions);
//   }

//   fs.promises.writeFile(BUILTIN_FUNCTION_JSON_PATH, JSON.stringify(phpFunctions, null, 2));
// })();

(async () => {
  const phpFunctions: PHPFunctionType[] = [];

  const stubsMapPHPCode = await fs.promises.readFile(path.join(STUBS_PATH, 'PhpStormStubsMap.php'), {
    encoding: 'utf8',
  });
  const relativeFiles = getStubMapFunctionFilesFromCode(stubsMapPHPCode);
  const abusoluteFiles = relativeFiles.map((f) => path.join(STUBS_PATH, f));

  for (const file of abusoluteFiles) {
    if (!isAllowStubFile(file)) continue;

    const phpCode = await fs.promises.readFile(file, { encoding: 'utf8' });
    const functions = phpFunctionProjectService.getPHPFunctions(phpCode, file);

    const convedPathFunctions = functions.map((f) => {
      f.path = f.path.replace(STUBS_PATH, '').replace(/\//, '');
      return f;
    });

    phpFunctions.push(...convedPathFunctions);
  }

  fs.promises.writeFile(BUILTIN_FUNCTION_JSON_PATH, JSON.stringify(phpFunctions, null, 2));
  //fs.promises.writeFile(BUILTIN_FUNCTION_JSON_PATH, phpFunctions.toString());
})();
