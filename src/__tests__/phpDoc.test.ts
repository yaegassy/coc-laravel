import { expect, test } from 'vitest';

import * as phpDocParser from '../parsers/phpDoc/parser';
import * as testUtils from './testUtils';

test('Testing in phpdoc for models in _ide_helper_models.php', () => {
  const code = testUtils.stripInitialNewline(`
/**
 * App\\Models\\User
 *
 * @property int $id
 * @property string $name
 * @property string $email
 * @property \\Illuminate\\Support\\Carbon|null $email_verified_at
 * @property mixed $password
 * @property string|null $remember_token
 * @property \\Illuminate\\Support\\Carbon|null $created_at
 * @property \\Illuminate\\Support\\Carbon|null $updated_at
 * @property-read \\Illuminate\\Notifications\\DatabaseNotificationCollection<int, \\Illuminate\\Notifications\\DatabaseNotification> $notifications
 * @property-read int|null $notifications_count
 * @property-read \\Illuminate\\Database\\Eloquent\\Collection<int, \\Laravel\\Sanctum\\PersonalAccessToken> $tokens
 * @property-read int|null $tokens_count
 * @method static \\Database\\Factories\\UserFactory factory($count = null, $state = [])
 * @method static \\Illuminate\\Database\\Eloquent\\Builder|User newModelQuery()
 * @method static \\Illuminate\\Database\\Eloquent\\Builder|User newQuery()
 * @method static \\Illuminate\\Database\\Eloquent\\Builder|User query()
 * @method static \\Illuminate\\Database\\Eloquent\\Builder|User whereCreatedAt($value)
 * @method static \\Illuminate\\Database\\Eloquent\\Builder|User whereEmail($value)
 * @method static \\Illuminate\\Database\\Eloquent\\Builder|User whereEmailVerifiedAt($value)
 * @method static \\Illuminate\\Database\\Eloquent\\Builder|User whereId($value)
 * @method static \\Illuminate\\Database\\Eloquent\\Builder|User whereName($value)
 * @method static \\Illuminate\\Database\\Eloquent\\Builder|User wherePassword($value)
 * @method static \\Illuminate\\Database\\Eloquent\\Builder|User whereRememberToken($value)
 * @method static \\Illuminate\\Database\\Eloquent\\Builder|User whereUpdatedAt($value)
 */`);

  const parsedDoc = phpDocParser.parse(code);

  const expected = {
    summary: 'App\\Models\\User',
    description: '',
    tags: [
      {
        tagName: '@property',
        typeString: 'int',
        name: '$id',
        description: '',
      },
      {
        tagName: '@property',
        typeString: 'string',
        name: '$name',
        description: '',
      },
      {
        tagName: '@property',
        typeString: 'string',
        name: '$email',
        description: '',
      },
      {
        tagName: '@property',
        typeString: '\\Illuminate\\Support\\Carbon|null',
        name: '$email_verified_at',
        description: '',
      },
      {
        tagName: '@property',
        typeString: 'mixed',
        name: '$password',
        description: '',
      },
      {
        tagName: '@property',
        typeString: 'string|null',
        name: '$remember_token',
        description: '',
      },
      {
        tagName: '@property',
        typeString: '\\Illuminate\\Support\\Carbon|null',
        name: '$created_at',
        description: '',
      },
      {
        tagName: '@property',
        typeString: '\\Illuminate\\Support\\Carbon|null',
        name: '$updated_at',
        description: '',
      },
      {
        tagName: '@property-read',
        typeString: 'int|null',
        name: '$notifications_count',
        description: '',
      },
      {
        tagName: '@property-read',
        typeString: 'int|null',
        name: '$tokens_count',
        description: '',
      },
      {
        tagName: '@method',
        isStatic: true,
        typeString: '\\Database\\Factories\\UserFactory',
        name: 'factory',
        parameters: [],
        description: '',
      },
      {
        tagName: '@method',
        isStatic: true,
        typeString: '\\Illuminate\\Database\\Eloquent\\Builder|User',
        name: 'newModelQuery',
        parameters: [],
        description: '',
      },
      {
        tagName: '@method',
        isStatic: true,
        typeString: '\\Illuminate\\Database\\Eloquent\\Builder|User',
        name: 'newQuery',
        parameters: [],
        description: '',
      },
      {
        tagName: '@method',
        isStatic: true,
        typeString: '\\Illuminate\\Database\\Eloquent\\Builder|User',
        name: 'query',
        parameters: [],
        description: '',
      },
      {
        tagName: '@method',
        isStatic: true,
        typeString: '\\Illuminate\\Database\\Eloquent\\Builder|User',
        name: 'whereCreatedAt',
        parameters: [
          {
            typeString: 'mixed',
            name: '$value',
          },
        ],
        description: '',
      },
      {
        tagName: '@method',
        isStatic: true,
        typeString: '\\Illuminate\\Database\\Eloquent\\Builder|User',
        name: 'whereEmail',
        parameters: [
          {
            typeString: 'mixed',
            name: '$value',
          },
        ],
        description: '',
      },
      {
        tagName: '@method',
        isStatic: true,
        typeString: '\\Illuminate\\Database\\Eloquent\\Builder|User',
        name: 'whereEmailVerifiedAt',
        parameters: [
          {
            typeString: 'mixed',
            name: '$value',
          },
        ],
        description: '',
      },
      {
        tagName: '@method',
        isStatic: true,
        typeString: '\\Illuminate\\Database\\Eloquent\\Builder|User',
        name: 'whereId',
        parameters: [
          {
            typeString: 'mixed',
            name: '$value',
          },
        ],
        description: '',
      },
      {
        tagName: '@method',
        isStatic: true,
        typeString: '\\Illuminate\\Database\\Eloquent\\Builder|User',
        name: 'whereName',
        parameters: [
          {
            typeString: 'mixed',
            name: '$value',
          },
        ],
        description: '',
      },
      {
        tagName: '@method',
        isStatic: true,
        typeString: '\\Illuminate\\Database\\Eloquent\\Builder|User',
        name: 'wherePassword',
        parameters: [
          {
            typeString: 'mixed',
            name: '$value',
          },
        ],
        description: '',
      },
      {
        tagName: '@method',
        isStatic: true,
        typeString: '\\Illuminate\\Database\\Eloquent\\Builder|User',
        name: 'whereRememberToken',
        parameters: [
          {
            typeString: 'mixed',
            name: '$value',
          },
        ],
        description: '',
      },
      {
        tagName: '@method',
        isStatic: true,
        typeString: '\\Illuminate\\Database\\Eloquent\\Builder|User',
        name: 'whereUpdatedAt',
        parameters: [
          {
            typeString: 'mixed',
            name: '$value',
          },
        ],
        description: '',
      },
    ],
  };

  expect(parsedDoc).toMatchObject(expected);
});

