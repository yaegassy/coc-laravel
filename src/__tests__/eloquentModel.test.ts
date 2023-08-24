import { expect, test } from 'vitest';

import * as eloquentModelCommon from '../common/eloquentModel';
import * as testUtils from './testUtils';

test('Testing get eloquent model', async () => {
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
  const models = eloquentModelCommon.getEloquentModels(ideHelperModels);

  const expected = [
    {
      name: 'User',
      fullQualifiedName: 'App\\Models\\User',
      namespace: 'App\\Models',
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
