import {
  Class as ClassNode,
  CommentBlock,
  Identifier,
  Namespace as NamespaceNode,
  Property as PropertyNode,
  String as StringNode,
} from 'php-parser';

import * as infrection from 'inflection';

import { EloquentModelType, EloquentModelPropertyType, IdeHelperModelType } from '../common/types';
import * as phpParser from '../parsers/php/parser';
import * as phpDocParser from '../parsers/phpDoc/parser';

export function getIdeHelperModelsFromCode(code: string) {
  const items: IdeHelperModelType[] = [];

  const ast = phpParser.getAstByParseCode(code);
  if (!ast) return [];

  phpParser.walk((node, parent) => {
    if (!parent) return;
    if (parent.kind !== 'namespace') return;
    const namespaceNode = parent as NamespaceNode;

    if (node.kind !== 'class') return;
    const classNode = node as ClassNode;

    let className: string | undefined = undefined;
    let helperClassName: string | undefined = undefined;
    if (typeof classNode.name === 'object') {
      const identiferNode = classNode.name as Identifier;
      className = identiferNode.name.replace(/^IdeHelper/, '');
      helperClassName = identiferNode.name;
    }
    if (!helperClassName) return;
    if (!className) return;

    if (!classNode.leadingComments) return;
    if (classNode.leadingComments.length === 0) return;

    let commentblockValue: string | undefined = undefined;
    for (const c of classNode.leadingComments) {
      if (c.kind !== 'commentblock') continue;
      const commentblockNode = c as CommentBlock;
      commentblockValue = commentblockNode.value;
    }
    if (!commentblockValue) return;

    items.push({
      name: className,
      helperClassName,
      namespace: namespaceNode.name,
      commentblockValue,
    });
  }, ast);

  return items;
}

export function getEloquentModels(ideHelperModels: IdeHelperModelType[], code: string) {
  const items: EloquentModelType[] = [];

  for (const m of ideHelperModels) {
    const parsedDoc = phpDocParser.parse(m.commentblockValue);
    if (!parsedDoc) continue;
    if (parsedDoc.tags.length === 0) continue;

    const eloquentModelProperties: EloquentModelPropertyType[] = [];
    for (const t of parsedDoc.tags) {
      if (t.tagName !== '@property') continue;
      eloquentModelProperties.push({
        name: t.name,
        typeString: t.typeString,
      });
    }

    const tableName = getTableName(code, m.name);

    items.push({
      name: m.name,
      fullQualifiedName: m.namespace + '\\' + m.name,
      helperClassName: m.helperClassName,
      namespace: m.namespace,
      tableName: tableName,
      properties: eloquentModelProperties,
    });
  }

  return items;
}

export function getTableName(code: string, qualifiedClassName: string) {
  let tableName: string | undefined = undefined;

  tableName = getTableNameFromCode(code);
  if (!tableName) {
    tableName = getTableNameFromPluralizeAndSnakeCase(qualifiedClassName);
  }

  return tableName;
}

function getTableNameFromCode(code: string) {
  let tableName: string | undefined = undefined;

  const ast = phpParser.getAstByParseCode(code);
  if (!ast) return;

  phpParser.walk((node) => {
    if (node.kind !== 'property') return;
    const propertyNode = node as PropertyNode;
    let propertyName: string | undefined = undefined;
    if (typeof propertyNode.name !== 'object') return;
    const identiferNode = propertyNode.name as Identifier;
    propertyName = identiferNode.name;
    if (!propertyName) return;
    if (!propertyNode.value) return;
    const stringNode = propertyNode.value as StringNode;

    tableName = stringNode.value;
  }, ast);

  if (!tableName) return;
  return tableName;
}

function getTableNameFromPluralizeAndSnakeCase(qualifiedClassName: string) {
  let tableName = qualifiedClassName;
  tableName = infrection.pluralize(tableName);
  tableName = infrection.underscore(tableName);
  return tableName;
}
