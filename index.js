const mountPath = '/__swagger__escode__codegen__/save';
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const compile = require('./lib/javascript');
const { exec } = require('child_process');

const isSwaggerLike = (value) => value && value.swagger && value.paths;

const isObject = function (val) {
    return Object.prototype.toString.call(val) === '[object Object]';
}
const isArray = function (val) {
    return Object.prototype.toString.call(val) === '[object Array]';
}
const isNotEmpty = function (val) { return val !== null && val != undefined; };

const isString = function (val) {
    return Object.prototype.toString.call(val) === '[object String]';
}

const isFunction = function (val) {
    return Object.prototype.toString.call(val) === '[object Function]';
}

const notEmptyNotString = function (val) {
    return isNotEmpty(val) && !isString(val);
}
const urlPattern = /^((https?:)?\/\/([^/:]*))/;

const throwError = function (msg) {
    console.error(chalk.red(msg));
    console.log();
    throw new Error();
}
const checkSettings = function (settings) {
    const { prettyCmd, swaggerSavePath, codegen, homePage } = settings;

    if (!isArray(homePage) && notEmptyNotString(homePage)) {
        throwError('homePage type should be string or Array<string>');
    }

    const swaggerUis = isArray(homePage) ? homePage : [homePage];

    swaggerUis.forEach(function (ui) {
        if (!urlPattern.test(ui)) {
            throwError(`homePage [${ui}] is not valid http[s] url`);
        }
    });

    if (!isObject(codegen)) {
        throwError('codegen type should be object');
    }

    const { tsType, tsApi, httpBase, responseWrapperName, responseWrapperPath, transformFileName } = codegen;

    if (!isString(tsType)) {
        throwError('tsType type should be string');
    }

    if (!isString(tsApi)) {
        throwError('tsApi type should be string');
    }

    if (!isString(httpBase)) {
        throwError('httpBase type should be string');
    }

    if (notEmptyNotString(responseWrapperPath)) {
        throwError('responseWrapperPath type should be string or null');
    }

    if (notEmptyNotString(responseWrapperName)) {
        throwError('responseWrapperName type should be string or null');
    }


    if (isNotEmpty(transformFileName) && !isFunction(transformFileName)) {
        throwError('transformFileName type should be function or null');
    }

    if (notEmptyNotString(swaggerSavePath)) {
        throwError('swaggerSavePath type should be string or null');
    }

    if (notEmptyNotString(prettyCmd)) {
        throwError('prettyCmd type should be string or null');
    }
}

const checkParams = function (params) {
    if (!isArray(params)) {
        throwError('params type should be Array<object>');
    }
    params.forEach(checkSettings);
}
module.exports = function (params) {
    checkParams(params);

    const urlMapIndex = params.reduce(function (total, item) {
        const { homePage } = item;
        const swaggerUis = isArray(homePage) ? homePage : [homePage];
        swaggerUis.forEach(function (ui) {
            total[ui] = item;
        });
        return total;
    }, {});

    const swaggerUrls = Object.keys(urlMapIndex);

    return function (req, res, next) {
        if (!/POST/.test(req.method) || req.path !== mountPath) {
            next();
            return;
        }
        const { swagger, documentUrl, swaggerUrl } = req.body || {};

        if (!isSwaggerLike(swagger) || !documentUrl || !swaggerUrl) {
            res.status(400).send('correct body structure: { swagger, documentUrl, swaggerUrl }');
            return;
        }
        const equalMatchUrl = swaggerUrls.find(ui => documentUrl === ui);
        const startMatchUrl = swaggerUrls.find(ui => documentUrl.indexOf(ui) === 0);

        const isAllowed = equalMatchUrl || startMatchUrl;

        if (!isAllowed) {
            res.status(403).send('Allowd Hostnames: ' + swaggerUrls.join(', '));
            return;
        }
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,HEAD');
        res.header('Access-Control-Max-Age', 3600);
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if ('OPTIONS' === req.method) {
            res.sendStatus(200);
            return;
        }

        const settings = urlMapIndex[isAllowed];

        const { prettyCmd, swaggerSavePath, codegen, } = settings;
        const { tsType,
            tsApi,
            httpBase,
            responseWrapperPath,
            responseWrapperName,
            transformFileName, } = codegen;


        try {
            if (swaggerSavePath) {
                fs.writeFileSync(path.resolve(process.cwd(), swaggerSavePath), JSON.stringify(swagger, null, 2));
            }

            console.log('code....');
            compile({
                swagger,
                tsType,
                tsControler: tsApi,
                httpBase,
                // targetFolder: 'src/codegen/service/temp/api',
                // difinitionFolder: 'src/codegen/service/temp/typedef',
                commonType: responseWrapperPath,
                commonTypeName: responseWrapperName,
                getAPIFileName: transformFileName,
                importStar: false,
            });
        } catch (e) {
            console.error(e);
        }
        res.sendStatus(200);

        if (prettyCmd) {
            exec(prettyCmd, { cwd: process.cwd() }, (error, stdout, stderr) => {

                if (error) {
                    console.error(`exec error: ${error}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
                if (stderr) {
                    console.error(`stderr: ${stderr}`);
                }
            });
        }
    }
}