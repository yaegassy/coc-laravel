import { LivewireComponentMethodType, LivewireComponentPropertyType } from '../common/types';
import { BladeProjectsManager } from './managers/blade';
import { EloquentModelProjectManager } from './managers/eloquentModel';
import { LivewireProjectManager } from './managers/livewire';
import { PHPClassProjectManager } from './managers/phpClass';
import { PHPConstantProjectManager } from './managers/phpConstant';
import { PHPFunctionProjectManager } from './managers/phpFunction';
import { TranslationProjectManager } from './managers/translation';
import { ViewReferenceProjectManager } from './managers/viewReference';

export type BladeProjectsManagerType = BladeProjectsManager;
export type TranslationProjectManagerType = TranslationProjectManager;
export type PHPClassProjectManagerType = PHPClassProjectManager;
export type PHPFunctionProjectManagerType = PHPFunctionProjectManager;
export type PHPConstantProjectManagerType = PHPConstantProjectManager;
export type ViewReferenceProjectManagerType = ViewReferenceProjectManager;
export type LivewireProjectManagerType = LivewireProjectManager;
export type EloquentModelProjectManagerType = EloquentModelProjectManager;

export type ProjectManagerType = {
  bladeProjectManager: BladeProjectsManagerType;
  translationProjectManager: TranslationProjectManagerType;
  phpClassProjectManager: PHPClassProjectManagerType;
  phpFunctionProjectManager: PHPFunctionProjectManagerType;
  phpConstantProjectManager: PHPConstantProjectManagerType;
  viewReferenceProjectManager: ViewReferenceProjectManagerType;
  livewireProjectManager: LivewireProjectManagerType;
  eloquentModelProjectManager: EloquentModelProjectManagerType;
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
  isStubs: boolean;
};

export enum PHPClassItemKindEnum {
  Class = 1,
  Interface = 2,
  Trait = 3,
  Enum = 4,
}

export type PHPClassType = {
  name: string;
  path: string;
  kind: PHPClassItemKindEnum;
  isStubs: boolean;
};

export type LivewireMapValueType = {
  keyName: string;
  namespacePathName: string;
  filePath: string;
  properties: LivewireComponentPropertyType[];
  methods: LivewireComponentMethodType[];
  templateKey?: string;
};
