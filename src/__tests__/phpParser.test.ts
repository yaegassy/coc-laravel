import { expect, test } from 'vitest';

import { Array as ArrayNode, Entry, Identifier, Method, Return, String as StringNode } from 'php-parser';

import * as validationService from '../completions/services/validationService';
import * as phpParser from '../parsers/php/parser';
import { type CallKindNameWithChainType } from '../parsers/php/parser';
import * as testUtils from './testUtils';

test('Determine if the FormRequest class is an inherited class', () => {
  const code = testUtils.stripInitialNewline(`
<?php

declare(strict_types=1);

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }
}
`);

  const ast = validationService.getAst(code);
  if (!ast) return;

  const exists = validationService.existsExtendsFormRequest(ast);
  expect(exists).toBe(true);
});

test('Retrieve an array in a PHP file', () => {
  const code = testUtils.stripInitialNewline(`
<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Validation Language Lines
    |--------------------------------------------------------------------------
    |
    | The following language lines contain the default error messages used by
    | the validator class. Some of these rules have multiple versions such
    | as the size rules. Feel free to tweak each of these messages here.
    |
    */

    'accepted' => 'The :attribute field must be accepted.',
    'accepted_if' => 'The :attribute field must be accepted when :other is :value.',
    'active_url' => 'The :attribute field must be a valid URL.',
    'after' => 'The :attribute field must be a date after :date.',
    'after_or_equal' => 'The :attribute field must be a date after or equal to :date.',
    'alpha' => 'The :attribute field must only contain letters.',
    'alpha_dash' => 'The :attribute field must only contain letters, numbers, dashes, and underscores.',
    'alpha_num' => 'The :attribute field must only contain letters and numbers.',
    'array' => 'The :attribute field must be an array.',
    'ascii' => 'The :attribute field must only contain single-byte alphanumeric characters and symbols.',
    'before' => 'The :attribute field must be a date before :date.',
    'before_or_equal' => 'The :attribute field must be a date before or equal to :date.',
    'between' => [
        'array' => 'The :attribute field must have between :min and :max items.',
        'file' => 'The :attribute field must be between :min and :max kilobytes.',
        'numeric' => 'The :attribute field must be between :min and :max.',
        'string' => 'The :attribute field must be between :min and :max characters.',
    ],
    'boolean' => 'The :attribute field must be true or false.',
    'can' => 'The :attribute field contains an unauthorized value.',
    'confirmed' => 'The :attribute field confirmation does not match.',
    'current_password' => 'The password is incorrect.',
    'date' => 'The :attribute field must be a valid date.',
    'date_equals' => 'The :attribute field must be a date equal to :date.',
    'date_format' => 'The :attribute field must match the format :format.',
    'decimal' => 'The :attribute field must have :decimal decimal places.',
    'declined' => 'The :attribute field must be declined.',
    'declined_if' => 'The :attribute field must be declined when :other is :value.',
    'different' => 'The :attribute field and :other must be different.',
    'digits' => 'The :attribute field must be :digits digits.',
    'digits_between' => 'The :attribute field must be between :min and :max digits.',
    'dimensions' => 'The :attribute field has invalid image dimensions.',
    'distinct' => 'The :attribute field has a duplicate value.',
    'doesnt_end_with' => 'The :attribute field must not end with one of the following: :values.',
    'doesnt_start_with' => 'The :attribute field must not start with one of the following: :values.',
    'email' => 'The :attribute field must be a valid email address.',
    'ends_with' => 'The :attribute field must end with one of the following: :values.',
    'enum' => 'The selected :attribute is invalid.',
    'exists' => 'The selected :attribute is invalid.',
    'file' => 'The :attribute field must be a file.',
    'filled' => 'The :attribute field must have a value.',
    'gt' => [
        'array' => 'The :attribute field must have more than :value items.',
        'file' => 'The :attribute field must be greater than :value kilobytes.',
        'numeric' => 'The :attribute field must be greater than :value.',
        'string' => 'The :attribute field must be greater than :value characters.',
    ],
    'gte' => [
        'array' => 'The :attribute field must have :value items or more.',
        'file' => 'The :attribute field must be greater than or equal to :value kilobytes.',
        'numeric' => 'The :attribute field must be greater than or equal to :value.',
        'string' => 'The :attribute field must be greater than or equal to :value characters.',
    ],
    'image' => 'The :attribute field must be an image.',
    'in' => 'The selected :attribute is invalid.',
    'in_array' => 'The :attribute field must exist in :other.',
    'integer' => 'The :attribute field must be an integer.',
    'ip' => 'The :attribute field must be a valid IP address.',
    'ipv4' => 'The :attribute field must be a valid IPv4 address.',
    'ipv6' => 'The :attribute field must be a valid IPv6 address.',
    'json' => 'The :attribute field must be a valid JSON string.',
    'lowercase' => 'The :attribute field must be lowercase.',
    'lt' => [
        'array' => 'The :attribute field must have less than :value items.',
        'file' => 'The :attribute field must be less than :value kilobytes.',
        'numeric' => 'The :attribute field must be less than :value.',
        'string' => 'The :attribute field must be less than :value characters.',
    ],
    'lte' => [
        'array' => 'The :attribute field must not have more than :value items.',
        'file' => 'The :attribute field must be less than or equal to :value kilobytes.',
        'numeric' => 'The :attribute field must be less than or equal to :value.',
        'string' => 'The :attribute field must be less than or equal to :value characters.',
    ],
    'mac_address' => 'The :attribute field must be a valid MAC address.',
    'max' => [
        'array' => 'The :attribute field must not have more than :max items.',
        'file' => 'The :attribute field must not be greater than :max kilobytes.',
        'numeric' => 'The :attribute field must not be greater than :max.',
        'string' => 'The :attribute field must not be greater than :max characters.',
    ],
    'max_digits' => 'The :attribute field must not have more than :max digits.',
    'mimes' => 'The :attribute field must be a file of type: :values.',
    'mimetypes' => 'The :attribute field must be a file of type: :values.',
    'min' => [
        'array' => 'The :attribute field must have at least :min items.',
        'file' => 'The :attribute field must be at least :min kilobytes.',
        'numeric' => 'The :attribute field must be at least :min.',
        'string' => 'The :attribute field must be at least :min characters.',
    ],
    'min_digits' => 'The :attribute field must have at least :min digits.',
    'missing' => 'The :attribute field must be missing.',
    'missing_if' => 'The :attribute field must be missing when :other is :value.',
    'missing_unless' => 'The :attribute field must be missing unless :other is :value.',
    'missing_with' => 'The :attribute field must be missing when :values is present.',
    'missing_with_all' => 'The :attribute field must be missing when :values are present.',
    'multiple_of' => 'The :attribute field must be a multiple of :value.',
    'not_in' => 'The selected :attribute is invalid.',
    'not_regex' => 'The :attribute field format is invalid.',
    'numeric' => 'The :attribute field must be a number.',
    'password' => [
        'letters' => 'The :attribute field must contain at least one letter.',
        'mixed' => 'The :attribute field must contain at least one uppercase and one lowercase letter.',
        'numbers' => 'The :attribute field must contain at least one number.',
        'symbols' => 'The :attribute field must contain at least one symbol.',
        'uncompromised' => 'The given :attribute has appeared in a data leak. Please choose a different :attribute.',
    ],
    'present' => 'The :attribute field must be present.',
    'prohibited' => 'The :attribute field is prohibited.',
    'prohibited_if' => 'The :attribute field is prohibited when :other is :value.',
    'prohibited_unless' => 'The :attribute field is prohibited unless :other is in :values.',
    'prohibits' => 'The :attribute field prohibits :other from being present.',
    'regex' => 'The :attribute field format is invalid.',
    'required' => 'The :attribute field is required.',
    'required_array_keys' => 'The :attribute field must contain entries for: :values.',
    'required_if' => 'The :attribute field is required when :other is :value.',
    'required_if_accepted' => 'The :attribute field is required when :other is accepted.',
    'required_unless' => 'The :attribute field is required unless :other is in :values.',
    'required_with' => 'The :attribute field is required when :values is present.',
    'required_with_all' => 'The :attribute field is required when :values are present.',
    'required_without' => 'The :attribute field is required when :values is not present.',
    'required_without_all' => 'The :attribute field is required when none of :values are present.',
    'same' => 'The :attribute field must match :other.',
    'size' => [
        'array' => 'The :attribute field must contain :size items.',
        'file' => 'The :attribute field must be :size kilobytes.',
        'numeric' => 'The :attribute field must be :size.',
        'string' => 'The :attribute field must be :size characters.',
    ],
    'starts_with' => 'The :attribute field must start with one of the following: :values.',
    'string' => 'The :attribute field must be a string.',
    'timezone' => 'The :attribute field must be a valid timezone.',
    'unique' => 'The :attribute has already been taken.',
    'uploaded' => 'The :attribute failed to upload.',
    'uppercase' => 'The :attribute field must be uppercase.',
    'url' => 'The :attribute field must be a valid URL.',
    'ulid' => 'The :attribute field must be a valid ULID.',
    'uuid' => 'The :attribute field must be a valid UUID.',

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Language Lines
    |--------------------------------------------------------------------------
    |
    | Here you may specify custom validation messages for attributes using the
    | convention "attribute.rule" to name the lines. This makes it quick to
    | specify a specific custom language line for a given attribute rule.
    |
    */

    'custom' => [
        'attribute-name' => [
            'rule-name' => 'custom-message',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Attributes
    |--------------------------------------------------------------------------
    |
    | The following language lines are used to swap our attribute placeholder
    | with something more reader friendly such as "E-Mail Address" instead
    | of "email". This simply helps us make our message more expressive.
    |
    */

    'attributes' => [],

];
`);

  const ast = phpParser.getAst(code);
  if (!ast) return;

  const fileName = 'validation';
  const mapStore: Map<string, string> = new Map();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  phpParser.walk((node, _parent) => {
    let targetKeyName: string | undefined = undefined;
    let targetKeyValue: string | undefined = undefined;

    if (node.kind === 'return') {
      const returnNode = node as Return;
      if (!returnNode.expr) return;
      if (returnNode.expr.kind !== 'array') return;

      const arrayNode = returnNode.expr as ArrayNode;

      for (const item of arrayNode.items) {
        if (item.kind !== 'entry') continue;
        const entryNode = item as Entry;

        if (!entryNode.key) continue;
        if (entryNode.key.kind !== 'string') continue;
        const keyNameNode = entryNode.key as StringNode;
        targetKeyName = keyNameNode.value;

        // MEMO: Does an array need to be addressed?
        if (entryNode.value.kind !== 'string') continue;
        const keyValueNode = entryNode.value as StringNode;
        targetKeyValue = keyValueNode.value;

        if (targetKeyName && targetKeyValue) {
          mapStore.set(fileName + '.' + targetKeyName, targetKeyValue);
        }
      }
    }
  }, ast);

  const mapStoreEntiesArray = Array.from(mapStore.entries());
  expect(mapStoreEntiesArray.length).toBe(83);
  expect(mapStoreEntiesArray[0]).toEqual(['validation.accepted', 'The :attribute field must be accepted.']);
  expect(mapStoreEntiesArray[82]).toEqual(['validation.uuid', 'The :attribute field must be a valid UUID.']);
});

