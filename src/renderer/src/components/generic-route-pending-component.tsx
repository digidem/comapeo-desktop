import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

export function GenericRoutePendingComponent() {
	return (
		<Box
			display="flex"
			flex={1}
			flexDirection="column"
			justifyContent="center"
			alignItems="center"
			height="100%"
		>
			<CircularProgress />
		</Box>
	)
}
