const manager = Scratch.vm.extensionManager;
export function fixForServ00Rules() {
    for (const id in manager.workerURLs) {
        const url = manager.workerURLs[id];
        if (!/^https?:\/\/godslayerakp\.serv00\.net/.test(url))
            manager.workerURLs[id] = `data:application/javascript,${encodeURIComponent(manager.extUrlCodes[url])}`;
    }
}