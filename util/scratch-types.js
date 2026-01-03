/**
 * the type defs here are system specific, as they reference with the expectation of
 * git-repos
 * |-PenguinMod
 * | |-PenguinMod-Render
 * | \-PenguinMod-Vm
 * \-RedMan13
 *   \-my-extensions
 * being your folder layout
 */
/** @type {import('../../../PenguinMod/PenguinMod-Vm/src/extension-support/tw-extension-api-common.js').ArgumentType} */
export const ArgumentType = Scratch.ArgumentType
/** @type {import('../../../PenguinMod/PenguinMod-Vm/src/extension-support/tw-extension-api-common.js').ArgumentAlignment} */
export const ArgumentAlignment = Scratch.ArgumentAlignment
/** @type {import('../../../PenguinMod/PenguinMod-Vm/src/extension-support/tw-extension-api-common.js').BlockType} */
export const BlockType = Scratch.BlockType
/** @type {import('../../../PenguinMod/PenguinMod-Vm/src/extension-support/tw-extension-api-common.js').BlockShape} */
export const BlockShape = Scratch.BlockShape
/** @type {import('../../../PenguinMod/PenguinMod-Vm/src/extension-support/tw-extension-api-common.js').TargetType} */
export const TargetType = Scratch.TargetType
/** @type {import('../../../PenguinMod/PenguinMod-Vm/src/extension-support/tw-extension-api-common.js').Cast} */
export const Cast = Scratch.Cast
/** @type {import('../../../PenguinMod/PenguinMod-Vm/src/extension-support/tw-extension-api-common.js').Clone} */
export const Clone = Scratch.Clone
/** @type {import('../../../PenguinMod/PenguinMod-Vm/src/extension-support/tw-extension-api-common.js').Color} */
export const Color = Scratch.Color
/** @type {{ unsandboxed: boolean, isPenguinMod: boolean, register: (ext: object) => void }} */
export const extensions = Scratch.extensions
/** @type {import('../../../PenguinMod/PenguinMod-Vm/src/virtual-machine.js')} */
export const vm = Scratch.vm
/** @type {import('../../../PenguinMod/PenguinMod-Render/src/RenderWebGL.js')} */
export const renderer = Scratch.renderer
/** @type {(url: string) => Promise<boolean>} */
export const canFetch = Scratch.canFetch
/** @type {(url: string) => Promise<boolean>} */
export const canOpenWindow = Scratch.canOpenWindow
/** @type {(url: string) => Promise<boolean>} */
export const canRedirect = Scratch.canRedirect
/** @type {(url: string, options: RequestInit) => Promise<Response>} */
export const fetch = Scratch.fetch
/** @type {(url: string, features: string) => Promise<WindowProxy|null>} */
export const openWindow = Scratch.openWindow
/** @type {(url: string) => Promise} */
export const redirect = Scratch.redirect
/** @type {() => Promise<boolean>} */
export const canRecordAudio = Scratch.canRecordAudio
/** @type {() => Promise<boolean>} */
export const canRecordVideo = Scratch.canRecordVideo
/** @type {() => Promise<boolean>} */
export const canReadClipboard = Scratch.canReadClipboard
/** @type {() => Promise<boolean>} */
export const canNotify = Scratch.canNotify
/** @type {() => Promise<boolean>} */
export const canGeolocate = Scratch.canGeolocate
/** @type {(url: string) => Promise<boolean>} */
export const canEmbed = Scratch.canEmbed
/** @type {() => Promise<boolean>} */
export const canUnsandbox = Scratch.canUnsandbox
/** @type {() => Promise<boolean>} */
export const canScreenshotCamera = Scratch.canScreenshotCamera
/** @type {(url: string, name: string) => Promise<boolean>} */
export const canDownload = Scratch.canDownload
/** @type {(url: string, name: string) => Promise} */
export const download = Scratch.download
/** @type {(message: string, args: object) => void} Keep in mind setup and language exist */
export const translate = Scratch.translate
/** @type {{ getBlockly: () => Promise<any>, getBlocklyEagerly: () => Promise<any> }} */
export const gui = Scratch.gui