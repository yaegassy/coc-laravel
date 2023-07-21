import {
  CompletionItem,
  CompletionItemKind,
  InsertTextFormat,
  LinesTextDocument,
  Position,
  Uri,
  workspace,
} from 'coc.nvim';

import * as validationService from '../services/validationService';

const rules: { [key: string]: string } = {
  accepted: 'accepted',
  active_url: 'active_url',
  after: 'after:date',
  after_or_equal: 'after_or_equal:${0:date}',
  alpha: 'alpha',
  alpha_dash: 'alpha_dash',
  alpha_num: 'alpha_num',
  array: 'array',
  bail: 'bail',
  before: 'before:${1:date}',
  before_or_equal: 'before_or_equal:${1:date}',
  between: 'between:${1:min},${2:max}',
  boolean: 'boolean',
  confirmed: 'confirmed',
  date: 'date',
  date_equals: 'date_equals:${1:date}',
  date_format: 'date_format:${1:format}',
  different: 'different:${1:field}',
  digits: 'digits:${1:value}',
  digits_between: 'digits_between:${1:min},${2:max}',
  dimensions: 'dimensions',
  distinct: 'distinct',
  email: 'email',
  ends_with: 'ends_with:${1}',
  exists: 'exists:${2:table},${3:column}',
  file: 'file',
  filled: 'filled',
  gt: 'gt:${1:field}',
  gte: 'gte:${1:field}',
  image: 'image',
  in: 'in:${1:something},${2:something else}',
  in_array: 'in_array:${1:anotherfield.*}',
  integer: 'integer',
  ip: 'ip',
  ipv4: 'ipv4',
  ipv6: 'ipv6',
  json: 'json',
  lt: 'lt:${1:field}',
  lte: 'lte:${1:field}',
  max: 'max:${1:value}',
  mimetypes: 'mimetypes:${1:text/plain}',
  mimes: 'mimes:${1:png,jpg}',
  min: 'min:${1:value}',
  not_in: 'not_in:${1:something},${2:something else}',
  not_regex: 'not_regex:${1:pattern}',
  nullable: 'nullable',
  numeric: 'numeric',
  present: 'present',
  regex: 'regex:${1:pattern}',
  required: 'required',
  required_if: 'required_if:${1:anotherfield},${2:value}',
  required_unless: 'required_unless:${1:anotherfield},${2:value}',
  required_with: 'required_with:${1:anotherfield}',
  required_with_all: 'required_with_all:${1:anotherfield},${2:anotherfield}',
  required_without: 'required_without:${1:anotherfield}',
  required_without_all: 'required_without_all:${1:anotherfield},${2:anotherfield}',
  same: 'same:${1:field}',
  size: 'size:${1:value}',
  sometimes: 'sometimes',
  starts_with: 'starts_with:${1:foo},${2:bar}',
  string: 'string',
  timezone: 'timezone',
  unique: 'unique:${1:table},${2:column},${3:except},${4:id}',
  url: 'url',
  uuid: 'uuid',
};

export async function doCompletion(document: LinesTextDocument, position: Position) {
  const items: CompletionItem[] = [];

  const filePath = Uri.parse(document.uri).fsPath;
  if (!filePath.endsWith('Request.php')) return items;

  const code = document.getText();
  const stripedPHPTagCode = validationService.stripPHPTag(code);
  const diffOffset = code.length - stripedPHPTagCode.length;

  try {
    const ast = validationService.getAst(code);
    if (!ast) return [];
    if (!validationService.existsExtendsFormRequest(ast)) return items;

    const serviceLocations = validationService.getServiceLocations(ast);
    if (!serviceLocations) return [];

    // Because the code is parsed with the php tags removed, you will need to
    // adjust the offset in the actual code when using it for comparisons,
    // etc.
    const offset = document.offsetAt(position) - diffOffset;

    const canCompletion = validationService.canCompletion(offset, serviceLocations);
    if (!canCompletion) return [];

    const doc = workspace.getDocument(document.uri);
    if (!doc) return [];

    const wordRange = doc.getWordRangeAtPosition(Position.create(position.line, position.character - 1), '"\'|');
    if (!wordRange) return [];

    const text = document.getText(wordRange) || '';
    if (!text) return [];
    if (!text.match(/["'|]/)) return [];

    Object.keys(rules).map((key) => {
      items.push({
        label: key,
        kind: CompletionItemKind.Snippet,
        insertText: rules[key],
        insertTextFormat: InsertTextFormat.Snippet,
      });
    });
  } catch {
    return items;
  }

  return items;
}
