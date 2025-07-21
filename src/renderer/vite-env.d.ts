/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_FEATURE_TEST_DATA_UI: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
