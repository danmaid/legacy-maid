console.log('preload')
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
    save: async (data: any) => ipcRenderer.invoke('save', data),
    load: async () => ipcRenderer.invoke('load')
})

export interface ElectronApi {
    save: (data: any) => Promise<void>;
    load: () => Promise<any>;
}