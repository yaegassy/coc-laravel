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

export type ScopeResolutionItemType = {
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

export type ScopeResolutionMemberDataType = {
  classConstants: string[];
  staticMethods: string[];
};

export type BladeWithPhpScopeResolutionItemsType = {
  start: number;
  end: number;
  scopeResolutionItems: ScopeResolutionItemType[];
};
