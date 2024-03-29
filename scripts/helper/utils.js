/*
 * @Author: tackchen
 * @Date: 2022-10-23 20:12:31
 * @Description: Coding something
 */
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

function resolveRootPath (str) {
    return path.resolve(__dirname, `../../${str}`);
}

function resolvePackagePath (str) {
    return path.resolve(__dirname, `../../packages/${str}`);
}

function extractSinglePackageInfo (dir) {
    const { name, version, dependencies } = require(resolvePackagePath(`${dir}/package.json`));
    const array = dependencies ? Object.keys(dependencies) : [];
    // ! github ci 构建中 会有一个莫名的 undefined 依赖不知道哪里来的
    // 本地构建不会有这个问题
    if (array.includes('undefined')) {
        array.splice(array.indexOf('undefined'), 1);
    }
    return {
        name,
        version,
        dependencies: array,
    };
}

function extractPackagesInfo () {
    const result = [];
    traverseDir('@packages', dir => {
        result.push(extractSinglePackageInfo(dir));
    });
    return result;
}

function upcaseFirstLetter (str) {
    if (typeof str !== 'string' || !str) return '';
    return str.split('-').map(name => {
        return name[0].toUpperCase() + name.substr(1);
    }).join('');
}


function traverseDir (path, callback) {
    const dirs = fs.readdirSync(checkPath(path));
    dirs.map((name) => {
        if (name === '.DS_Store') return;
        callback(name);
    });
}


function checkPath (filePath) {
    if (filePath[0] === '@')
        return resolveRootPath(filePath.substring(1));
    if (filePath[0] === '#')
        return resolvePackagePath(filePath.substring(1));
    return filePath;
}

function copyFile ({
    src,
    dest = src,
    handler = null,
    json = false,
}) {
    src = checkPath(src);
    dest = checkPath(dest);
    let content = json ?
        require(checkPath(src)) :
        readFile(src);

    if (handler) {
        content = handler(content);
    }
    json ?
        writeJsonIntoFile(content, dest) :
        writeStringIntoFile(content, dest);
}

function writeJsonIntoFile (package, filePath) {
    fs.writeFileSync(checkPath(filePath), JSON.stringify(package, null, 4), 'utf-8');
}

function writeStringIntoFile (str, filePath) {
    fs.writeFileSync(checkPath(filePath), str, 'utf-8');
}

function readFile (filePath) {
    return fs.readFileSync(checkPath(filePath), 'utf-8');
}

async function exec (cmd) {
    return new Promise(resolve => {
        const child = childProcess.exec(cmd, function (error, stdout, stderr) {
            if (error) {
                resolve({ success: false, stdout, stderr });
            } else {

                resolve({
                    success: true,
                    stdout,
                    stderr
                });
            }
        });
        child.stdout.on('data', data => {
            console.log(data);
        });
        child.stderr.on('data', data => {
            console.log(data);
        });
    });
}
module.exports = {
    extractSinglePackageInfo,
    resolveRootPath,
    resolvePackagePath,
    extractPackagesInfo,
    upcaseFirstLetter,
    writeJsonIntoFile,
    writeStringIntoFile,
    traverseDir,
    exec,
    copyFile,
    readFile,
};
