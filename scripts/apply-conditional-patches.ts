// Workaround for patch-package's inability to handle conditionally installed modules.
// See https://github.com/ds300/patch-package/issues/339 and https://github.com/ds300/patch-package/issues/619

import { spawnSync } from 'node:child_process'

let patchDir: string | undefined

switch (process.platform) {
	case 'linux': {
		patchDir = './patches-linux'
		break
	}
}

if (!patchDir) {
	console.log('Skipping application of conditional patches')
	process.exit(0)
}

const r = spawnSync('npx', ['patch-package', '--patch-dir', patchDir], {
	stdio: 'inherit',
	shell: process.platform === 'win32',
})

process.exit(r.status ?? 1)
