const path = require('path');
const Utils = require('./utils');
const parseCategory = require('./parseCategory');
const defaultAction = require('./defaultAction');

function generateCode(swagger, params) {
    const categories = parseCategory(swagger.paths, params);
    Object.keys(categories).forEach(function (fileName) {
        const code = params.template(categories[fileName], swagger.definitions, params, fileName);
        // Utils.writeSync(path.resolve(params.targetFolder, fileName + '.js'), code);
    })
    if (swagger.definitions) {
        const definitionsPath = path.resolve(params.targetFolder, 'definitions.json');
        // Utils.writeSync(definitionsPath, JSON.stringify(swagger.definitions, null, 2));
        // logger.info('接口类型参考：' + definitionsPath);
    }
    // logger.info('成功生成代码：' + params.targetFolder + ', 数据结构定义目录' + params.difinitionFolder);
}
module.exports = function (params) {
    params = defaultAction.initParams(params);
    if (params.swagger) {
        generateCode(params.swagger, params);
        return;
    }
    // if (params.url) {
    //     request(params.url, function (error, response, body) {
    //         if (error) {
    //             throw error;
    //         }
    //         const result = JSON.parse(body);
    //         generateCode(result, params);
    //     });
    // }
}