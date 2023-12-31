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
  Call,
  Name,
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

  // Exclude Lifecycle Hooks methods
  const DENY_METHOD_NAMES = ['boot', 'booted', 'mount', 'render'];
  // e.g. hydrateFoo, dehydrateFoo, updatingFoo,  updatedFoo
  const DENY_METHOD_PREFIX_NAMES = ['hydrate', 'dehydrate', 'updating', 'updated'];

  function isDenyPrefixMethod(name: string, denies: string[]) {
    const flags: boolean[] = [];

    for (const d of denies) {
      if (name.startsWith(d)) {
        flags.push(true);
      }
    }

    if (flags.includes(true)) return true;
    return false;
  }

  phpParser.walk((node) => {
    if (node.kind !== 'method') return;
    const methodNode = node as Method;

    if (methodNode.visibility !== 'public') return;
    if (typeof methodNode.name !== 'object') return;
    const identifierNode = methodNode.name as Identifier;

    if (DENY_METHOD_NAMES.includes(identifierNode.name)) return;
    if (isDenyPrefixMethod(identifierNode.name, DENY_METHOD_PREFIX_NAMES)) return;

    const livewireComponentMethod: LivewireComponentMethodType = { name: identifierNode.name };
    const argumentsParameters = phpParser.getArgumentParametersFromMethodParametersNode(methodNode.arguments);

    livewireComponentMethod.arguments = argumentsParameters;
    livewireComponentMethods.push(livewireComponentMethod);
  }, classNode);

  return livewireComponentMethods;
}

export function getRenderMethodNodeFromClassNode(classNode: ClassNode) {
  const renderMethodNodes: Method[] = [];

  phpParser.walk((node) => {
    if (node.kind !== 'method') return;
    const methodNode = node as Method;

    if (methodNode.visibility !== 'public') return;
    if (typeof methodNode.name !== 'object') return;
    const identifierNode = methodNode.name as Identifier;

    if (identifierNode.name !== 'render') return;

    renderMethodNodes.push(methodNode);
  }, classNode);

  return renderMethodNodes[0];
}

export function getTemplateKeyOfCallViewFuncArgumentsFromMethodNode(methodNode: Method) {
  const values: string[] = [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  phpParser.walk((node, _parent) => {
    if (node.kind !== 'call') return;
    const callNode = node as Call;
    if (callNode.what.kind !== 'name') return;
    const nameNode = callNode.what as Name;
    if (nameNode.name !== 'view') return;

    if (callNode.arguments.length > 0) {
      if (callNode.arguments[0].loc) {
        if (callNode.arguments[0].kind !== 'string') return;
        const stringNode = callNode.arguments[0] as StringNode;
        values.push(stringNode.value);
      }
    }
  }, methodNode);

  return values[0];
}
