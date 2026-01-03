// peanut butter
import { vm } from '../../util/scratch-types';
import { compile } from './compile';
import { js_beautify } from "js-beautify";
const { Thread } = Object.assign({}, vm.exports, vm.exports.i_will_not_ask_for_help_when_these_break());

vm.runtime.on('PROJECT_LOADED', () => {
    if (vm.runtime.extensionStorage.hasBeenConverted) return;
    for (const target of vm.runtime.targets) {
        let result = '';
        result += 'let __target = thread.target;\n';
        result += 'let target = __target;\n';
        result += 'const runtime = __target.runtime;\n';
        result += 'const stage = runtime.getTargetForStage();\n';
        for (const script of target.blocks.getScripts()) {
            const thread = new Thread(script);
            thread.target = target;
            thread.blockContainer = target.blocks;
            thread.stackClick = true;
            const func = compile(thread).startingFunction.toString();
            let start = func.indexOf('runtime.getTargetForStage();') +28;
            let end = func.lastIndexOf('} catch (err) {c');
            let text = func.slice(start, end).replace('try {', '').replace(/return function\* gen[0-9]+ \(\) {/, '').trim();
            const hatBlock = target.blocks.getBlock(script);
            result += `thread.on('${hatBlock.opcode}', function*(opts) {\n`;
            for (const field in hatBlock.fields)
                result += `if (opts.${field.name} !== ${JSON.stringify(field.value)}) return;\n`;
            result += text + '\n';
            result += `});`;
            target.blocks.deleteBlock(script, false);
        }
        if (options.beuatifyScripts)
            result = js_beautify(result, options.beuatify);
        target.extensionStorage.sourceCode = result;
        vm.emitWorkspaceUpdate();
    }
    vm.runtime.extensionStorage.hasBeenConverted = true;
});