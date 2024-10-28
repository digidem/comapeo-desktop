# Service

A "service" is an alias used to describe a background process that's spawned by the main process. This will usually include programs that create their own servers or run indefinite tasks.

These services only have access to Node and do not have access to the Electron APIs. If needed, use the `env` or `execArgv` options when calling `utilityProcess.fork` or set up a communication channel between the main process and the service.
