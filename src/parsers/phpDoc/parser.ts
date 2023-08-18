const STRIP_PATTERN: RegExp = /^\/\*\*[ \t]*|\s*\*\/$|^[ \t]*\*[ \t]*/gm;
const TAG_BOUNDARY_PATTERN: RegExp = /(?:\r\n|\r|\n)(?=@)/;
const WHITESPACE_PATTERN: RegExp = /\s+/;
const PARAM_OR_PROPERTY_PATTERN = /^(@param|@property|@property-read|@property-write)\s+(\S+)\s+(\$\S+)\s*([^]*)$/;
const VAR_STANDARD_PATTERN = /^(@var)\s+(\S+)(?:\s+(\$\S+))?\s*([^]*)$/;
const VAR_GENERICS_LIKE_PATTERN = /^(@var)\s+([\w|<,\-\s]+[>]+)(?:\s+(\$\S+))?\s*([^]*)$/;
const RETURN_PATTERN = /^(@return)\s+(\S+)\s*([^]*)$/;
const METHOD_PATTERN = /^(@method)\s+(?:(static)\s+)?(?:(\S+)\s+)?(\S+)\(\s*([^)]*)\s*\)\s*([^]*)$/;

type MethodTagParam = {
  typeString: string;
  name: string;
};

type TagType = {
  tagName: string;
  name: string;
  description: string;
  typeString: string;
  parameters?: MethodTagParam[];
  isStatic?: boolean;
};

export type PHPDocResultType = {
  summary?: string;
  description?: string;
  tags: TagType[];
};

export function parse(input: string) {
  if (!input) return undefined;

  const stripped = input.replace(STRIP_PATTERN, '');
  const split = stripped.split(TAG_BOUNDARY_PATTERN);

  let text: string | undefined = undefined;
  if (split.length && split[0].indexOf('@') !== 0) {
    const shiftSplitText = split.shift();
    if (shiftSplitText) {
      text = shiftSplitText.trim();
    }
  }

  const tags: TagType[] = [];
  for (const s of split) {
    const tag = parseTag(s);
    if (tag) {
      tags.push(tag);
    }
  }

  if (!text && !tags.length) return undefined;

  let summary: string | undefined = undefined;
  let description: string | undefined = undefined;
  if (text) {
    summary = text.split('\n\n').slice(0, 1).join('');
    description = text.split('\n\n').slice(1).join('\n\n');
  }

  const r: PHPDocResultType = {
    summary,
    description,
    tags,
  };

  return r;
}

function parseTag(text: string) {
  const substring = text.slice(0, 4);
  let match: RegExpMatchArray | null = null;

  switch (substring) {
    case '@par':
    case '@pro':
      match = text.match(PARAM_OR_PROPERTY_PATTERN);
      if (match) {
        return typeTag(match[1], match[2], match[3], match[4]);
      }
      return null;
    case '@var':
      //match = text.match(VAR_PATTERN);
      match = text.match(VAR_GENERICS_LIKE_PATTERN);
      if (!match) match = text.match(VAR_STANDARD_PATTERN);
      if (match) {
        return typeTag(match[1], match[2], match[3], match[4].trimEnd());
      }
      return null;
    case '@ret':
      match = text.match(RETURN_PATTERN);
      if (match) {
        return typeTag(match[1], match[2], '', match[3]);
      }
      return null;
    case '@met':
      match = text.match(METHOD_PATTERN);
      if (match) {
        return methodTag(match[1], match[2], match[3], match[4], methodParameters(match[5]), match[6]);
      }
      return null;
    default:
      return null;
  }
}

function typeTag(tagName: string, typeString: string, name: string, description: string) {
  return {
    tagName: tagName,
    typeString: typeString,
    name: name ? name : '',
    description: description ? description : '',
  };
}

function methodTag(
  tagName: string,
  visibility: string,
  returnTypeString: string,
  name: string,
  parameters: MethodTagParam[],
  description: string
) {
  return {
    tagName: tagName,
    isStatic: visibility === 'static',
    typeString: returnTypeString ? returnTypeString : 'void',
    name: name,
    parameters: parameters,
    description: description ? description : '',
  };
}

function methodParameters(input: string): MethodTagParam[] {
  if (!input) {
    return [];
  }

  const params: MethodTagParam[] = [];
  const paramSplit = input.split(',');
  let typeString: string = '';
  let name: string;
  let param: string[];

  while (paramSplit.length) {
    const popParam = paramSplit.pop();
    const trimPopParam = popParam ? popParam.trim() : undefined;
    param = trimPopParam ? trimPopParam.split(WHITESPACE_PATTERN) : [];
    if (param.length === 1) {
      typeString = 'mixed';
      name = param[0];
    } else if (param.length === 2) {
      typeString = param[0];
      name = param[1];
    } else {
      name = '';
    }

    if (name) {
      params.push({
        typeString: typeString,
        name: name,
      });
    }
  }

  return params.reverse();
}
