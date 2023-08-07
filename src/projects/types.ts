import { BladeProjectsManager } from './managers/blade';
import { LivewireProjectManager } from './managers/livewire';
import { PHPConstantProjectManager } from './managers/phpConstant';
import { PHPFunctionProjectManager } from './managers/phpFunction';
import { TranslationProjectManager } from './managers/translation';
import { ViewReferenceProjectManager } from './managers/viewReference';

import { LivewireComponentMethodType, LivewireComponentPropertyType } from '../common/types';

export type BladeProjectsManagerType = BladeProjectsManager;
export type TranslationProjectManagerType = TranslationProjectManager;
export type PHPFunctionProjectManagerType = PHPFunctionProjectManager;
export type PHPConstantProjectManagerType = PHPConstantProjectManager;
export type ViewReferenceProjectManagerType = ViewReferenceProjectManager;
export type LivewireProjectManagerType = LivewireProjectManager;

export type ProjectManagerType = {
  bladeProjectManager: BladeProjectsManagerType;
  translationProjectManager: TranslationProjectManagerType;
  phpFunctionProjectManager: PHPFunctionProjectManagerType;
  phpConstantProjectManager: PHPConstantProjectManagerType;
  viewReferenceProjectManager: ViewReferenceProjectManagerType;
  livewireProjectManager: LivewireProjectManagerType;
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

export type PHPConstantType = {
  name: string;
  path: string;
  isStubs: boolean;
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

export type LivewireMapValueType = {
  keyName: string;
  namespacePathName: string;
  filePath: string;
  properties: LivewireComponentPropertyType[];
  methods: LivewireComponentMethodType[];
  templateKey?: string;
};
