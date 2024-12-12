/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

import { createFileRoute } from '@tanstack/react-router'

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as WelcomeImport } from './routes/Welcome'
import { Route as IndexImport } from './routes/index'
import { Route as OnboardingIndexImport } from './routes/Onboarding/index'
import { Route as OnboardingPrivacyPolicyScreenImport } from './routes/Onboarding/PrivacyPolicyScreen'
import { Route as OnboardingJoinProjectScreenImport } from './routes/Onboarding/JoinProjectScreen'
import { Route as OnboardingDeviceNamingScreenImport } from './routes/Onboarding/DeviceNamingScreen'
import { Route as OnboardingDataPrivacyImport } from './routes/Onboarding/DataPrivacy'
import { Route as OnboardingCreateProjectScreenImport } from './routes/Onboarding/CreateProjectScreen'
import { Route as OnboardingCreateJoinProjectScreenImport } from './routes/Onboarding/CreateJoinProjectScreen'
import { Route as MapTabsMapImport } from './routes/(MapTabs)/_Map'
import { Route as MapTabsMapTab2Import } from './routes/(MapTabs)/_Map.tab2'
import { Route as MapTabsMapTab1Import } from './routes/(MapTabs)/_Map.tab1'

// Create Virtual Routes

const MapTabsImport = createFileRoute('/(MapTabs)')()

// Create/Update Routes

const MapTabsRoute = MapTabsImport.update({
  id: '/(MapTabs)',
  getParentRoute: () => rootRoute,
} as any)

const WelcomeRoute = WelcomeImport.update({
  id: '/Welcome',
  path: '/Welcome',
  getParentRoute: () => rootRoute,
} as any)

const IndexRoute = IndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const OnboardingIndexRoute = OnboardingIndexImport.update({
  id: '/Onboarding/',
  path: '/Onboarding/',
  getParentRoute: () => rootRoute,
} as any)

const OnboardingPrivacyPolicyScreenRoute =
  OnboardingPrivacyPolicyScreenImport.update({
    id: '/Onboarding/PrivacyPolicyScreen',
    path: '/Onboarding/PrivacyPolicyScreen',
    getParentRoute: () => rootRoute,
  } as any)

const OnboardingJoinProjectScreenRoute =
  OnboardingJoinProjectScreenImport.update({
    id: '/Onboarding/JoinProjectScreen',
    path: '/Onboarding/JoinProjectScreen',
    getParentRoute: () => rootRoute,
  } as any)

const OnboardingDeviceNamingScreenRoute =
  OnboardingDeviceNamingScreenImport.update({
    id: '/Onboarding/DeviceNamingScreen',
    path: '/Onboarding/DeviceNamingScreen',
    getParentRoute: () => rootRoute,
  } as any)

const OnboardingDataPrivacyRoute = OnboardingDataPrivacyImport.update({
  id: '/Onboarding/DataPrivacy',
  path: '/Onboarding/DataPrivacy',
  getParentRoute: () => rootRoute,
} as any)

const OnboardingCreateProjectScreenRoute =
  OnboardingCreateProjectScreenImport.update({
    id: '/Onboarding/CreateProjectScreen',
    path: '/Onboarding/CreateProjectScreen',
    getParentRoute: () => rootRoute,
  } as any)

const OnboardingCreateJoinProjectScreenRoute =
  OnboardingCreateJoinProjectScreenImport.update({
    id: '/Onboarding/CreateJoinProjectScreen',
    path: '/Onboarding/CreateJoinProjectScreen',
    getParentRoute: () => rootRoute,
  } as any)

const MapTabsMapRoute = MapTabsMapImport.update({
  id: '/_Map',
  getParentRoute: () => MapTabsRoute,
} as any)

const MapTabsMapTab2Route = MapTabsMapTab2Import.update({
  id: '/tab2',
  path: '/tab2',
  getParentRoute: () => MapTabsMapRoute,
} as any)

