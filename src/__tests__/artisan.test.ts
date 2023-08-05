import { expect, test, describe } from 'vitest';

import * as testUtils from './testUtils';

type ReflectorFuncitonsParameterType = {
  name: string;
  default: string | null;
  type: string | null;
  isOptional: boolean;
};

type ReflectorMethodsType = {
  name: string;
  class: string;
};

describe('Test example of getting a function using the REFRELCTION API with artisan tinker', () => {
  test('Functions | Simple', async () => {
    let code = '';

    const rootDir = testUtils.TEST_LV_PROJECT_PATH;
    const artisanPath = testUtils.getArtisanPath(rootDir)!;

    code = testUtils.stripInitialNewline(`
\\$reflector = new ReflectionFunction('abort_if');
echo json_encode(\\$reflector->getParameters(), JSON_PRETTY_PRINT);
`);

    const resJsonStr = await testUtils.runTinker(code, artisanPath);
    if (!resJsonStr) return;
    const reflectorFunctionParameters = JSON.parse(resJsonStr) as ReflectorFuncitonsParameterType[];

    const expected = [{ name: 'boolean' }, { name: 'code' }, { name: 'message' }, { name: 'headers' }];

    expect(reflectorFunctionParameters).toMatchObject(expected);
  });

  test('Functions | Detail', async () => {
    let code = '';

    const rootDir = testUtils.TEST_LV_PROJECT_PATH;
    const artisanPath = testUtils.getArtisanPath(rootDir)!;

    code = testUtils.stripInitialNewline(`
\\$reflector = new ReflectionFunction('abort_if');
echo json_encode(
    array_map(function (ReflectionParameter \\$param) {
        return [
            'name' => \\$param->getName(),
            'default' => \\$param->isDefaultValueAvailable() ? \\$param->getDefaultValue() : null,
            'isOptional' => \\$param->isOptional(),
            'type' => \\$param->hasType() ? (string) \\$param->getType() : null,
        ];
    }, \\$reflector->getParameters())
);
`);

    const resJsonStr = await testUtils.runTinker(code, artisanPath);
    if (!resJsonStr) return;
    const reflectorFunctionParameters = JSON.parse(resJsonStr) as ReflectorFuncitonsParameterType[];

    const expected = [
      {
        name: 'boolean',
        default: null,
        isOptional: false,
        type: null,
      },
      {
        name: 'code',
        default: null,
        isOptional: false,
        type: null,
      },
      {
        name: 'message',
        default: '',
        isOptional: true,
        type: null,
      },
      {
        name: 'headers',
        default: [],
        isOptional: true,
        type: 'array',
      },
    ];

    expect(reflectorFunctionParameters).toMatchObject(expected);
  });
});

describe('Test example of getting a methods using the REFRELCTION API with artisan tinker', () => {
  test('Methods | Simple', async () => {
    // \\$ -> $
    const code = testUtils.stripInitialNewline(`
\\$reflector = new ReflectionClass('DateTime'); 
echo json_encode(\\$reflector->getMethods(), JSON_PRETTY_PRINT);
  `);

    const rootDir = testUtils.TEST_LV_PROJECT_PATH;
    const artisanPath = testUtils.getArtisanPath(rootDir)!;

    const resJsonStr = await testUtils.runTinker(code, artisanPath);
    if (!resJsonStr) return;
    const reflectorMethods = JSON.parse(resJsonStr) as ReflectorMethodsType[];

    const expected = {
      name: '__construct',
      class: 'DateTime',
    };

    expect(reflectorMethods[0]).toMatchObject(expected);
  });

  test('Methods | Detail', async () => {
    // \\$ -> $
    const code = testUtils.stripInitialNewline(`
\\$reflector = new ReflectionClass('DateTime'); 
echo json_encode(
    array_map(function (ReflectionMethod \\$method) {
        return [
            'name' => \\$method->getName(),
            'modifierNames' => [
                Reflection::getModifierNames(\\$method->getModifiers()),
            ],
            'returnType' => \\$method->getReturnType() ? \\$method->getReturnType()->getName() : null,
            'isVariadic' => \\$method->isVariadic(),
            'params' => array_map(function (ReflectionParameter \\$param) {
                return [
                    'name' => \\$param->getName(),
                    'default' => \\$param->isDefaultValueAvailable() ? \\$param->getDefaultValue() : null,
                    'isOptional' => \\$param->isOptional(),
                    'type' => \\$param->hasType() ? (string) \\$param->getType() : null,
                ];
            }, \\$method->getParameters()),

        ];
    }, \\$reflector->getMethods())
);
  `);

    const rootDir = testUtils.TEST_LV_PROJECT_PATH;
    const artisanPath = testUtils.getArtisanPath(rootDir)!;

    const resJsonStr = await testUtils.runTinker(code, artisanPath);
    if (!resJsonStr) return;
    const reflectorMethods = JSON.parse(resJsonStr) as ReflectorMethodsType[];

    const expected0 = {
      name: '__construct',
      modifierNames: [['public']],
      returnType: null,
      isVariadic: false,
      params: [
        {
          name: 'datetime',
          default: 'now',
          isOptional: true,
          type: 'string',
        },
        {
          name: 'timezone',
          default: null,
          isOptional: true,
          type: '?DateTimeZone',
        },
      ],
    };

    const expected21 = {
      name: 'diff',
      modifierNames: [['public']],
      returnType: null,
      isVariadic: false,
      params: [
        {
          name: 'targetObject',
          default: null,
          isOptional: false,
          type: 'DateTimeInterface',
        },
        {
          name: 'absolute',
          default: false,
          isOptional: true,
          type: 'bool',
        },
      ],
    };

    expect(reflectorMethods[0]).toMatchObject(expected0);
    expect(reflectorMethods[21]).toMatchObject(expected21);
  });
});
