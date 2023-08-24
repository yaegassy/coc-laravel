import { Class as ClassNode, CommentBlock, Identifier, Namespace as NamespaceNode } from 'php-parser';

import * as phpParser from '../parsers/php/parser';
import * as phpDocParser from '../parsers/phpDoc/parser';

type IdeHelperModel = {
  name: string; // qualifiedName
  namespace: string;
  commentblockValue: string;
};

type EloquentModelProperty = {
  name: string;
  typeString: string;
};

type EloquentModel = {
  name: string; // qualifiedName
  fullQualifiedName: string;
  namespace: string;
  properties: EloquentModelProperty[];
};

export function getIdeHelperModelsFromCode(code: string) {
  const items: IdeHelperModel[] = [];

  const ast = phpParser.getAstByParseCode(code);
  if (!ast) return [];

  phpParser.walk((node, parent) => {
    if (!parent) return;
    if (parent.kind !== 'namespace') return;
    const namespaceNode = parent as NamespaceNode;

    if (node.kind !== 'class') return;
    const classNode = node as ClassNode;
    if (!classNode.extends) return;
    const extendsName = classNode.extends.name;
    if (extendsName !== '\\Eloquent') return;

    let className: string | undefined = undefined;
    if (typeof classNode.name === 'object') {
      const identiferNode = classNode.name as Identifier;
      className = identiferNode.name;
    }
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
      namespace: namespaceNode.name,
      commentblockValue,
    });
  }, ast);

  return items;
}

export function getEloquentModels(ideHelperModels: IdeHelperModel[]) {
  const items: EloquentModel[] = [];

  for (const m of ideHelperModels) {
    const parsedDoc = phpDocParser.parse(m.commentblockValue);
    if (!parsedDoc) continue;
    if (parsedDoc.tags.length === 0) continue;

    const eloquentModelProperties: EloquentModelProperty[] = [];
    for (const t of parsedDoc.tags) {
      if (t.tagName !== '@property') continue;
      eloquentModelProperties.push({
        name: t.name,
        typeString: t.typeString,
      });
    }

    items.push({
      name: m.name,
      fullQualifiedName: m.namespace + '\\' + m.name,
      namespace: m.namespace,
      properties: eloquentModelProperties,
    });
  }

  return items;
}