const MapTabsMapTab1Route = MapTabsMapTab1Import.update({
  id: '/tab1',
  path: '/tab1',
  getParentRoute: () => MapTabsMapRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/Welcome': {
      id: '/Welcome'
      path: '/Welcome'
      fullPath: '/Welcome'
      preLoaderRoute: typeof WelcomeImport
      parentRoute: typeof rootRoute
    }
    '/(MapTabs)': {
      id: '/(MapTabs)'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof MapTabsImport
      parentRoute: typeof rootRoute
    }
    '/(MapTabs)/_Map': {
      id: '/(MapTabs)/_Map'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof MapTabsMapImport
      parentRoute: typeof MapTabsRoute
    }
    '/Onboarding/CreateJoinProjectScreen': {
      id: '/Onboarding/CreateJoinProjectScreen'
      path: '/Onboarding/CreateJoinProjectScreen'
      fullPath: '/Onboarding/CreateJoinProjectScreen'
      preLoaderRoute: typeof OnboardingCreateJoinProjectScreenImport
      parentRoute: typeof rootRoute
    }
    '/Onboarding/CreateProjectScreen': {
      id: '/Onboarding/CreateProjectScreen'
      path: '/Onboarding/CreateProjectScreen'
      fullPath: '/Onboarding/CreateProjectScreen'
      preLoaderRoute: typeof OnboardingCreateProjectScreenImport
      parentRoute: typeof rootRoute
    }
    '/Onboarding/DataPrivacy': {
      id: '/Onboarding/DataPrivacy'
      path: '/Onboarding/DataPrivacy'
      fullPath: '/Onboarding/DataPrivacy'
      preLoaderRoute: typeof OnboardingDataPrivacyImport
      parentRoute: typeof rootRoute
    }
    '/Onboarding/DeviceNamingScreen': {
      id: '/Onboarding/DeviceNamingScreen'
      path: '/Onboarding/DeviceNamingScreen'
      fullPath: '/Onboarding/DeviceNamingScreen'
      preLoaderRoute: typeof OnboardingDeviceNamingScreenImport
      parentRoute: typeof rootRoute
    }
    '/Onboarding/JoinProjectScreen': {
      id: '/Onboarding/JoinProjectScreen'
      path: '/Onboarding/JoinProjectScreen'
      fullPath: '/Onboarding/JoinProjectScreen'
      preLoaderRoute: typeof OnboardingJoinProjectScreenImport
      parentRoute: typeof rootRoute
    }
    '/Onboarding/PrivacyPolicyScreen': {
      id: '/Onboarding/PrivacyPolicyScreen'
      path: '/Onboarding/PrivacyPolicyScreen'
      fullPath: '/Onboarding/PrivacyPolicyScreen'
      preLoaderRoute: typeof OnboardingPrivacyPolicyScreenImport
      parentRoute: typeof rootRoute
    }
    '/Onboarding/': {
      id: '/Onboarding/'
      path: '/Onboarding'
      fullPath: '/Onboarding'
      preLoaderRoute: typeof OnboardingIndexImport
      parentRoute: typeof rootRoute
    }
    '/(MapTabs)/_Map/tab1': {
      id: '/(MapTabs)/_Map/tab1'
      path: '/tab1'
      fullPath: '/tab1'
      preLoaderRoute: typeof MapTabsMapTab1Import
      parentRoute: typeof MapTabsMapImport
    }
    '/(MapTabs)/_Map/tab2': {
      id: '/(MapTabs)/_Map/tab2'
      path: '/tab2'
      fullPath: '/tab2'
      preLoaderRoute: typeof MapTabsMapTab2Import
      parentRoute: typeof MapTabsMapImport
    }
  }
}

// Create and export the route tree

interface MapTabsMapRouteChildren {
  MapTabsMapTab1Route: typeof MapTabsMapTab1Route
  MapTabsMapTab2Route: typeof MapTabsMapTab2Route
}

const MapTabsMapRouteChildren: MapTabsMapRouteChildren = {
  MapTabsMapTab1Route: MapTabsMapTab1Route,
  MapTabsMapTab2Route: MapTabsMapTab2Route,
}

const MapTabsMapRouteWithChildren = MapTabsMapRoute._addFileChildren(
  MapTabsMapRouteChildren,
)

interface MapTabsRouteChildren {
  MapTabsMapRoute: typeof MapTabsMapRouteWithChildren
}

const MapTabsRouteChildren: MapTabsRouteChildren = {
  MapTabsMapRoute: MapTabsMapRouteWithChildren,
}

