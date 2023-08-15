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

export type PhpNamespaceType = { [key: string]: string };

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

export type BladeWithPhpStaticClassItemsType = {
  start: number;
  end: number;
  staticClassItems: StaticClassItemType[];
};

export type PhpObjectItemType = {
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

export type BladeWithPhpObjectItemsType = {
  start: number;
  end: number;
  objectItems: PhpObjectItemType[];
};

export type PhpRelatedBladeNodeType = 'inlinePhp' | 'phpDirective';

export type PhpVariableItemType = {
  name: string;
  type: string;
  start: number;
  end: number;
  bladeNodeStart?: number;
  bladeNodeEnd?: number;
  bladeNodeType?: PhpRelatedBladeNodeType;
};
