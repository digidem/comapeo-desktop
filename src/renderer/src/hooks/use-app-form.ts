import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { createFormHook, createFormHookContexts } from '@tanstack/react-form'

const { fieldContext, formContext } = createFormHookContexts()

const { useAppForm } = createFormHook({
	fieldComponents: {
		TextField,
	},
	formComponents: {
		SubmitButton: Button,
	},
	fieldContext,
	formContext,
})

export { useAppForm }
