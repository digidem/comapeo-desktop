/// <reference types="vite/client" />

declare const __APP_TYPE__:
	| 'development'
	| 'internal'
	| 'release-candidate'
	| 'production'

interface ImportMetaEnv {
	readonly VITE_FEATURE_TEST_DATA_UI?: string
	readonly VITE_MAPBOX_ACCESS_TOKEN?: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
