import { useState } from 'react'

export function useConfigFileImporter() {
	const [fileName, setFileName] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)

	function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
		setError(null)
		const file = event.target.files?.[0]

		if (!file) {
			setFileName(null)
			return
		}

		if (!file.name.endsWith('.comapeocat')) {
			setError('Invalid file type. Please select a .comapeocat file.')
			setFileName(null)
			return
		}

		setFileName(file.name)
	}

	return {
		handleFileSelect,
		fileName,
		error,
	}
}
