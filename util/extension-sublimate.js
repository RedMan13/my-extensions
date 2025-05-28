const manager = Scratch.vm.extensionManager;
/**
 * Aims to protect me from violating the rules about distributing game content
 */
export function fixForServ00Rules() {
    for (const id in manager.workerURLs) {
        const url = manager.workerURLs[id];
        if (/^https?:\/\/godslayerakp\.serv00\.net/.test(url)) {
            const code = manager.extUrlCodes[url];
            const hash = manager.extensionHashes[url];
            if (!code) continue;
            const newUrl = `data:application/javascript,${encodeURIComponent(code)}`;
            manager.workerURLs[id] = url;
            delete manager.extUrlCodes[url];
            manager.extUrlCodes[newUrl] = code;
            delete manager.extensionHashes[url];
            manager.extensionHashes[newUrl] = hash;
        }
    }
}