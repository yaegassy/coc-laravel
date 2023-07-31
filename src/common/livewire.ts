import {
  Array as ArrayNode,
  Class as ClassNode,
  Entry,
  Identifier,
  Method,
  Node,
  Property,
  PropertyStatement,
  Return,
  String as StringNode,
} from 'php-parser';

import * as phpParser from '../parsers/php/parser';
import {
  type LivewireComponentMapType,
  type LivewireComponentMethodType,
  type LivewireComponentPropertyType,
} from './types';

export function getLivewireComponentMapsFromNode(node: Node) {
  const livewireComponentMaps: LivewireComponentMapType[] = [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  phpParser.walk((node, _parent) => {
    let targetKeyName: string | undefined = undefined;
    let targetKeyValue: string | undefined = undefined;

    if (node.kind === 'return') {
      const returnNode = node as Return;
      if (!returnNode.expr) return;
      if (returnNode.expr.kind !== 'array') return;

      const arrayNode = returnNode.expr as ArrayNode;

      for (const item of arrayNode.items) {
        if (item.kind !== 'entry') continue;
        const entryNode = item as Entry;

        if (!entryNode.key) continue;
        if (entryNode.key.kind !== 'string') continue;
        const keyNameNode = entryNode.key as StringNode;
        targetKeyName = keyNameNode.value;

        if (entryNode.value.kind !== 'string') continue;
        const keyValueNode = entryNode.value as StringNode;
        targetKeyValue = keyValueNode.value;

        if (targetKeyName && targetKeyValue) {
          livewireComponentMaps.push({
            key: targetKeyName,
            value: targetKeyValue,
          });
        }
      }
    }
  }, node);

  return livewireComponentMaps;
}

export function getLivewireComponentClassNode(ast: Node) {
  const existsUseItemLivewireComponent = phpParser.existsUseItemFor(ast, 'Livewire\\Component');
  if (!existsUseItemLivewireComponent) return undefined;

  const livewireComponentClassNode = phpParser.getClassNodeExtendsFor(ast, 'Component');
  if (!livewireComponentClassNode) return undefined;

  return livewireComponentClassNode;
}

export function getLivewireComponentPropertiesFromClassNode(classNode: ClassNode) {
  const livewireComponentProperties: LivewireComponentPropertyType[] = [];

  phpParser.walk((node, parent) => {
    if (node.kind !== 'property') return;
    const propertyNode = node as Property;

    if (parent?.kind !== 'propertystatement') return;
    const parentPropertyStatement = parent as PropertyStatement;
    if (parentPropertyStatement.visibility !== 'public') return;
    if (parentPropertyStatement.isStatic) return;

    if (typeof propertyNode.name !== 'object') return;
    const identifierNode = propertyNode.name as Identifier;

    const livewireComponentProperty: LivewireComponentPropertyType = { name: identifierNode.name };

    const livewireComponentPropertyValue = phpParser.getPropertyValueFromPropertyNode(propertyNode);
    if (livewireComponentPropertyValue) {
      livewireComponentProperty.value = livewireComponentPropertyValue;
    }

    livewireComponentProperties.push(livewireComponentProperty);
  }, classNode);

  return livewireComponentProperties;
}

export function getLivewireComponentMethodsFromClassNode(classNode: ClassNode) {
  const livewireComponentMethods: LivewireComponentMethodType[] = [];

  // Exclude render and mount methods as they are special methods in the context of livewire
  const DENY_METHOD_NAMES = ['render', 'mount'];

  phpParser.walk((node) => {
    if (node.kind !== 'method') return;
    const methodNode = node as Method;

    if (methodNode.visibility !== 'public') return;
    if (typeof methodNode.name !== 'object') return;
    const identifierNode = methodNode.name as Identifier;

    if (DENY_METHOD_NAMES.includes(identifierNode.name)) return;

    const livewireComponentMethod: LivewireComponentMethodType = { name: identifierNode.name };
    const argumentsParameters = phpParser.getArgumentParametersFromMethodParametersNode(methodNode.arguments);

    livewireComponentMethod.arguments = argumentsParameters;
    livewireComponentMethods.push(livewireComponentMethod);
  }, classNode);

  return livewireComponentMethods;
}
