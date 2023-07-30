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
