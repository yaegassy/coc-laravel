import { describe, expect, test } from 'vitest';

import path from 'path';

import * as eloquentModelCommon from '../common/eloquentModel';
import * as phpCommon from '../common/composer';
import * as testUtils from './testUtils';

describe('Testing get eloquent model', () => {
  test('Testing get eloquent model | --no-write (-N)', async () => {
    const code = testUtils.stripInitialNewline(`
<?php

// @formatter:off
/**
 * A helper file for your Eloquent Models
 * Copy the phpDocs from this file to the correct Model,
 * And remove them from this file, to prevent double declarations.
 *
 * @author Barry vd. Heuvel <barryvdh@gmail.com>
 */


namespace App\\Models{
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
 */
	class User extends \\Eloquent {}
}
`);

    const ideHelperModels = eloquentModelCommon.getIdeHelperModelsFromCode(code);
    const models = eloquentModelCommon.getEloquentModels(ideHelperModels, code);

    const expected = [
      {
        name: 'User',
        fullQualifiedName: 'App\\Models\\User',
        helperClassName: 'User',
        namespace: 'App\\Models',
        tableName: 'users',
        properties: [
          {
            name: '$id',
            typeString: 'int',
          },
          {
            name: '$name',
            typeString: 'string',
          },
          {
            name: '$email',
            typeString: 'string',
          },
          {
            name: '$email_verified_at',
            typeString: '\\Illuminate\\Support\\Carbon|null',
          },
          {
            name: '$password',
            typeString: 'mixed',
          },
          {
            name: '$remember_token',
            typeString: 'string|null',
          },
          {
            name: '$created_at',
            typeString: '\\Illuminate\\Support\\Carbon|null',
          },
          {
            name: '$updated_at',
            typeString: '\\Illuminate\\Support\\Carbon|null',
          },
        ],
      },
    ];

    expect(models).toMatchObject(expected);
  });

  test('Testing get eloquent model | with --write-mix (-M)', async () => {
    const code = testUtils.stripInitialNewline(`
<?php

// @formatter:off
/**
 * A helper file for your Eloquent Models
 * Copy the phpDocs from this file to the correct Model,
 * And remove them from this file, to prevent double declarations.
 *
 * @author Barry vd. Heuvel <barryvdh@gmail.com>
 */

namespace App\\Models{
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
 * @mixin \\Eloquent
 */
	class IdeHelperUser {}
}
`);

    const ideHelperModels = eloquentModelCommon.getIdeHelperModelsFromCode(code);
    const models = eloquentModelCommon.getEloquentModels(ideHelperModels, code);

    const expected = [
      {
        name: 'User',
        fullQualifiedName: 'App\\Models\\User',
        helperClassName: 'IdeHelperUser', // <- here
        namespace: 'App\\Models',
        tableName: 'users',
        properties: [
          {
            name: '$id',
            typeString: 'int',
          },
          {
            name: '$name',
            typeString: 'string',
          },
          {
            name: '$email',
            typeString: 'string',
          },
          {
            name: '$email_verified_at',
            typeString: '\\Illuminate\\Support\\Carbon|null',
          },
          {
            name: '$password',
            typeString: 'mixed',
          },
          {
            name: '$remember_token',
            typeString: 'string|null',
          },
          {
            name: '$created_at',
            typeString: '\\Illuminate\\Support\\Carbon|null',
          },
          {
            name: '$updated_at',
            typeString: '\\Illuminate\\Support\\Carbon|null',
          },
        ],
      },
    ];

    expect(models).toMatchObject(expected);
  });
});

test('Testing get abusolute class file path from namespace class', async () => {
  const fullQualifiedClassName = 'App\\Models\\User';

  const rootDir = testUtils.TEST_LV_PROJECT_PATH;
  const composerJsonContent = await phpCommon.getComposerJsonContent(rootDir);
  if (!composerJsonContent) return;

  const projectNamespaces = phpCommon.getProjectNamespacesFromComposerJson(composerJsonContent);
  const relativeClassFilePath = phpCommon.getRelativeClassFilePathFromNamespaces(
    projectNamespaces,
    fullQualifiedClassName
  );
  if (!relativeClassFilePath) return;

  const abusoluteClassFilePath = path.join(rootDir, relativeClassFilePath);

  expect(abusoluteClassFilePath).toBe(path.join(rootDir, 'app', 'Models', 'User.php'));
});

describe('Testing get table name', () => {
  test('Testing get table name | exists table property', async () => {
    const code = testUtils.stripInitialNewline(`
<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;

class Dummy extends Model
{
    use HasFactory;

    protected $table = 'm_dummy';
}
`);

    const qualifiedClassName = 'Dummy';
    const res = eloquentModelCommon.getTableName(code, qualifiedClassName);
    const expected = 'm_dummy';

    expect(res).toBe(expected);
  });

  test('Testing get table name | not exists table property', async () => {
    const code = testUtils.stripInitialNewline(`
<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;

class Dummy extends Model
{
    use HasFactory;
}
`);

    const qualifiedClassName = 'Dummy';
    const res = eloquentModelCommon.getTableName(code, qualifiedClassName);
    const expected = 'dummies';

    expect(res).toBe(expected);
  });
});
