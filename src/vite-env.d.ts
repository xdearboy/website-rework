/// <reference types="vite/client" />

declare const __COMMIT_HASH__: string;

declare const __BUILD_DATE__: string;

interface ImportMetaEnv {
  readonly VITE_GALLERY_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
