/// <reference types="vite/client" />

interface ImportMetaEnv {
    /*readonly MODE: string;
    readonly BASE_URL: string;
    readonly PROD: boolean;
    readonly DEV: boolean;
    readonly SSR: boolean;*/
    // Add your custom env variables here
    readonly VITE_API_URL?: string;
    readonly VITE_NODE_ENV?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
declare module 'mapbox-gl/dist/mapbox-gl.css' {
    const content: unknown;
    export default content;
}
