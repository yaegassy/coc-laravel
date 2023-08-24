import { describe, expect, test } from 'vitest';

import * as testUtils from './testUtils';

test('Testing config function', async () => {
  const code = testUtils.stripInitialNewline(`
echo json_encode(config()->all(), JSON_PRETTY_PRINT);
`);

  const rootDir = testUtils.TEST_LV_PROJECT_PATH;
  const artisanPath = testUtils.getArtisanPath(rootDir)!;

  const resJsonStr = await testUtils.runTinker(code, artisanPath);
  if (!resJsonStr) return;

  console.log(resJsonStr);

  // const resJsonStr = await testUtils.runTinkerReflection(code, artisanPath);
  // if (!resJsonStr) return;
  // const reflectorFunctionParameters = JSON.parse(resJsonStr) as ReflectorParameterType[];

  // const expected = [{ name: 'boolean' }, { name: 'code' }, { name: 'message' }, { name: 'headers' }];

  // expect(reflectorFunctionParameters).toMatchObject(expected);
});

// ```
// {
//     "app": {
//         "name": "Laravel",
//         "env": "local",
//         "debug": true,
//         "url": "http:\/\/localhost",
//         "asset_url": null,
//         "timezone": "UTC",
//         "locale": "en",
//         "fallback_locale": "en",
//         "faker_locale": "en_US",
//         "key": "base64:oJszWsYL9IgP0XPb5M\/ONxBmJZM3WCbuit4oJvF3KGk=",
//         "cipher": "AES-256-CBC",
//         "maintenance": {
//             "driver": "file"
//         },
//         "providers": [
//             "Illuminate\\Auth\\AuthServiceProvider",
//             "Illuminate\\Broadcasting\\BroadcastServiceProvider",
//             "Illuminate\\Bus\\BusServiceProvider",
//             "Illuminate\\Cache\\CacheServiceProvider",
//             "Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProv
// ider",
//             "Illuminate\\Cookie\\CookieServiceProvider",
//             "Illuminate\\Database\\DatabaseServiceProvider",
//             "Illuminate\\Encryption\\EncryptionServiceProvider",
//             "Illuminate\\Filesystem\\FilesystemServiceProvider",
//             "Illuminate\\Foundation\\Providers\\FoundationServiceProvider
// ",
//             "Illuminate\\Hashing\\HashServiceProvider",
//             "Illuminate\\Mail\\MailServiceProvider",
//             "Illuminate\\Notifications\\NotificationServiceProvider",
//             "Illuminate\\Pagination\\PaginationServiceProvider",
//             "Illuminate\\Pipeline\\PipelineServiceProvider",
//             "Illuminate\\Queue\\QueueServiceProvider",
//             "Illuminate\\Redis\\RedisServiceProvider",
//             "Illuminate\\Auth\\Passwords\\PasswordResetServiceProvider",
//             "Illuminate\\Session\\SessionServiceProvider",
//             "Illuminate\\Translation\\TranslationServiceProvider",
//             "Illuminate\\Validation\\ValidationServiceProvider",
//             "Illuminate\\View\\ViewServiceProvider",
//             "App\\Providers\\AppServiceProvider",
//             "App\\Providers\\AuthServiceProvider",
//             "App\\Providers\\EventServiceProvider",
//             "App\\Providers\\RouteServiceProvider"
//         ],
//         "aliases": {
//             "App": "Illuminate\\Support\\Facades\\App",
//             "Arr": "Illuminate\\Support\\Arr",
//             "Artisan": "Illuminate\\Support\\Facades\\Artisan",
//             "Auth": "Illuminate\\Support\\Facades\\Auth",
//             "Blade": "Illuminate\\Support\\Facades\\Blade",
//             "Broadcast": "Illuminate\\Support\\Facades\\Broadcast",
//             "Bus": "Illuminate\\Support\\Facades\\Bus",
//             "Cache": "Illuminate\\Support\\Facades\\Cache",
//             "Config": "Illuminate\\Support\\Facades\\Config",
//             "Cookie": "Illuminate\\Support\\Facades\\Cookie",
//             "Crypt": "Illuminate\\Support\\Facades\\Crypt",
//             "Date": "Illuminate\\Support\\Facades\\Date",
//             "DB": "Illuminate\\Support\\Facades\\DB",
//             "Eloquent": "Illuminate\\Database\\Eloquent\\Model",
//             "Event": "Illuminate\\Support\\Facades\\Event",
//             "File": "Illuminate\\Support\\Facades\\File",
//             "Gate": "Illuminate\\Support\\Facades\\Gate",
//             "Hash": "Illuminate\\Support\\Facades\\Hash",
//             "Http": "Illuminate\\Support\\Facades\\Http",
//             "Js": "Illuminate\\Support\\Js",
//             "Lang": "Illuminate\\Support\\Facades\\Lang",
//             "Log": "Illuminate\\Support\\Facades\\Log",
//             "Mail": "Illuminate\\Support\\Facades\\Mail",
//             "Notification": "Illuminate\\Support\\Facades\\Notification",
//             "Password": "Illuminate\\Support\\Facades\\Password",
//             "Process": "Illuminate\\Support\\Facades\\Process",
//             "Queue": "Illuminate\\Support\\Facades\\Queue",
//             "RateLimiter": "Illuminate\\Support\\Facades\\RateLimiter",
//             "Redirect": "Illuminate\\Support\\Facades\\Redirect",
//             "Request": "Illuminate\\Support\\Facades\\Request",
//             "Response": "Illuminate\\Support\\Facades\\Response",
//             "Route": "Illuminate\\Support\\Facades\\Route",
//             "Schema": "Illuminate\\Support\\Facades\\Schema",
//             "Session": "Illuminate\\Support\\Facades\\Session",
//             "Storage": "Illuminate\\Support\\Facades\\Storage",
//             "Str": "Illuminate\\Support\\Str",
//             "URL": "Illuminate\\Support\\Facades\\URL",
//             "Validator": "Illuminate\\Support\\Facades\\Validator",
//             "View": "Illuminate\\Support\\Facades\\View",
//             "Vite": "Illuminate\\Support\\Facades\\Vite"
//         }
//     },
//     "auth": {
//         "defaults": {
//             "guard": "web",
//             "passwords": "users"
//         },
//         "guards": {
//             "web": {
//                 "driver": "session",
//                 "provider": "users"
//             },
//             "sanctum": {
//                 "driver": "sanctum",
//                 "provider": null
//             }
//         },
//         "providers": {
//             "users": {
//                 "driver": "eloquent",
//                 "model": "App\\Models\\User"
//             }
//         },
//         "passwords": {
//             "users": {
//                 "provider": "users",
//                 "table": "password_reset_tokens",
//                 "expire": 60,
//                 "throttle": 60
//             }
//         },
//         "password_timeout": 10800
//     },
//     "broadcasting": {
//         "default": "log",
//         "connections": {
//             "pusher": {
//                 "driver": "pusher",
//                 "key": "",
//                 "secret": "",
//                 "app_id": "",
//                 "options": {
//                     "cluster": "mt1",
//                     "host": "api-mt1.pusher.com",
//                     "port": "443",
//                     "scheme": "https",
//                     "encrypted": true,
//                     "useTLS": true
//                 },
//                 "client_options": []
//             },
//             "ably": {
//                 "driver": "ably",
//                 "key": null
//             },
//             "redis": {
//                 "driver": "redis",
//                 "connection": "default"
//             },
//             "log": {
//                 "driver": "log"
//             },
//             "null": {
//                 "driver": "null"
//             }
//         }
//     },
//     "cache": {
//         "default": "file",
//         "stores": {
//             "apc": {
//                 "driver": "apc"
//             },
//             "array": {
//                 "driver": "array",
//                 "serialize": false
//             },
//             "database": {
//                 "driver": "database",
//                 "table": "cache",
//                 "connection": null,
//                 "lock_connection": null
//             },
//             "file": {
//                 "driver": "file",
//                 "path": "\/Users\/yaegassy\/_Dev\/vim\/coc-laravel\/larav
// el-project\/storage\/framework\/cache\/data",
//                 "lock_path": "\/Users\/yaegassy\/_Dev\/vim\/coc-laravel\/
// laravel-project\/storage\/framework\/cache\/data"
//             },
//             "memcached": {
//                 "driver": "memcached",
//                 "persistent_id": null,
//                 "sasl": [
//                     null,
//                     null
//                 ],
//                 "options": [],
//                 "servers": [
//                     {
//                         "host": "127.0.0.1",
//                         "port": 11211,
//                         "weight": 100
//                     }
//                 ]
//             },
//             "redis": {
//                 "driver": "redis",
//                 "connection": "cache",
//                 "lock_connection": "default"
//             },
//             "dynamodb": {
//                 "driver": "dynamodb",
//                 "key": "",
//                 "secret": "",
//                 "region": "us-east-1",
//                 "table": "cache",
//                 "endpoint": null
//             },
//             "octane": {
//                 "driver": "octane"
//             }
//         },
//         "prefix": "laravel_cache_"
//     },
//     "cors": {
//         "paths": [
//             "api\/*",
//             "sanctum\/csrf-cookie"
//         ],
//         "allowed_methods": [
//             "*"
//         ],
//         "allowed_origins": [
//             "*"
//         ],
//         "allowed_origins_patterns": [],
//         "allowed_headers": [
//             "*"
//         ],
//         "exposed_headers": [],
//         "max_age": 0,
//         "supports_credentials": false
//     },
//     "database": {
//         "default": "sqlite",
//         "connections": {
//             "sqlite": {
//                 "driver": "sqlite",
//                 "url": null,
//                 "database": "\/Users\/yaegassy\/_Dev\/vim\/coc-laravel\/l
// aravel-project\/database\/database.sqlite",
//                 "prefix": "",
//                 "foreign_key_constraints": true
//             },
//             "mysql": {
//                 "driver": "mysql",
//                 "url": null,
//                 "host": "127.0.0.1",
//                 "port": "3306",
//                 "database": "forge",
//                 "username": "forge",
//                 "password": "",
//                 "unix_socket": "",
//                 "charset": "utf8mb4",
//                 "collation": "utf8mb4_unicode_ci",
//                 "prefix": "",
//                 "prefix_indexes": true,
//                 "strict": true,
//                 "engine": null,
//                 "options": []
//             },
//             "pgsql": {
//                 "driver": "pgsql",
//                 "url": null,
//                 "host": "127.0.0.1",
//                 "port": "5432",
//                 "database": "forge",
//                 "username": "forge",
//                 "password": "",
//                 "charset": "utf8",
//                 "prefix": "",
//                 "prefix_indexes": true,
//                 "search_path": "public",
//                 "sslmode": "prefer"
//             },
//             "sqlsrv": {
//                 "driver": "sqlsrv",
//                 "url": null,
//                 "host": "localhost",
//                 "port": "1433",
//                 "database": "forge",
//                 "username": "forge",
//                 "password": "",
//                 "charset": "utf8",
//                 "prefix": "",
//                 "prefix_indexes": true
//             }
//         },
//         "migrations": "migrations",
//         "redis": {
//             "client": "phpredis",
//             "options": {
//                 "cluster": "redis",
//                 "prefix": "laravel_database_"
//             },
//             "default": {
//                 "url": null,
//                 "host": "127.0.0.1",
//                 "username": null,
//                 "password": null,
//                 "port": "6379",
//                 "database": "0"
//             },
//             "cache": {
//                 "url": null,
//                 "host": "127.0.0.1",
//                 "username": null,
//                 "password": null,
//                 "port": "6379",
//                 "database": "1"
//             }
//         }
//     },
//     "filesystems": {
//         "default": "local",
//         "disks": {
//             "local": {
//                 "driver": "local",
//                 "root": "\/Users\/yaegassy\/_Dev\/vim\/coc-laravel\/larav
// el-project\/storage\/app",
//                 "throw": false
//             },
//             "public": {
//                 "driver": "local",
//                 "root": "\/Users\/yaegassy\/_Dev\/vim\/coc-laravel\/larav
// el-project\/storage\/app\/public",
//                 "url": "http:\/\/localhost\/storage",
//                 "visibility": "public",
//                 "throw": false
//             },
//             "s3": {
//                 "driver": "s3",
//                 "key": "",
//                 "secret": "",
//                 "region": "us-east-1",
//                 "bucket": "",
//                 "url": null,
//                 "endpoint": null,
//                 "use_path_style_endpoint": false,
//                 "throw": false
//             }
//         },
//         "links": {
//             "\/Users\/yaegassy\/_Dev\/vim\/coc-laravel\/laravel-project\/
// public\/storage": "\/Users\/yaegassy\/_Dev\/vim\/coc-laravel\/laravel-pro
// ject\/storage\/app\/public"
//         }
//     },
//     "hashing": {
//         "driver": "bcrypt",
//         "bcrypt": {
//             "rounds": 10
//         },
//         "argon": {
//             "memory": 65536,
//             "threads": 1,
//             "time": 4
//         }
//     },
//     "logging": {
//         "default": "stack",
//         "deprecations": {
//             "channel": null,
//             "trace": false
//         },
//         "channels": {
//             "stack": {
//                 "driver": "stack",
//                 "channels": [
//                     "single"
//                 ],
//                 "ignore_exceptions": false
//             },
//             "single": {
//                 "driver": "single",
//                 "path": "\/Users\/yaegassy\/_Dev\/vim\/coc-laravel\/larav
// el-project\/storage\/logs\/laravel.log",
//                 "level": "debug",
//                 "replace_placeholders": true
//             },
//             "daily": {
//                 "driver": "daily",
//                 "path": "\/Users\/yaegassy\/_Dev\/vim\/coc-laravel\/larav
// el-project\/storage\/logs\/laravel.log",
//                 "level": "debug",
//                 "days": 14,
//                 "replace_placeholders": true
//             },
//             "slack": {
//                 "driver": "slack",
//                 "url": null,
//                 "username": "Laravel Log",
//                 "emoji": ":boom:",
//                 "level": "debug",
//                 "replace_placeholders": true
//             },
//             "papertrail": {
//                 "driver": "monolog",
//                 "level": "debug",
//                 "handler": "Monolog\\Handler\\SyslogUdpHandler",
//                 "handler_with": {
//                     "host": null,
//                     "port": null,
//                     "connectionString": "tls:\/\/:"
//                 },
//                 "processors": [
//                     "Monolog\\Processor\\PsrLogMessageProcessor"
//                 ]
//             },
//             "stderr": {
//                 "driver": "monolog",
//                 "level": "debug",
//                 "handler": "Monolog\\Handler\\StreamHandler",
//                 "formatter": null,
//                 "with": {
//                     "stream": "php:\/\/stderr"
//                 },
//                 "processors": [
//                     "Monolog\\Processor\\PsrLogMessageProcessor"
//                 ]
//             },
//             "syslog": {
//                 "driver": "syslog",
//                 "level": "debug",
//                 "facility": 8,
//                 "replace_placeholders": true
//             },
//             "errorlog": {
//                 "driver": "errorlog",
//                 "level": "debug",
//                 "replace_placeholders": true
//             },
//             "null": {
//                 "driver": "monolog",
//                 "handler": "Monolog\\Handler\\NullHandler"
//             },
//             "emergency": {
//                 "path": "\/Users\/yaegassy\/_Dev\/vim\/coc-laravel\/larav
// el-project\/storage\/logs\/laravel.log"
//             }
//         }
//     },
//     "mail": {
//         "default": "smtp",
//         "mailers": {
//             "smtp": {
//                 "transport": "smtp",
//                 "url": null,
//                 "host": "mailpit",
//                 "port": "1025",
//                 "encryption": null,
//                 "username": null,
//                 "password": null,
//                 "timeout": null,
//                 "local_domain": null
//             },
//             "ses": {
//                 "transport": "ses"
//             },
//             "mailgun": {
//                 "transport": "mailgun"
//             },
//             "postmark": {
//                 "transport": "postmark"
//             },
//             "sendmail": {
//                 "transport": "sendmail",
//                 "path": "\/usr\/sbin\/sendmail -bs -i"
//             },
//             "log": {
//                 "transport": "log",
//                 "channel": null
//             },
//             "array": {
//                 "transport": "array"
//             },
//             "failover": {
//                 "transport": "failover",
//                 "mailers": [
//                     "smtp",
//                     "log"
//                 ]
//             }
//         },
//         "from": {
//             "address": "hello@example.com",
//             "name": "Laravel"
//         },
//         "markdown": {
//             "theme": "default",
//             "paths": [
//                 "\/Users\/yaegassy\/_Dev\/vim\/coc-laravel\/laravel-proje
// ct\/resources\/views\/vendor\/mail"
//             ]
//         }
//     },
//     "queue": {
//         "default": "sync",
//         "connections": {
//             "sync": {
//                 "driver": "sync"
//             },
//             "database": {
//                 "driver": "database",
//                 "table": "jobs",
//                 "queue": "default",
//                 "retry_after": 90,
//                 "after_commit": false
//             },
//             "beanstalkd": {
//                 "driver": "beanstalkd",
//                 "host": "localhost",
//                 "queue": "default",
//                 "retry_after": 90,
//                 "block_for": 0,
//                 "after_commit": false
//             },
//             "sqs": {
//                 "driver": "sqs",
//                 "key": "",
//                 "secret": "",
//                 "prefix": "https:\/\/sqs.us-east-1.amazonaws.com\/your-ac
// count-id",
//                 "queue": "default",
//                 "suffix": null,
//                 "region": "us-east-1",
//                 "after_commit": false
//             },
//             "redis": {
//                 "driver": "redis",
//                 "connection": "default",
//                 "queue": "default",
//                 "retry_after": 90,
//                 "block_for": null,
//                 "after_commit": false
//             }
//         },
//         "batching": {
//             "database": "sqlite",
//             "table": "job_batches"
//         },
//         "failed": {
//             "driver": "database-uuids",
//             "database": "sqlite",
//             "table": "failed_jobs"
//         }
//     },
//     "sanctum": {
//         "stateful": [
//             "localhost",
//             "localhost:3000",
//             "127.0.0.1",
//             "127.0.0.1:8000",
//             "::1",
//             "localhost"
//         ],
//         "guard": [
//             "web"
//         ],
//         "expiration": null,
//         "middleware": {
//             "verify_csrf_token": "App\\Http\\Middleware\\VerifyCsrfToken"
// ,
//             "encrypt_cookies": "App\\Http\\Middleware\\EncryptCookies"
//         }
//     },
//     "services": {
//         "mailgun": {
//             "domain": null,
//             "secret": null,
//             "endpoint": "api.mailgun.net",
//             "scheme": "https"
//         },
//         "postmark": {
//             "token": null
//         },
//         "ses": {
//             "key": "",
//             "secret": "",
//             "region": "us-east-1"
//         }
//     },
//     "session": {
//         "driver": "file",
//         "lifetime": "120",
//         "expire_on_close": false,
//         "encrypt": false,
//         "files": "\/Users\/yaegassy\/_Dev\/vim\/coc-laravel\/laravel-proj
// ect\/storage\/framework\/sessions",
//         "connection": null,
//         "table": "sessions",
//         "store": null,
//         "lottery": [
//             2,
//             100
//         ],
//         "cookie": "laravel_session",
//         "path": "\/",
//         "domain": null,
//         "secure": null,
//         "http_only": true,
//         "same_site": "lax"
//     },
//     "view": {
//         "paths": [
//             "\/Users\/yaegassy\/_Dev\/vim\/coc-laravel\/laravel-project\/
// resources\/views"
//         ],
//         "compiled": "\/Users\/yaegassy\/_Dev\/vim\/coc-laravel\/laravel-p
// roject\/storage\/framework\/views"
//     },
//     "flare": {
//         "key": null,
//         "flare_middleware": {
//             "0": "Spatie\\FlareClient\\FlareMiddleware\\RemoveRequestIp",
//             "1": "Spatie\\FlareClient\\FlareMiddleware\\AddGitInformation
// ",
//             "2": "Spatie\\LaravelIgnition\\FlareMiddleware\\AddNotifierNa
// me",
//             "3": "Spatie\\LaravelIgnition\\FlareMiddleware\\AddEnvironmen
// tInformation",
//             "4": "Spatie\\LaravelIgnition\\FlareMiddleware\\AddExceptionI
// nformation",
//             "5": "Spatie\\LaravelIgnition\\FlareMiddleware\\AddDumps",
//             "Spatie\\LaravelIgnition\\FlareMiddleware\\AddLogs": {
//                 "maximum_number_of_collected_logs": 200
//             },
//             "Spatie\\LaravelIgnition\\FlareMiddleware\\AddQueries": {
//                 "maximum_number_of_collected_queries": 200,
//                 "report_query_bindings": true
//             },
//             "Spatie\\LaravelIgnition\\FlareMiddleware\\AddJobs": {
//                 "max_chained_job_reporting_depth": 5
//             },
//             "Spatie\\FlareClient\\FlareMiddleware\\CensorRequestBodyField
// s": {
//                 "censor_fields": [
//                     "password",
//                     "password_confirmation"
//                 ]
//             },
//             "Spatie\\FlareClient\\FlareMiddleware\\CensorRequestHeaders":
//  {
//                 "headers": [
//                     "API-KEY"
//                 ]
//             }
//         },
//         "send_logs_as_events": true
//     },
//     "ignition": {
//         "editor": "phpstorm",
//         "theme": "auto",
//         "enable_share_button": true,
//         "register_commands": false,
//         "solution_providers": [
//             "Spatie\\Ignition\\Solutions\\SolutionProviders\\BadMethodCal
// lSolutionProvider",
//             "Spatie\\Ignition\\Solutions\\SolutionProviders\\MergeConflic
// tSolutionProvider",
//             "Spatie\\Ignition\\Solutions\\SolutionProviders\\UndefinedPro
// pertySolutionProvider",
//             "Spatie\\LaravelIgnition\\Solutions\\SolutionProviders\\Incor
// rectValetDbCredentialsSolutionProvider",
//             "Spatie\\LaravelIgnition\\Solutions\\SolutionProviders\\Missi
// ngAppKeySolutionProvider",
//             "Spatie\\LaravelIgnition\\Solutions\\SolutionProviders\\Defau
// ltDbNameSolutionProvider",
//             "Spatie\\LaravelIgnition\\Solutions\\SolutionProviders\\Table
// NotFoundSolutionProvider",
//             "Spatie\\LaravelIgnition\\Solutions\\SolutionProviders\\Missi
// ngImportSolutionProvider",
//             "Spatie\\LaravelIgnition\\Solutions\\SolutionProviders\\Inval
// idRouteActionSolutionProvider",
//             "Spatie\\LaravelIgnition\\Solutions\\SolutionProviders\\ViewN
// otFoundSolutionProvider",
//             "Spatie\\LaravelIgnition\\Solutions\\SolutionProviders\\Runni
// ngLaravelDuskInProductionProvider",
//             "Spatie\\LaravelIgnition\\Solutions\\SolutionProviders\\Missi
// ngColumnSolutionProvider",
//             "Spatie\\LaravelIgnition\\Solutions\\SolutionProviders\\Unkno
// wnValidationSolutionProvider",
//             "Spatie\\LaravelIgnition\\Solutions\\SolutionProviders\\Missi
// ngMixManifestSolutionProvider",
//             "Spatie\\LaravelIgnition\\Solutions\\SolutionProviders\\Missi
// ngViteManifestSolutionProvider",
//             "Spatie\\LaravelIgnition\\Solutions\\SolutionProviders\\Missi
// ngLivewireComponentSolutionProvider",
//             "Spatie\\LaravelIgnition\\Solutions\\SolutionProviders\\Undef
// inedViewVariableSolutionProvider",
//             "Spatie\\LaravelIgnition\\Solutions\\SolutionProviders\\Gener
// icLaravelExceptionSolutionProvider",
//             "Spatie\\LaravelIgnition\\Solutions\\SolutionProviders\\OpenA
// iSolutionProvider"
//         ],
//         "ignored_solution_providers": [],
//         "enable_runnable_solutions": null,
//         "remote_sites_path": "\/Users\/yaegassy\/_Dev\/vim\/coc-laravel\/
// laravel-project",
//         "local_sites_path": "",
//         "housekeeping_endpoint_prefix": "_ignition",
//         "settings_file_path": "",
//         "recorders": [
//             "Spatie\\LaravelIgnition\\Recorders\\DumpRecorder\\DumpRecord
// er",
//             "Spatie\\LaravelIgnition\\Recorders\\JobRecorder\\JobRecorder
// ",
//             "Spatie\\LaravelIgnition\\Recorders\\LogRecorder\\LogRecorder
// ",
//             "Spatie\\LaravelIgnition\\Recorders\\QueryRecorder\\QueryReco
// rder"
//         ],
//         "open_ai_key": null,
//         "with_stack_frame_arguments": true,
//         "argument_reducers": [
//             "Spatie\\Backtrace\\Arguments\\Reducers\\BaseTypeArgumentRedu
// cer",
//             "Spatie\\Backtrace\\Arguments\\Reducers\\ArrayArgumentReducer
// ",
//             "Spatie\\Backtrace\\Arguments\\Reducers\\StdClassArgumentRedu
// cer",
//             "Spatie\\Backtrace\\Arguments\\Reducers\\EnumArgumentReducer"
// ,
//             "Spatie\\Backtrace\\Arguments\\Reducers\\ClosureArgumentReduc
// er",
//             "Spatie\\Backtrace\\Arguments\\Reducers\\DateTimeArgumentRedu
// cer",
//             "Spatie\\Backtrace\\Arguments\\Reducers\\DateTimeZoneArgument
// Reducer",
//             "Spatie\\Backtrace\\Arguments\\Reducers\\SymphonyRequestArgum
// entReducer",
//             "Spatie\\LaravelIgnition\\ArgumentReducers\\ModelArgumentRedu
// cer",
//             "Spatie\\LaravelIgnition\\ArgumentReducers\\CollectionArgumen
// tReducer",
//             "Spatie\\Backtrace\\Arguments\\Reducers\\StringableArgumentRe
// ducer"
//         ]
//     },
//     "ide-helper": {
//         "filename": "_ide_helper.php",
//         "models_filename": "_ide_helper_models.php",
//         "meta_filename": ".phpstorm.meta.php",
//         "include_fluent": false,
//         "include_factory_builders": false,
//         "write_model_magic_where": true,
//         "write_model_external_builder_methods": true,
//         "write_model_relation_count_properties": true,
//         "write_eloquent_model_mixins": false,
//         "include_helpers": false,
//         "helper_files": [
//             "\/Users\/yaegassy\/_Dev\/vim\/coc-laravel\/laravel-project\/
// vendor\/laravel\/framework\/src\/Illuminate\/Support\/helpers.php"
//         ],
//         "model_locations": [
//             "app"
//         ],
//         "ignored_models": [],
//         "model_hooks": [],
//         "extra": {
//             "Eloquent": [
//                 "Illuminate\\Database\\Eloquent\\Builder",
//                 "Illuminate\\Database\\Query\\Builder"
//             ],
//             "Session": [
//                 "Illuminate\\Session\\Store"
//             ]
//         },
//         "magic": [],
//         "interfaces": [],
//         "custom_db_types": [],
//         "model_camel_case_properties": false,
//         "type_overrides": {
//             "integer": "int",
//             "boolean": "bool"
//         },
//         "include_class_docblocks": false,
//         "force_fqn": false,
//         "use_generics_annotations": true,
//         "additional_relation_types": [],
//         "additional_relation_return_types": [],
//         "post_migrate": []
//     },
//     "tinker": {
//         "commands": [],
//         "alias": [],
//         "dont_alias": [
//             "App\\Nova"
//         ]
//     }
// }
// ```;
