import { defineMessages } from '@formatjs/intl'

export const messages = defineMessages({
	contextMenuCopy: {
		id: 'main.app.contextMenuCopy',
		defaultMessage: 'Copy',
		description: 'Context menu item label for copying text',
	},
	contextMenuCopyImage: {
		id: 'main.app.contextMenuCopyImage',
		defaultMessage: 'Copy Image',
		description: 'Context menu item label for copying an image',
	},
	contextMenuCopyImageAddress: {
		id: 'main.app.contextMenuCopyImageAddress',
		defaultMessage: 'Copy Image Address',
		description: 'Context menu item label for copying the URL of an image',
	},
	contextMenuCopyLink: {
		id: 'main.app.contextMenuCopyLink',
		defaultMessage: 'Copy Link',
		description: 'Context menu item label for copying a link',
	},
	contextMenuCut: {
		id: 'main.app.contextMenuCut',
		defaultMessage: 'Cut',
		description: 'Context menu item label for cutting text',
	},
	contextMenuInspectElement: {
		id: 'main.app.contextMenuInspectElement',
		defaultMessage: 'Inspect',
		description: 'Context menu item label for inspecting an element',
	},
	contextMenuLearnSpelling: {
		id: 'main.app.contextMenuLearnSpelling',
		defaultMessage: 'Learn Spelling {placeholder}',
		description:
			'Context menu item label for learning the spelling of the selected text',
	},
	contextMenuLookUpSelection: {
		id: 'main.app.contextMenuLookUpSelection',
		defaultMessage: 'Look up {placeholder}',
		description: 'Context menu item label for looking up selected text',
	},
	contextMenuPaste: {
		id: 'main.app.contextMenuPaste',
		defaultMessage: 'Paste',
		description: 'Context menu item label for paste',
	},
	contextMenuSaveImageAs: {
		id: 'main.app.contextMenuSaveImageAs',
		defaultMessage: 'Save Image As…',
		description: 'Context menu item label for saving an image as…',
	},
	contextMenuSelectAll: {
		id: 'main.app.contextMenuSelectAll',
		defaultMessage: 'Select All',
		description: 'Context menu item label for selecting all',
	},
	fatalErrorTitle: {
		id: 'main.app.fatalErrorTitle',
		defaultMessage: 'Fatal Error',
		description: 'Title for error dialog when fatal error in backend occurs.',
	},
	fatalErrorDescriptionGeneric: {
		id: 'main.app.fatalErrorDescriptionGeneric',
		defaultMessage:
			'A fatal error occurred. Close the application and try again.',
		description:
			'Description for error dialog when some error occurs in the backend.',
	},
	fatalErrorDescriptionCoreService: {
		id: 'main.app.fatalErrorDescriptionCoreService',
		defaultMessage: 'Core service stopped unexpectedly.',
		description:
			'Description for error dialog when core service in backend stops.',
	},
})