test('Testing summary and description', () => {
  const code = testUtils.stripInitialNewline(`
/**
 * Summary Text
 *
 * Description Text1
 * Description Text2
 *
 * Description Text3 and Lorem ipsum dolor sit amet, consectetur adipiscing
 * elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
 * enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
 * aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
 * voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
 * occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit
 * anim id est laborum.
 *
 * @property int $id
 */`);

  const parsedDoc = phpDocParser.parse(code);

  const expectedSummary = `Summary Text`;
  const expectedDescription = `Description Text1
Description Text2

Description Text3 and Lorem ipsum dolor sit amet, consectetur adipiscing
elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit
anim id est laborum.`;

  expect(parsedDoc?.summary).toBe(expectedSummary);
  expect(parsedDoc?.description).toBe(expectedDescription);
});

test('Testing @var', () => {
  const code = testUtils.stripInitialNewline(`
/**
 * @var array<int, string> $sample comment... comment
 * @var array<int, string> $sample
 * @var array<int, class-string|string>
 * @var int $sample comment... comment
 * @var int $sample
 * @var int
 */
`);

  const parsedDoc = phpDocParser.parse(code);

  const expected = {
    tags: [
      {
        tagName: '@var',
        typeString: 'array<int, string>',
        name: '$sample',
        description: 'comment... comment',
      },
      {
        tagName: '@var',
        typeString: 'array<int, string>',
        name: '$sample',
        description: '',
      },
      {
        tagName: '@var',
        typeString: 'array<int, class-string|string>',
        name: '',
        description: '',
      },
      {
        tagName: '@var',
        typeString: 'int',
        name: '$sample',
        description: 'comment... comment',
      },
      {
        tagName: '@var',
        typeString: 'int',
        name: '$sample',
        description: '',
      },
      {
        tagName: '@var',
        typeString: 'int',
        name: '',
        description: '',
      },
    ],
  };

  expect(parsedDoc).toMatchObject(expected);
});