test('Determine if the name class is an inherited class', () => {
  const code = testUtils.stripInitialNewline(`
<?php

namespace App\View\Components;

use Closure;
use Illuminate\Contracts\View\View;
use Illuminate\View\Component;

class Sample extends Component
{
    /**
     * Create a new component instance.
     */
    public function __construct(
        public string $type,
        public string $message = 'dummy',
    ) {
    }

    /**
     * Get the view / contents that represent the component.
     */
    public function render(): View|Closure|string
    {
        return view('components.sample');
    }
}
`);

  const ast = phpParser.getAst(code);
  if (!ast) return;
  const exists = phpParser.existsExtendsClassFor(ast, 'Component');

  expect(true).toBe(exists);
});

test('Get public properties of constructor', () => {
  const code = testUtils.stripInitialNewline(`
<?php

namespace App\View\Components;

use Closure;
use Illuminate\Contracts\View\View;
use Illuminate\View\Component;

class Sample extends Component
{
    /**
     * Create a new component instance.
     */
    public function __construct(
        public string $type,
        public string $message = 'dummy',
    ) {
    }

    /**
     * Get the view / contents that represent the component.
     */
    public function render(): View|Closure|string
    {
        return view('components.sample');
    }
}
`);

  const ast = phpParser.getAst(code);
  if (!ast) return;

  type ParameterType = {
    name: string;
    value?: string;
  };

  const parameters: ParameterType[] = [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  phpParser.walk((node, _parent) => {
    if (node.kind === 'method') {
      const methodNode = node as Method;
      let existsConstruct = false;
      if (typeof methodNode.name === 'object') {
        const identifierNode = methodNode.name as Identifier;
        if (identifierNode.name === '__construct') {
          existsConstruct = true;
        }
      }

      if (!existsConstruct) return;
      if (methodNode.arguments.length === 0) return;

      for (const parameter of methodNode.arguments) {
        // flags:
        //   - type MODIFIER_PUBLIC = 1;
        //   - type MODIFIER_PROTECTED = 2;
        //   - type MODIFIER_PRIVATE = 4;
        if (parameter.flags !== 1) return;

        let parameterValue: string | undefined = undefined;
        if (parameter.value) {
          if (parameter.value.kind === 'string') {
            const stringNode = parameter.value as StringNode;
            parameterValue = stringNode.value;
          }
        }

        let parameterName: string | undefined = undefined;
        if (typeof parameter.name === 'object') {
          const identifierNode = parameter.name as Identifier;
          parameterName = identifierNode.name;
        }

        if (parameterName) {
          const parameter: ParameterType = {
            name: parameterName,
            value: parameterValue,
          };

          parameters.push(parameter);
        }
      }
    }
  }, ast);

  expect(parameters[0]).toEqual({ name: 'type' });
  expect(parameters[1]).toEqual({ name: 'message', value: 'dummy' });
});

test('Test of callVariableWithChainMethodsFromExprStmtNode', () => {
  const code = testUtils.stripInitialNewline(`
$myObject->one("one_param1")->two('two_param1', 'two_param2')->three('three_param1');
$myObject2->foo("foo_param1")->bar('bar_param1', 'bar_param2')->baz('baz_param1');
  `);

  const ast = phpParser.getAst(code);
  if (!ast) return;

  const exprStmtNodes = phpParser.getExpressionStatementNodes(ast);
  if (exprStmtNodes.length === 0) return;

  const callVariableWithChainMethods: CallKindNameWithChainType[] = [];
  for (const esNode of exprStmtNodes) {
    const res = phpParser.getCallVariableNameWithChainFrom(esNode);
    if (res) callVariableWithChainMethods.push(res);
  }

  // The result of the parser will be a string omitting the $ sign
  expect(callVariableWithChainMethods[0].name).toEqual('myObject');
  expect(callVariableWithChainMethods[0].startOffset).toEqual(0);
  expect(callVariableWithChainMethods[0].endOffset).toEqual(9);
  expect(callVariableWithChainMethods[0].methods[0].name).toEqual('one');
  expect(callVariableWithChainMethods[0].methods[0].startOffset).toEqual(11);
  expect(callVariableWithChainMethods[0].methods[0].endOffset).toEqual(14);
  expect(callVariableWithChainMethods[0].methods[0].arguments![0].value).toEqual('one_param1');
  expect(callVariableWithChainMethods[0].methods[0].arguments![0].startOffset).toEqual(15);
  expect(callVariableWithChainMethods[0].methods[0].arguments![0].endOffset).toEqual(27);

  // The result of the parser will be a string omitting the $ sign
  expect(callVariableWithChainMethods[1].name).toEqual('myObject2');
  expect(callVariableWithChainMethods[1].startOffset).toEqual(86);
  expect(callVariableWithChainMethods[1].endOffset).toEqual(96);
  expect(callVariableWithChainMethods[1].methods[2].name).toEqual('baz');
  expect(callVariableWithChainMethods[1].methods[2].startOffset).toEqual(150);
  expect(callVariableWithChainMethods[1].methods[2].endOffset).toEqual(153);
  expect(callVariableWithChainMethods[1].methods[2].arguments![0].value).toEqual('baz_param1');
  expect(callVariableWithChainMethods[1].methods[2].arguments![0].startOffset).toEqual(154);
  expect(callVariableWithChainMethods[1].methods[2].arguments![0].endOffset).toEqual(166);
});

test('Test of callStaticLookupNameWithChainMethodsFromExprStmtNode', () => {
  const code = testUtils.stripInitialNewline(`
MyStatic1::one("one_param1")->two('two_param1', 'two_param2')->three('three_param1');
MyStatic2::foo("foo_param1")->bar('bar_param1', 'bar_param2')->baz('baz_param1');
  `);

  const ast = phpParser.getAst(code);
  if (!ast) return;

  const exprStmtNodes = phpParser.getExpressionStatementNodes(ast);
  if (exprStmtNodes.length === 0) return;

  const callStaticLookupWithChainMethods: CallKindNameWithChainType[] = [];
  for (const e of exprStmtNodes) {
    const res = phpParser.getCallStaticLookupNameWithChainFrom(e);
    if (res) callStaticLookupWithChainMethods.push(res);
  }

  expect(callStaticLookupWithChainMethods[0].name).toEqual('MyStatic1');
  expect(callStaticLookupWithChainMethods[0].startOffset).toEqual(0);
  expect(callStaticLookupWithChainMethods[0].endOffset).toEqual(14);
  expect(callStaticLookupWithChainMethods[0].methods[0].name).toEqual('one');
  expect(callStaticLookupWithChainMethods[0].methods[0].startOffset).toEqual(11);
  expect(callStaticLookupWithChainMethods[0].methods[0].endOffset).toEqual(14);
  expect(callStaticLookupWithChainMethods[0].methods[0].arguments![0].value).toEqual('one_param1');
  expect(callStaticLookupWithChainMethods[0].methods[0].arguments![0].startOffset).toEqual(15);
  expect(callStaticLookupWithChainMethods[0].methods[0].arguments![0].endOffset).toEqual(27);

  expect(callStaticLookupWithChainMethods[1].name).toEqual('MyStatic2');
  expect(callStaticLookupWithChainMethods[1].startOffset).toEqual(86);
  expect(callStaticLookupWithChainMethods[1].endOffset).toEqual(100);
  expect(callStaticLookupWithChainMethods[1].methods[2].name).toEqual('baz');
  expect(callStaticLookupWithChainMethods[1].methods[2].startOffset).toEqual(149);
  expect(callStaticLookupWithChainMethods[1].methods[2].endOffset).toEqual(152);
  expect(callStaticLookupWithChainMethods[1].methods[2].arguments![0].value).toEqual('baz_param1');
  expect(callStaticLookupWithChainMethods[1].methods[2].arguments![0].startOffset).toEqual(153);
  expect(callStaticLookupWithChainMethods[1].methods[2].arguments![0].endOffset).toEqual(165);
});

test('Test of callNameNameWithChainMethodsFromExprStmtNode', () => {
  const code = testUtils.stripInitialNewline(`
one("one_param1")->two('two_param1', 'two_param2')->three('three_param1');
foo("foo_param1")->bar('bar_param1', 'bar_param2')->baz('baz_param1');
  `);

  const ast = phpParser.getAst(code);
  if (!ast) return;

  const exprStmtNodes = phpParser.getExpressionStatementNodes(ast);
  if (exprStmtNodes.length === 0) return;

  const callNameWithChainMethods: CallKindNameWithChainType[] = [];
  for (const e of exprStmtNodes) {
    const res = phpParser.getCallNameNameWithChainFrom(e);
    if (res) callNameWithChainMethods.push(res);
  }

  expect(callNameWithChainMethods[0].name).toEqual('one');
  expect(callNameWithChainMethods[0].startOffset).toEqual(0);
  expect(callNameWithChainMethods[0].endOffset).toEqual(3);

  expect(callNameWithChainMethods[0].functionArguments![0].value).toEqual('one_param1');
  expect(callNameWithChainMethods[0].functionArguments![0].startOffset).toEqual(4);
  expect(callNameWithChainMethods[0].functionArguments![0].endOffset).toEqual(16);

  expect(callNameWithChainMethods[1].methods[0].name).toEqual('bar');
  expect(callNameWithChainMethods[1].methods[0].startOffset).toEqual(94);
  expect(callNameWithChainMethods[1].methods[0].endOffset).toEqual(97);
  expect(callNameWithChainMethods[1].methods[0].arguments![0].value).toEqual('bar_param1');
  expect(callNameWithChainMethods[1].methods[0].arguments![0].startOffset).toEqual(98);
  expect(callNameWithChainMethods[1].methods[0].arguments![0].endOffset).toEqual(110);
  expect(callNameWithChainMethods[1].methods[0].arguments![1].value).toEqual('bar_param2');
  expect(callNameWithChainMethods[1].methods[0].arguments![1].startOffset).toEqual(112);
  expect(callNameWithChainMethods[1].methods[0].arguments![1].endOffset).toEqual(124);
});

test('Testing get use items', async () => {
  const code = testUtils.stripInitialNewline(`
<?php
use My\\Full\\ClassName;
use My\\Full\\ClassName as Cls;
use My\\Full\\{ClassName1};
use My\\Full\\{ClassName2, ClassName3};
use My\\Full\\{ClassName4 as Cls4, ClassName5 as Cls5};
use function My\\Full\\functionName;
use function My\\Full\\functionName as func;
use function My\\Full\\{functionName1};
use function My\\Full\\{functionName2, functionName3};
use function My\\Full\\{functionName4 as func4, functionName5 as func5};
use const My\\Full\\CONSTANT;
use const My\\Full\\CONSTANT as CONS;
use const My\\Full\\{CONSTANT1};
use const My\\Full\\{CONSTANT2, CONSTANT3};
use const My\\Full\\{CONSTANT4 as CONS4, CONSTANT5 as CONS5};
use ArrayObject;
`);

  const expected = [
    {
      name: 'My\\Full\\ClassName',
      startOffset: 10,
      endOffset: 27,
      groupStartOffset: 6,
      groupEndOffset: 27,
    },
    {
      name: 'My\\Full\\ClassName',
      startOffset: 33,
      endOffset: 57,
      aliasName: 'Cls',
      aliasStartOffset: 54,
      aliasEndOffset: 57,
      groupStartOffset: 29,
      groupEndOffset: 57,
    },
    {
      name: 'ClassName1',
      startOffset: 72,
      endOffset: 82,
      groupName: 'My\\Full',
      groupStartOffset: 59,
      groupEndOffset: 83,
    },
    {
      name: 'ClassName2',
      startOffset: 98,
      endOffset: 108,
      groupName: 'My\\Full',
      groupStartOffset: 85,
      groupEndOffset: 121,
    },
    {
      name: 'ClassName3',
      startOffset: 110,
      endOffset: 120,
      groupName: 'My\\Full',
      groupStartOffset: 85,
      groupEndOffset: 121,
    },
    {
      name: 'ClassName4',
      startOffset: 136,
      endOffset: 154,
      aliasName: 'Cls4',
      aliasStartOffset: 150,
      aliasEndOffset: 154,
      groupName: 'My\\Full',
      groupStartOffset: 123,
      groupEndOffset: 175,
    },
    {
      name: 'ClassName5',
      startOffset: 156,
      endOffset: 174,
      aliasName: 'Cls5',
      aliasStartOffset: 170,
      aliasEndOffset: 174,
      groupName: 'My\\Full',
      groupStartOffset: 123,
      groupEndOffset: 175,
    },
    {
      name: 'My\\Full\\functionName',
      startOffset: 190,
      endOffset: 210,
      groupType: 'function',
      groupStartOffset: 177,
      groupEndOffset: 210,
    },
    {
      name: 'My\\Full\\functionName',
      startOffset: 225,
      endOffset: 253,
      aliasName: 'func',
      aliasStartOffset: 249,
      aliasEndOffset: 253,
      groupType: 'function',
      groupStartOffset: 212,
      groupEndOffset: 253,
    },
    {
      name: 'functionName1',
      startOffset: 277,
      endOffset: 290,
      groupName: 'My\\Full',
      groupType: 'function',
      groupStartOffset: 255,
      groupEndOffset: 291,
    },
    {
      name: 'functionName2',
      startOffset: 315,
      endOffset: 328,
      groupName: 'My\\Full',
      groupType: 'function',
      groupStartOffset: 293,
      groupEndOffset: 344,
    },
    {
      name: 'functionName3',
      startOffset: 330,
      endOffset: 343,
      groupName: 'My\\Full',
      groupType: 'function',
      groupStartOffset: 293,
      groupEndOffset: 344,
    },
    {
      name: 'functionName4',
      startOffset: 368,
      endOffset: 390,
      aliasName: 'func4',
      aliasStartOffset: 385,
      aliasEndOffset: 390,
      groupName: 'My\\Full',
      groupType: 'function',
      groupStartOffset: 346,
      groupEndOffset: 415,
    },
    {
      name: 'functionName5',
      startOffset: 392,
      endOffset: 414,
      aliasName: 'func5',
      aliasStartOffset: 409,
      aliasEndOffset: 414,
      groupName: 'My\\Full',
      groupType: 'function',
      groupStartOffset: 346,
      groupEndOffset: 415,
    },
    {
      name: 'My\\Full\\CONSTANT',
      startOffset: 427,
      endOffset: 443,
      groupType: 'const',
      groupStartOffset: 417,
      groupEndOffset: 443,
    },
    {
      name: 'My\\Full\\CONSTANT',
      startOffset: 455,
      endOffset: 479,
      aliasName: 'CONS',
      aliasStartOffset: 475,
      aliasEndOffset: 479,
      groupType: 'const',
      groupStartOffset: 445,
      groupEndOffset: 479,
    },
    {
      name: 'CONSTANT1',
      startOffset: 500,
      endOffset: 509,
      groupName: 'My\\Full',
      groupType: 'const',
      groupStartOffset: 481,
      groupEndOffset: 510,
    },
    {
      name: 'CONSTANT2',
      startOffset: 531,
      endOffset: 540,
      groupName: 'My\\Full',
      groupType: 'const',
      groupStartOffset: 512,
      groupEndOffset: 552,
    },
    {
      name: 'CONSTANT3',
      startOffset: 542,
      endOffset: 551,
      groupName: 'My\\Full',
      groupType: 'const',
      groupStartOffset: 512,
      groupEndOffset: 552,
    },
    {
      name: 'CONSTANT4',
      startOffset: 573,
      endOffset: 591,
      aliasName: 'CONS4',
      aliasStartOffset: 586,
      aliasEndOffset: 591,
      groupName: 'My\\Full',
      groupType: 'const',
      groupStartOffset: 554,
      groupEndOffset: 612,
    },
    {
      name: 'CONSTANT5',
      startOffset: 593,
      endOffset: 611,
      aliasName: 'CONS5',
      aliasStartOffset: 606,
      aliasEndOffset: 611,
      groupName: 'My\\Full',
      groupType: 'const',
      groupStartOffset: 554,
      groupEndOffset: 612,
    },
    {
      name: 'ArrayObject',
      startOffset: 618,
      endOffset: 629,
      groupStartOffset: 614,
      groupEndOffset: 629,
    },
  ];

  const actual = phpParser.getUseItems(code);
  expect(actual).toMatchObject(expected);
});
