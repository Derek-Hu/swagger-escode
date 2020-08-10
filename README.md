Generate typescript codes once user visit online swagger(2.x) docs.

### Step1 Add settings in webpack or custom node server. 

`swagger-escode` depends upon http request `body` data. You may config nodejs server with `body-parser`;

```js
// config-override.js
const params = [{
    homePage: [
        'https://business-dev.company.com/swagger-ui.html',
    ],
    codegen: {
        // generated Folders
        tsType: 'src/codegen/service/business/types',
        tsApi: 'src/codegen/service/business/ts',

        // Custom Request Tool
        httpBase: '~/utils/fetch',

        // Response Wrapper
        responseWrapperPath: 'src/codegen/service/commonType',
        responseWrapperName: 'Response',

        // rename file name more friendly
        // Sample --> SampleController
        transformFileName: function(name){
          if(name === 'Sample'){
            return name + 'Controller';
          }
          return name;
        }
    },
    // save swagger definition json if you want
    // swaggerSavePath: 'src/codegen/service/swagger-business.json',

    // Pretty your codes after generation
    // prettyCmd: 'npm run code:pretty',
}];

const bodyParser = require('body-parser');
const SwaggerESCode = require('swagger-escode');

module.exports = {
  webpack: {
    ...
  },
  devServer: function (configFunction) {
    return function (proxy, allowedHost) {
      const config = configFunction(proxy, allowedHost);

      config.before = function (app, server, compiler) {
        // dependency: data
        app.use(bodyParser.json({ limit: '5mb' }));
        // Mount in nodejs
        app.user(SwaggerESCode(params));
      }

      return config;
    };
  },
}
```

### Step2 Install Browser Extension One-Time

* Extension cross projects, install one-time only.

Install extension using folder `node_modules/swagger-escode/extension`, which support Chrome and Firefox.

### Step3 Visit Swagger Online Docs

3.1. Start webpack/nodejs server and then open `https://business-dev.company.com/swagger-ui.html`

3.2. View codes generated in folder `src/codegen/service`
```
my-app
├── config-override.js
├── node_modules
├── public
│   ├ index.html
│   └── favicon.ico
├── utils
│   └── fetch.ts
└── src
    ├── pages
    ├── components
    └── codegen
        └── service
            ├── commonType.ts
            └── business
                ├── ts
                │   └── SampleController.ts
                └── types
                    └── IMenuBo.ts
```

```js
// src/codegen/service/business/ts/SampleController.ts

import { Response } from '../commonType';
import { IMenuBo } from '../types/IMenuBo';

import http from '~/utils/fetch';

/**
 * Delete Sample
 */
export const deleteSample = function(
  {
      id: number,
  },
  params?: {
    sample?: object;
  },
  config?: { [key: string]: any }
): Promise<Response<string>> {
  return http.delete(`/sample/${id}`, {
    params,
    ...config,
  });
};

/**
 * Get User Menu Permissions
 */
export const getMenu = function(config?: { [key: string]: any }): Promise<Response<Array<IMenuBo>>> {
  return http.get(`/menus`, {
    ...config,
  });
};

```

```js
// src/codegen/service/business/types/IMenuBo.ts

export interface IMenuBo {
  code?: string;

  title?: string;

  name?: string;
}
```
### Options

options is type of `Array<Settings>`.

`Settings` attributes as below:

* `homePage`: `string` | `Array<string>`, Swagger Online Docs

* `codegen`: `CodeGen` params for code generation.

* `prettyCmd`: `Optional` pretty code command executed after code generate finished.

* `swaggerSavePath`: `Optional` file path if you want to save original swagger difinitions content.


`CodeGen` attributes as below:

* `tsType`: `string`  folder for generated typescript type definitions.

* `tsApi`: `string`  folder for generated typescript api codes.

* `httpBase`: `string`  Promise based HTTP client. for example: `axios`.

* `responseWrapperPath`: `Optional` `string`, custom response wrapper file path

* `responseWrapperName`: `Optional` `string`, exported name from custom response wrapper file path

* `transformFileName`: `Optional` `function`, transform file name more friendly.





