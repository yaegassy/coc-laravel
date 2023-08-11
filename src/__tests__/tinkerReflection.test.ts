import { describe, expect, test } from 'vitest';

import * as testUtils from './testUtils';

type ReflectorParameterType = {
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
    // $ -> \\$
    const code = testUtils.stripInitialNewline(`
\\$reflector = new ReflectionFunction('abort_if');
echo json_encode(\\$reflector->getParameters(), JSON_PRETTY_PRINT);
`);

    const rootDir = testUtils.TEST_LV_PROJECT_PATH;
    const artisanPath = testUtils.getArtisanPath(rootDir)!;

    const resJsonStr = await testUtils.runTinkerReflection(code, artisanPath);
    if (!resJsonStr) return;
    const reflectorFunctionParameters = JSON.parse(resJsonStr) as ReflectorParameterType[];

    const expected = [{ name: 'boolean' }, { name: 'code' }, { name: 'message' }, { name: 'headers' }];

    expect(reflectorFunctionParameters).toMatchObject(expected);
  });

  test('Functions | Detail', async () => {
    // $ -> \\$
    const code = testUtils.stripInitialNewline(`
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

    const rootDir = testUtils.TEST_LV_PROJECT_PATH;
    const artisanPath = testUtils.getArtisanPath(rootDir)!;

    const resJsonStr = await testUtils.runTinkerReflection(code, artisanPath);
    if (!resJsonStr) return;
    const reflectorFunctionParameters = JSON.parse(resJsonStr) as ReflectorParameterType[];

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
    // $ -> \\$
    const code = testUtils.stripInitialNewline(`
\\$reflector = new ReflectionClass('DateTime'); 
echo json_encode(\\$reflector->getMethods(), JSON_PRETTY_PRINT);
  `);

    const rootDir = testUtils.TEST_LV_PROJECT_PATH;
    const artisanPath = testUtils.getArtisanPath(rootDir)!;

    const resJsonStr = await testUtils.runTinkerReflection(code, artisanPath);
    if (!resJsonStr) return;
    const reflectorMethods = JSON.parse(resJsonStr) as ReflectorMethodsType[];

    const expected = {
      name: '__construct',
      class: 'DateTime',
    };

    expect(reflectorMethods[0]).toMatchObject(expected);
  });

  test('Methods | Detail', async () => {
    // $ -> \\$
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

    const resJsonStr = await testUtils.runTinkerReflection(code, artisanPath);
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

describe('Test example of getting a class using the REFRELCTION API with artisan tinker', () => {
  test('Class | Simple', async () => {
    // $ -> \\$
    const code = testUtils.stripInitialNewline(`
\\$reflector = new ReflectionClass('DateTime'); 
echo json_encode(\\$reflector->getMethods(), JSON_PRETTY_PRINT);
  `);

    const rootDir = testUtils.TEST_LV_PROJECT_PATH;
    const artisanPath = testUtils.getArtisanPath(rootDir)!;

    const resJsonStr = await testUtils.runTinkerReflection(code, artisanPath);
    if (!resJsonStr) return;
    const reflectorMethods = JSON.parse(resJsonStr) as ReflectorMethodsType[];

    const expected = {
      name: '__construct',
      class: 'DateTime',
    };

    expect(reflectorMethods[0]).toMatchObject(expected);
  });
});

describe('Scope resolution', () => {
  test('Scope resolution | 1', async () => {
    // $ -> \\$
    const code = testUtils.stripInitialNewline(`
\\$reflector = new ReflectionClass('DateTime');
\\$classConstants = array_keys(\\$reflector->getConstants());
\\$staticMethods = array_values(
    array_filter(
        array_map(fn(ReflectionMethod \\$m) => \\$m->isStatic() ? \\$m->getName() : null, \\$reflector->getMethods()),
        fn(\\$v) => !is_null(\\$v)
    )
);
echo json_encode(['classConstants' => \\$classConstants, 'staticMethods' => \\$staticMethods], JSON_PRETTY_PRINT);
  `);

    const rootDir = testUtils.TEST_LV_PROJECT_PATH;
    const artisanPath = testUtils.getArtisanPath(rootDir)!;

    const resJsonStr = await testUtils.runTinkerReflection(code, artisanPath)!;
    if (!resJsonStr) return;

    const memberItems = JSON.parse(resJsonStr);

    const expected = {
      classConstants: [
        'ATOM',
        'COOKIE',
        'ISO8601',
        'ISO8601_EXPANDED',
        'RFC822',
        'RFC850',
        'RFC1036',
        'RFC1123',
        'RFC7231',
        'RFC2822',
        'RFC3339',
        'RFC3339_EXTENDED',
        'RSS',
        'W3C',
      ],
      staticMethods: ['__set_state', 'createFromImmutable', 'createFromInterface', 'createFromFormat', 'getLastErrors'],
    };

    expect(memberItems).toMatchObject(expected);
  });

  test('Scope resolution | 2', async () => {
    let code = '';

    const rootDir = testUtils.TEST_LV_PROJECT_PATH;
    const artisanPath = testUtils.getArtisanPath(rootDir)!;

    // $ -> \\$
    code = testUtils.stripInitialNewline(`
\\$reflector = new ReflectionClass('DateTime');
echo json_encode(\\$reflector->getConstant('ATOM'));
  `);

    const resJsonStr1 = await testUtils.runTinkerReflection(code, artisanPath)!;
    if (!resJsonStr1) return;
    const classConstantValue1 = JSON.parse(resJsonStr1) as string | false;
    if (!classConstantValue1) return;
    const expected1 = 'Y-m-d\\TH:i:sP';

    // $ -> \\$
    code = testUtils.stripInitialNewline(`
\\$reflector = new ReflectionClass('DateTime');
echo json_encode(\\$reflector->getConstant('DUMMY'));
  `);

    const resJsonStr2 = await testUtils.runTinkerReflection(code, artisanPath)!;
    if (!resJsonStr2) return;
    const classConstantValue2 = JSON.parse(resJsonStr2) as string | false;
    const expected2 = false;

    expect(classConstantValue1).toBe(expected1);
    expect(classConstantValue2).toBe(expected2);
  });

  test('Scope resolution | 3', async () => {
    let code = '';

    const rootDir = testUtils.TEST_LV_PROJECT_PATH;
    const artisanPath = testUtils.getArtisanPath(rootDir)!;

    //
    // Testing of standard case
    //

    // $ -> \\$
    code = testUtils.stripInitialNewline(`
\\$reflector = new ReflectionClass('DateTime');
\\$staticMethod = \\$reflector->getMethod('createFromImmutable');
echo json_encode(\\$staticMethod->__toString());
  `);

    const resJsonStr1 = await testUtils.runTinkerReflection(code, artisanPath)!;
    if (!resJsonStr1) return;
    const staticMethodData1 = JSON.parse(resJsonStr1) as string;
    if (!staticMethodData1) return;
    const expected1 = `Method [ <internal:date> static public method createFromImmutable ] {

  - Parameters [1] {
    Parameter #0 [ <required> DateTimeImmutable $object ]
  }
  - Tentative return [ static ]
}
`;

    //
    // Testing for non-existent methods
    //

    // $ -> \\$
    code = testUtils.stripInitialNewline(`
\\$reflector = new ReflectionClass('DateTime');
\\$staticMethod = \\$reflector->getMethod('dummy'); # Non-existent method name
echo json_encode(\\$staticMethod->__toString());
  `);

    // If the method does not exist, a ReflectionException is raised; in the
    // runtinker, the ReflectionException string is detected and set to
    // undefined
    const resJsonStr2 = await testUtils.runTinkerReflection(code, artisanPath)!;
    const staticMethodData2 = resJsonStr2; // dummy, undefined;
    const expected2 = undefined;

    expect(staticMethodData1).toBe(expected1);
    expect(staticMethodData2).toBe(expected2);
  });
});
