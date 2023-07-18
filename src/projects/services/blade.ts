import { BladeDocument } from 'stillat-blade-parser/out/document/bladeDocument';
import { DirectiveNode } from 'stillat-blade-parser/out/nodes/nodes';

import * as bladeParser from '../../parsers/blade/parser';
import * as phpParser from '../../parsers/php/parser';
import { PropsType } from '../types';

export const getBladeDocument = bladeParser.getBladeDocument;

export function getPHPCodeInProps(bladeDocument: BladeDocument) {
  const phpCodes: string[] = [];

  bladeDocument.getAllNodes().forEach((node) => {
    if (node instanceof DirectiveNode) {
      if (node.directiveName === 'props') {
        const params = node.directiveParameters;
        phpCodes.push(params);
      }
    }
  });

  return phpCodes[0];
}

export function getPropsFromClassBasedComponent(code: string) {
  const props: PropsType[] = [];

  const ast = phpParser.getAst(code);

  const existsExtendsComponent = phpParser.existsExtendsClassFor(ast, 'Component');
  if (!existsExtendsComponent) return [];

  const publicParmeters = phpParser.getPublicParametersOfConstructor(ast);
  if (!publicParmeters) return [];

  const convertedProps = convertPublicParametersToProps(publicParmeters);
  if (convertedProps) {
    props.push(...convertedProps);
  }

  return props;
}

function convertPublicParametersToProps(parameters: phpParser.ParameterType[]) {
  const props: PropsType[] = [];

  let paramCnt = 0;
  for (const parameter of parameters) {
    if (parameter.value) {
      props.push({
        propsKey: parameter.name,
        propsValue: parameter.value,
      });
    } else {
      props.push({
        propsKey: paramCnt.toString(),
        propsValue: parameter.name,
      });
      paramCnt++;
    }
  }

  return props;
}
