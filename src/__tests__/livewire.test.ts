import { expect, test } from 'vitest';

import path from 'path';

import {
  getComposerJsonContent,
  getProjectNamespacesFromComposerJson,
  getRelativeClassFilePathFromNamespaces,
} from '../common/composer';
import * as livewireCommon from '../common/livewire';
import * as phpParser from '../parsers/php/parser';
import * as testUtils from './testUtils';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

test('Retrieve component maps from livewire-components.php', () => {
  const code = testUtils.stripInitialNewline(`
<?php return array (
  'counter' => 'App\\Http\\Livewire\\Counter',
  'show-posts' => 'App\\Http\\Livewire\\ShowPosts',
);
`);

  const ast = phpParser.getAst(code);
  if (!ast) return;

  const assertionData = livewireCommon.getLivewireComponentMapsFromNode(ast);

  expect(assertionData[0]).toMatchObject({
    key: 'counter',
    value: 'App\\Http\\Livewire\\Counter',
  });
});

test('Determine if the class is a livewire component class', () => {
  // \\ -> \
  const code = testUtils.stripInitialNewline(`
<?php

namespace App\\Http\\Livewire;

use Livewire\\Component;

class Counter extends Component
{
}
`);

  const ast = phpParser.getAst(code);
  if (!ast) return;

  const livewireComponentClassNode = livewireCommon.getLivewireComponentClassNode(ast);

  expect(livewireComponentClassNode?.kind).toEqual('class');
});

test('Get properties of livewire component class', () => {
  // \\ -> \
  const code = testUtils.stripInitialNewline(`
<?php

namespace App\\Http\\Livewire;

use Livewire\\Component;

class Counter extends Component
{
    public $count = 0;

    public function increment()
    {
        $this->count++;
    }

    public function render()
    {
        return view('livewire.counter');
    }
}
`);

  const ast = phpParser.getAst(code);
  if (!ast) return;

  const livewireComponentClassNode = livewireCommon.getLivewireComponentClassNode(ast);
  if (!livewireComponentClassNode) return;

  const livewireComponentProperties =
    livewireCommon.getLivewireComponentPropertiesFromClassNode(livewireComponentClassNode);

  expect(livewireComponentProperties[0]).toEqual({ name: 'count', value: '0' });
});

test('Get methods of livewire component class', () => {
  // \\ -> \
  const code = testUtils.stripInitialNewline(`
<?php

namespace App\\Http\\Livewire;

use Livewire\\Component;

class Counter extends Component
{
    public $count = 0;

    public function increment()
    {
        $this->count++;
    }

    public function sample(int $dummy1, ?string $dummy2)
    {
        //
    }

    public function render()
    {
        return view('livewire.counter');
    }
}
`);

  const ast = phpParser.getAst(code);
  if (!ast) return;

  const livewireComponentClassNode = livewireCommon.getLivewireComponentClassNode(ast);
  if (!livewireComponentClassNode) return;

  const livewireComponentMethods = livewireCommon.getLivewireComponentMethodsFromClassNode(livewireComponentClassNode);

  expect(livewireComponentMethods[0]).toEqual({
    name: 'increment',
    arguments: [],
  });

  expect(livewireComponentMethods[1]).toEqual({
    name: 'sample',
    arguments: [
      {
        name: 'dummy1',
        byref: false,
        nullable: false,
        variadic: false,
        typehint: 'int',
      },
      {
        name: 'dummy2',
        byref: false,
        nullable: true,
        variadic: false,
        typehint: 'string',
      },
    ],
  });
});

test('Get value of call view func arguments of livewire component class', () => {
  // \\ -> \
  const code = testUtils.stripInitialNewline(`
<?php

namespace App\\Http\\Livewire;

use Livewire\\Component;

class Counter extends Component
{
    public $count = 0;

    public function increment()
    {
        $this->count++;
    }

    public function render()
    {
        return view('livewire.counter');
    }
}
`);

  const ast = phpParser.getAst(code);
  if (!ast) return;

  const livewireComponentClassNode = livewireCommon.getLivewireComponentClassNode(ast);
  if (!livewireComponentClassNode) return;

  const renderMethodNode = livewireCommon.getRenderMethodNodeFromClassNode(livewireComponentClassNode);

  const value = livewireCommon.getTemplateKeyOfCallViewFuncArgumentsFromMethodNode(renderMethodNode);

  expect(value).toBe('livewire.counter');
});

test('composer.json namaespace check', async () => {
  const composerJsonContent = await getComposerJsonContent(path.join(FIXTURES_DIR, 'json'));
  if (!composerJsonContent) return;

  const projectNamespaces = getProjectNamespacesFromComposerJson(composerJsonContent);

  const classFilePath1 = getRelativeClassFilePathFromNamespaces(projectNamespaces, 'App\\Http\\Livewire\\Counter');
  if (!classFilePath1) return;

  const classFilePath2 = getRelativeClassFilePathFromNamespaces(projectNamespaces, '\\App\\Http\\Livewire\\Counter');
  if (!classFilePath2) return;

  expect(classFilePath1).toBe('app/Http/Livewire/Counter.php');
  expect(classFilePath2).toBe('app/Http/Livewire/Counter.php');
});
