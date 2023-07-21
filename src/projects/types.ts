import { BladeProjectsManager } from './managers/blade';
import { PHPFunctionProjectManager } from './managers/phpFunction';
import { TranslationProjectManager } from './managers/translation';
import { ViewReferenceProjectManager } from './managers/viewReference';

export type BladeProjectsManagerType = BladeProjectsManager;
export type TranslationProjectManagerType = TranslationProjectManager;
export type PHPFunctionProjectManagerType = PHPFunctionProjectManager;
export type ViewReferenceProjectManagerType = ViewReferenceProjectManager;

export type ProjectManagerType = {
  bladeProjectManager: BladeProjectsManagerType;
  translationProjectManager: TranslationProjectManagerType;
  phpFunctionProjectManager: PHPFunctionProjectManagerType;
  viewReferenceProjectManager: ViewReferenceProjectManagerType;
};

export type PropsType = {
  propsKey: string;
  propsValue: string;
};

export type ComponentMapValueType = {
  path: string;
  props: PropsType[];
};

export type ArgumentParameterType = {
  name: string;
  value?: string | number | boolean | any[] | null;
  byref: boolean;
  nullable: boolean;
  variadic: boolean;
  typehint?: string;
};

export type PHPFunctionType = {
  name: string;
  path: string;
  arguments?: ArgumentParameterType[];
};

export type CallViewFunctionType = {
  value: string;
  range: {
    start: {
      line: number;
      character: number;
    };
    end: {
      line: number;
      character: number;
    };
  };
};

export type ViewReferenceMapValueType = {
  path: string;
  callViewFunctions: CallViewFunctionType[];
};
