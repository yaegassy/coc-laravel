export type DiagnosticDataType = {
  bladeComponentName?: string;
};

export type ComposerJsonContentType = {
  autoload: {
    ['psr-4']: {
      [key: string]: string;
    };
  };
  'autoload-dev': {
    ['psr-4']: {
      [key: string]: string;
    };
  };
};

export type LivewireComponentMapType = {
  key: string;
  value: string;
};

export type LivewireComponentPropertyType = {
  name: string;
  value?: any;
};

export type LivewireComponentMethodType = {
  name: string;
  arguments?: ArgumentParameterType[];
};

export type ArgumentParameterType = {
  name: string;
  value?: string | number | boolean | any[] | null;
  byref: boolean;
  nullable: boolean;
  variadic: boolean;
  typehint?: string;
};

export type StaticClassItemType = {
  class: {
    name: string;
    startOffset: number;
    endOffset: number;
  };
  member: {
    name: string;
    startOffset: number;
    endOffset: number;
  };
};

export type StaticClassMemberDataType = {
  classConstants: string[];
  staticMethods: string[];
};

export type BladeWithPHPStaticClassItemsType = {
  start: number;
  end: number;
  staticClassItems: StaticClassItemType[];
};

export type PHPNamespaceType = { [key: string]: string };

export type PHPObjectItemType = {
  object: {
    name: string;
    startOffset: number;
    endOffset: number;
  };
  member: {
    name: string;
    startOffset: number;
    endOffset: number;
  };
};

export type BladeWithPHPObjectItemsType = {
  start: number;
  end: number;
  objectItems: PHPObjectItemType[];
};

export type PHPRelatedBladeNodeType = 'inlinePhp' | 'phpDirective';

export type PHPVariableItemType = {
  name: string;
  type: string;
  start: number;
  end: number;
  bladeNodeStart?: number;
  bladeNodeEnd?: number;
  bladeNodeType?: PHPRelatedBladeNodeType;
};

export type PHPUseItemType = {
  name: string;
  startOffset: number;
  endOffset: number;
  aliasName?: string;
  aliasStartOffset?: number;
  aliasEndOffset?: number;
  groupName?: string;
  groupType?: string; // For class, groupType is undefined
  groupStartOffset?: number;
  groupEndOffset?: number;
};

export type PHPSymbolNameDataType = {
  qualifiedName: string;
  fullQualifiedName: string;
  aliasName?: string;
  namespace?: string;
};
