export function castDynamic(value, type) {
    if (typeof value === type) return value;
    switch (`${type}-${typeof value}`) {
    case 'string-number':
    case 'string-boolean':
    case 'string-function':
        return String(value);
    case 'string-object':
        try { return JSON.stringify(value); } 
        catch { return 'null'; }

    case 'number-boolean':
    case 'number-string':
    case 'number-function':
    case 'number-object':
        return Number(value);
    

    case 'boolean-string':
    case 'boolean-number':
    case 'boolean-function':
    case 'boolean-object':
        return Boolean(value);

    case 'object-string':
        try {
            const parsed = JSON.parse(value);
            if (typeof parsed === 'object') return parsed;
            return {};
        } catch { return {}; }
    case 'object-boolean':
    case 'object-function':
    case 'object-number':
        return {};
    }
}
export function castAutomatic(text) {
    if (typeof text !== 'string') return '';
    if (!isNaN(Number(text))) {
        return Number(text);
    } else {
        try {
            const parsed = JSON.parse(text);
            if (typeof parsed === 'object') return parsed;
            if (typeof parsed === 'boolean') return parsed;
            return text;
        } catch {
            return text;
        }
    }
}