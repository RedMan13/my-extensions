import AddIcon from "./icon-add.svg";
import { extensions } from "../../util/scratch-types";

/** @type {HTMLDialogElement} */
const docsDialog = <dialog class="settings-dialog" theme={document.body.getAttribute('theme')}>
    <div class="dialog-banner">
        <span>{"Documentation"}</span>
        <button on:click={() => docsDialog.close()} class="dialog-cancel">
            <img src={AddIcon}></img>
        </button>
    </div>
    <iframe
        class="dialog-body"
        src={extensions.isPenguinMod ? 'https://studio.penguinmod.com/PenguinMod-Vm/docs/' : 'https://turbowarp.github.io/scratch-vm/docs/'}
        style="padding: 0; width: 100%; height: 100vh"
    ></iframe>
</dialog>;
document.body.appendChild(docsDialog);

export function openDocumentation(page) {
    docsDialog.showModal();
    // something about setting the page content to be a certain thing here
}