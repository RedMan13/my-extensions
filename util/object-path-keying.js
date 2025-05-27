export function _getPathList(str) {
    let back = false;
    const keys = [];
    let lastIdx = 0;
    for (let i = 0; i < str.length; i++) {
        if (str[i] === '\\') { back = true; continue; }
        if (back) { back = false; continue; }
        if (str[i] === '.') {
            keys.push(str.slice(lastIdx, i));
            lastIdx = i +1;
            continue;
        }
    }
    return keys;
}

export function getAtIn(object, path) {
    const pathList = _getPathList(path);
    for (const key of pathList) {
        if (!Object.prototype.hasOwnProperty.call(object, key)) return;
        object = object[key];
    }
    return object;
}
export function setAtIn(object, path, value) {
    const pathList = _getPathList(path);
    for (const i in pathList) {
        const key = pathList[i];
        if (!Object.prototype.hasOwnProperty.call(object, key)) return;
        // if this is the last path item, then perform the set op
        if (i === (pathList.length -1)) return object[key] = value;
        object = object[key];
    }
    return;
}