import { defineMessages } from 'react-intl'

export const m = defineMessages({
	overview: {
		id: 'screens.PrivacyPolicy.overview',
		defaultMessage:
			'The following explains what information (or “data”) is sent from CoMapeo to the application developer, Awana Digital, and how that information is used.',
	},
	aboutAwana: {
		id: 'screens.PrivacyPolicy.aboutAwana',
		defaultMessage: 'About Awana Digital',
	},
	aboutAwanaContent: {
		id: 'screens.PrivacyPolicy.aboutAwanaContent',
		defaultMessage:
			'CoMapeo is developed by Awana Digital, a 501c3 non-profit organization registered in the United States. Awana Digital works in solidarity with frontline communities to use technology to defend their rights and fight climate change.',
	},
	privacyPolicyTitle: {
		id: 'screens.PrivacyPolicy.privacyPolicyTitle',
		defaultMessage: 'Privacy Policy',
	},
	comapeoPrivacyPolicy: {
		id: 'screens.PrivacyPolicy.comapeoPrivacyPolicy',
		defaultMessage: 'CoMapeo Data Privacy',
	},
	openSource: {
		id: 'screens.PrivacyPolicy.openSource',
		defaultMessage: 'Open Source and the "Official" Version',
	},
	openSourceContent: {
		id: 'screens.PrivacyPolicy.openSourceContent',
		defaultMessage:
			'CoMapeo is an open-source application.\n\nThis means that anyone can view the code that makes the app work and can verify the privacy declarations in this document. It also means that anyone can adapt the app to their own needs and release an alternative version.\n\nThis document refers to data collected by the official releases of CoMapeo, digitally signed by Awana Digital, available from the Google Play Store or the Awana Digital website.\n\nUnofficial releases of CoMapeo obtained from other channels are outside our control and may share additional information with other organizations.',
	},
	privateByDefault: {
		id: 'screens.PrivacyPolicy.privateByDefault',
		defaultMessage: 'Private by default',
	},
	privateByDefaultDescription: {
		id: 'screens.PrivacyPolicy.privateByDefaultDescription',
		defaultMessage:
			"The data you collect and create with CoMapeo (locations, photos, video, audio, text) is only stored on your device by default, and is not stored or sent anywhere else.\n\nWhen you share data with collaborators by joining a project with them, it is sent encrypted, directly to your collaborators' device. This means that the data is not sent via Awana Digital, nor anyone else, on its way to your collaborator.\n\nAwana Digital never sees nor has access to any of the data you collect with CoMapeo unless you explicitly send it to us.",
	},
	noPII: {
		id: 'screens.PrivacyPolicy.noPII',
		defaultMessage: 'No personally identifiable information',
	},
	noPIIDescription: {
		id: 'screens.PrivacyPolicy.noPIIDescription',
		defaultMessage:
			'Using CoMapeo does not require a user account.\n\nAwana Digital does not collect your name, email address or any other personal details.\n\nNo permanent user identifier or device identifier is ever shared with Awana Digital, and we take extra measures to ensure that no information you share can be used to track you: identifiers are randomized and rotated (changed) every month and we do not store IP addresses.',
	},
	control: {
		id: 'screens.PrivacyPolicy.control',
		defaultMessage: "You're in control",
	},
	controlDescription: {
		id: 'screens.PrivacyPolicy.controlDescription',
		defaultMessage:
			'You can opt out of sending any information to Awana Digital.\n\nYou choose where your data is stored and who it is shared with. You may choose to share anonymized, summarized data about how you use CoMapeo with Awana Digital.\n\nWe will always be transparent about what information you choose to share for the purposed of improving the app, and this information will never include photos, videos, audio, text, or precise locations that you have entered into CoMapeo.',
	},
	dataCollection: {
		id: 'screens.PrivacyPolicy.dataCollection',
		defaultMessage: 'CoMapeo Data Collection',
	},
	whatIsCollected: {
		id: 'screens.PrivacyPolicy.whatIsCollected',
		defaultMessage: 'What is collected?',
	},
	whatIsCollectedDescription: {
		id: 'screens.PrivacyPolicy.whatIsCollectedDescription',
		defaultMessage:
			'By default, anonymized diagnostic information about your device, app crashes, errors and performance is shared with Awana Digital.\n\nYou can opt-out of sharing this information at any time. This diagnostic information is completely anonymized and it never contains any of your data (the data you have collected with CoMapeo).',
	},
	diagnosticsTitle: {
		id: 'screens.PrivacyPolicy.diagnosticsTitle',
		defaultMessage: 'Diagnostics',
	},
	crashData: {
		id: 'screens.PrivacyPolicy.crashData',
		defaultMessage: 'Crash Data',
	},
	crashDataDescription: {
		id: 'screens.PrivacyPolicy.crashDataDescription',
		defaultMessage:
			'Information about what caused the app to close unexpectedly',
	},
	appErrors: {
		id: 'screens.PrivacyPolicy.appErrors',
		defaultMessage: 'App Errors',
	},
	appErrorsDescription: {
		id: 'screens.PrivacyPolicy.appErrorsDescription',
		defaultMessage:
			'Information about internal errors that result in the app not functioning as expected',
	},
	performanceData: {
		id: 'screens.PrivacyPolicy.performanceData',
		defaultMessage: 'Performance Data',
	},
	performanceDataDescription: {
		id: 'screens.PrivacyPolicy.performanceDataDescription',
		defaultMessage:
			'Such as launch time, energy usage, app freezes, and responsiveness',
	},
	deviceInfo: {
		id: 'screens.PrivacyPolicy.deviceInfo',
		defaultMessage: 'Device Info',
	},
	deviceInfoDescription: {
		id: 'screens.PrivacyPolicy.deviceInfoDescription',
		defaultMessage:
			'Such as model and manufacturer of your device; device operating system; screen size; device locale (language); device memory.',
	},
	appInfo: {
		id: 'screens.PrivacyPolicy.appInfo',
		defaultMessage: 'App Info',
	},
	appInfoDescription: {
		id: 'screens.PrivacyPolicy.appInfoDescription',
		defaultMessage: 'The version and locale (language) of CoMapeo',
	},
	appUsageTitle: {
		id: 'screens.PrivacyPolicy.appUsageTitle',
		defaultMessage: 'App Usage',
	},
	userCount: {
		id: 'screens.PrivacyPolicy.userCount',
		defaultMessage: 'User Counts',
	},
	userCountDescription: {
		id: 'screens.PrivacyPolicy.userCountDescription',
		defaultMessage:
			'The number of users per country and per project. Aggregated and anonymized',
	},
	whyCollected: {
		id: 'screens.PrivacyPolicy.whyCollected',
		defaultMessage: 'Why is this data collected?',
	},
	whyCollectedDescription: {
		id: 'screens.PrivacyPolicy.whyCollectedDescription',
		defaultMessage:
			'Crash data and app errors together with the device and app info provide Awana Digital with the information we need to fix errors and bugs in the app. The performance data helps us improve the responsiveness of the app and identify errors. User counts, including total users, users per country, and users per project, help justify ongoing investment in the development of CoMapeo.',
	},
	notCollected: {
		id: 'screens.PrivacyPolicy.notCollected',
		defaultMessage: 'What is not collected?',
	},
	notCollectedDescription: {
		id: 'screens.PrivacyPolicy.notCollectedDescription',
		defaultMessage:
			'We do not collect any personal data or anything that can be used to identify or track a user or device. Device identifiers used to aggregate information are random, anonymous, and changed every month.\n\nDiagnostic information does not include data about how you use the app, and it never includes any of the data you have collected with the app. We do not collect your precise or coarse location, only the country where you are using CoMapeo.',
	},
	thirdParty: {
		id: 'screens.PrivacyPolicy.thirdParty',
		defaultMessage: 'Third-party access to data',
	},
	thirdPartyDescription: {
		id: 'screens.PrivacyPolicy.thirdPartyDescription',
		defaultMessage:
			'A "third-party" is an organization other than Awana Digital.',
	},
	permissionsTitle: {
		id: 'screens.OnboardingPrivacyPolicy.permissionsTitle',
		defaultMessage: 'Current Permissions',
	},
})
