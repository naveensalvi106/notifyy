/// <reference types="vite/client" />

interface Window {
  electron?: {
    isElectron: boolean;
    onAppUrlOpen: (callback: (url: string) => void) => void;
    openExternal: (url: string) => void;
    saveFile: (data: { content: string; defaultPath: string }) => Promise<boolean>;
  };
}