const MapTabsRouteWithChildren =
  MapTabsRoute._addFileChildren(MapTabsRouteChildren)

export interface FileRoutesByFullPath {
  '/': typeof MapTabsMapRouteWithChildren
  '/Welcome': typeof WelcomeRoute
  '/Onboarding/CreateJoinProjectScreen': typeof OnboardingCreateJoinProjectScreenRoute
  '/Onboarding/CreateProjectScreen': typeof OnboardingCreateProjectScreenRoute
  '/Onboarding/DataPrivacy': typeof OnboardingDataPrivacyRoute
  '/Onboarding/DeviceNamingScreen': typeof OnboardingDeviceNamingScreenRoute
  '/Onboarding/JoinProjectScreen': typeof OnboardingJoinProjectScreenRoute
  '/Onboarding/PrivacyPolicyScreen': typeof OnboardingPrivacyPolicyScreenRoute
  '/Onboarding': typeof OnboardingIndexRoute
  '/tab1': typeof MapTabsMapTab1Route
  '/tab2': typeof MapTabsMapTab2Route
}

export interface FileRoutesByTo {
  '/': typeof MapTabsMapRouteWithChildren
  '/Welcome': typeof WelcomeRoute
  '/Onboarding/CreateJoinProjectScreen': typeof OnboardingCreateJoinProjectScreenRoute
  '/Onboarding/CreateProjectScreen': typeof OnboardingCreateProjectScreenRoute
  '/Onboarding/DataPrivacy': typeof OnboardingDataPrivacyRoute
  '/Onboarding/DeviceNamingScreen': typeof OnboardingDeviceNamingScreenRoute
  '/Onboarding/JoinProjectScreen': typeof OnboardingJoinProjectScreenRoute
  '/Onboarding/PrivacyPolicyScreen': typeof OnboardingPrivacyPolicyScreenRoute
  '/Onboarding': typeof OnboardingIndexRoute
  '/tab1': typeof MapTabsMapTab1Route
  '/tab2': typeof MapTabsMapTab2Route
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/Welcome': typeof WelcomeRoute
  '/(MapTabs)': typeof MapTabsRouteWithChildren
  '/(MapTabs)/_Map': typeof MapTabsMapRouteWithChildren
  '/Onboarding/CreateJoinProjectScreen': typeof OnboardingCreateJoinProjectScreenRoute
  '/Onboarding/CreateProjectScreen': typeof OnboardingCreateProjectScreenRoute
  '/Onboarding/DataPrivacy': typeof OnboardingDataPrivacyRoute
  '/Onboarding/DeviceNamingScreen': typeof OnboardingDeviceNamingScreenRoute
  '/Onboarding/JoinProjectScreen': typeof OnboardingJoinProjectScreenRoute
  '/Onboarding/PrivacyPolicyScreen': typeof OnboardingPrivacyPolicyScreenRoute
  '/Onboarding/': typeof OnboardingIndexRoute
  '/(MapTabs)/_Map/tab1': typeof MapTabsMapTab1Route
  '/(MapTabs)/_Map/tab2': typeof MapTabsMapTab2Route
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | '/Welcome'
    | '/Onboarding/CreateJoinProjectScreen'
    | '/Onboarding/CreateProjectScreen'
    | '/Onboarding/DataPrivacy'
    | '/Onboarding/DeviceNamingScreen'
    | '/Onboarding/JoinProjectScreen'
    | '/Onboarding/PrivacyPolicyScreen'
    | '/Onboarding'
    | '/tab1'
    | '/tab2'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/'
    | '/Welcome'
    | '/Onboarding/CreateJoinProjectScreen'
    | '/Onboarding/CreateProjectScreen'
    | '/Onboarding/DataPrivacy'
    | '/Onboarding/DeviceNamingScreen'
    | '/Onboarding/JoinProjectScreen'
    | '/Onboarding/PrivacyPolicyScreen'
    | '/Onboarding'
    | '/tab1'
    | '/tab2'
  id:
    | '__root__'
    | '/'
    | '/Welcome'
    | '/(MapTabs)'
    | '/(MapTabs)/_Map'
    | '/Onboarding/CreateJoinProjectScreen'
    | '/Onboarding/CreateProjectScreen'
    | '/Onboarding/DataPrivacy'
    | '/Onboarding/DeviceNamingScreen'
    | '/Onboarding/JoinProjectScreen'
    | '/Onboarding/PrivacyPolicyScreen'
    | '/Onboarding/'
    | '/(MapTabs)/_Map/tab1'
    | '/(MapTabs)/_Map/tab2'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  WelcomeRoute: typeof WelcomeRoute
  MapTabsRoute: typeof MapTabsRouteWithChildren
  OnboardingCreateJoinProjectScreenRoute: typeof OnboardingCreateJoinProjectScreenRoute
  OnboardingCreateProjectScreenRoute: typeof OnboardingCreateProjectScreenRoute
  OnboardingDataPrivacyRoute: typeof OnboardingDataPrivacyRoute
  OnboardingDeviceNamingScreenRoute: typeof OnboardingDeviceNamingScreenRoute
  OnboardingJoinProjectScreenRoute: typeof OnboardingJoinProjectScreenRoute
  OnboardingPrivacyPolicyScreenRoute: typeof OnboardingPrivacyPolicyScreenRoute
  OnboardingIndexRoute: typeof OnboardingIndexRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  WelcomeRoute: WelcomeRoute,
  MapTabsRoute: MapTabsRouteWithChildren,
  OnboardingCreateJoinProjectScreenRoute:
    OnboardingCreateJoinProjectScreenRoute,
  OnboardingCreateProjectScreenRoute: OnboardingCreateProjectScreenRoute,
  OnboardingDataPrivacyRoute: OnboardingDataPrivacyRoute,
  OnboardingDeviceNamingScreenRoute: OnboardingDeviceNamingScreenRoute,
  OnboardingJoinProjectScreenRoute: OnboardingJoinProjectScreenRoute,
  OnboardingPrivacyPolicyScreenRoute: OnboardingPrivacyPolicyScreenRoute,
  OnboardingIndexRoute: OnboardingIndexRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/Welcome",
        "/(MapTabs)",
        "/Onboarding/CreateJoinProjectScreen",
        "/Onboarding/CreateProjectScreen",
        "/Onboarding/DataPrivacy",
        "/Onboarding/DeviceNamingScreen",
        "/Onboarding/JoinProjectScreen",
        "/Onboarding/PrivacyPolicyScreen",
        "/Onboarding/"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/Welcome": {
      "filePath": "Welcome.tsx"
    },
    "/(MapTabs)": {
      "filePath": "(MapTabs)",
      "children": [
        "/(MapTabs)/_Map"
      ]
    },
    "/(MapTabs)/_Map": {
      "filePath": "(MapTabs)/_Map.tsx",
      "parent": "/(MapTabs)",
      "children": [
        "/(MapTabs)/_Map/tab1",
        "/(MapTabs)/_Map/tab2"
      ]
    },
    "/Onboarding/CreateJoinProjectScreen": {
      "filePath": "Onboarding/CreateJoinProjectScreen.tsx"
    },
    "/Onboarding/CreateProjectScreen": {
      "filePath": "Onboarding/CreateProjectScreen.tsx"
    },
    "/Onboarding/DataPrivacy": {
      "filePath": "Onboarding/DataPrivacy.tsx"
    },
    "/Onboarding/DeviceNamingScreen": {
      "filePath": "Onboarding/DeviceNamingScreen.tsx"
    },
    "/Onboarding/JoinProjectScreen": {
      "filePath": "Onboarding/JoinProjectScreen.tsx"
    },
    "/Onboarding/PrivacyPolicyScreen": {
      "filePath": "Onboarding/PrivacyPolicyScreen.tsx"
    },
    "/Onboarding/": {
      "filePath": "Onboarding/index.tsx"
    },
    "/(MapTabs)/_Map/tab1": {
      "filePath": "(MapTabs)/_Map.tab1.tsx",
      "parent": "/(MapTabs)/_Map"
    },
    "/(MapTabs)/_Map/tab2": {
      "filePath": "(MapTabs)/_Map.tab2.tsx",
      "parent": "/(MapTabs)/_Map"
    }
  }
}
ROUTE_MANIFEST_END */
