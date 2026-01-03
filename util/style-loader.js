module.exports = function(text) {
    return `
    const style = ${JSON.stringify(text)};
    const el = document.createElement('style');
    el.type = "text/css"
    if (el.styleSheet) {
        el.styleSheet.cssText = style;
    } else {
        el.appendChild(document.createTextNode(style));
    }
    document.head.appendChild(el);
    module.exports = el.sheet;
    `;
}