import { BladeProjectsManager } from './managers/blade';
import { TranslationProjectManager } from './managers/translation';
import { PHPFunctionProjectManager } from './managers/phpFunction';

export type BladeProjectsManagerType = BladeProjectsManager;
export type TranslationProjectManagerType = TranslationProjectManager;
export type PHPFunctionProjectManagerType = PHPFunctionProjectManager;

export type ProjectManagerType = {
  bladeProjectManager: BladeProjectsManagerType;
  translationProjectManager: TranslationProjectManagerType;
  phpFunctionProjectManager: PHPFunctionProjectManagerType;
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
