# Adobe Experience Platform Kepler SDK API Reference

This document lists the APIs provided by AEP Kepler SDK, along with code samples for API usage.

> Please note that each API also offers TypeScript definitions. The API syntax presented below is in TypeScript.

- [Core APIs](#core-apis)
  - [initialize](#initialize)
  - [updateConfiguration](#updateConfiguration)
  - [setLogLevel](#setLogLevel)
  - [getLogLevel](#getLogLevel)
- [Edge APIs](#edge-apis)
  - [getExperienceCloudId](#getExperienceCloudId)
  - [sendEvent](#sendEvent)
  - [setConsent](#setConsent)

## Core APIs

### initialize

This function initializes the SDK, it needs to be called prior to calling any other SDK APIs.

The optional `options` parameter allows for customizable initialization settings. If `options` object is not provided, the function will proceed with default settings.

#### Syntax

```typescript
interface InitOptions {
  config?: Record<string, any>;
  logLevel?: LogLevel;
}
```

```typescript
function initialize(params?: InitOptions): void
```

- Parameters

  - `options` (optional): An object of type `InitOptions` that can contain the following properties:

    - `config` (optional): A record of key-value pairs for configuration settings.

    - `logLevel` (optional): A value of type `LogLevel` that specifies the logging level.

- Returns

    - `Promise<void>`: A promise that resolves when the initialization process is complete.

#### Example

```typescript
import {AEPSDK} from '@adobe/kepler-aepcore';

AEPSDK.initialize({
    config: {
        "edge.configId": "xxx-xxx-xxx", // required
        "edge.domain": "edgeDomain", // optional
        "consent.default": {"collect": "y"} //optional
    },
    logLevel: LogLevel.VERBOSE
});
```

---

### updateConfiguration

This function updates the SDK configuration with the provided key-value pairs.

If the configuration has alread provided when calling the `initialize` function, calling `updateConfiguration` will override the existing configuration.

#### Syntax

```typescript
function updateConfiguration(configuration: Record<string, any>): void
```

- Parameters

  - `configuration`: A record of key-value pairs for configuration settings.

#### Example

```typescript
import {AEPSDK} from '@adobe/kepler-aepcore';

AEPSDK.updateConfiguration({
    "edge.configId": "xxx-xxx-xxx", // required
    "edge.domain": "edgeDomain", // optional 
    "consent.default": {"collect": "y"} // optional
});
```

---

### setLogLevel

This function sets the logging level for the SDK.

#### Syntax

```typescript
export enum LogLevel {
  ERROR = 0,
  WARNING = 1,
  DEBUG = 2,
  VERBOSE = 3,
}
```

```typescript
function setLogLevel(logLevel: LogLevel): void
```

- Parameters

  - `level`: The desired logging level.

#### Example

```typescript
import {AEPSDK} from '@adobe/kepler-aepcore';

AEPSDK.setLogLevel(LogLevel.VERBOSE);
```

---

### getLogLevel

This function returns the current logging level of the SDK.

#### Syntax

```typescript
getLogLevel(): LogLevel
```

#### Example

```typescript
import {AEPSDK} from '@adobe/kepler-aepcore';

AEPSDK.getLogLevel();
```

---

## Edge APIs

### getExperienceCloudId

#### Syntax
```typescript
getExperienceCloudId(): Promise<String | null>
```

#### Example
```typescript
// Option 1: handle it using then
AEPSDK.getExperienceCloudId().then((ecid) => {
  if (ecid) {
    // handle ecid
  }
});

// Option 2: wait for the promise to resolve
const ecid = await AEPSDK.getExperienceCloudId()
```

### sendEvent

#### Syntax
```typescript
sendEvent(data: Record<string, any>): void
```

#### Example
```typescript
const data = {
  xdm : {
    xdmKey: 'xdmVal'
    },
  data: {
    freeformKey: 'freeformVal'
    }
}

AEPSDK.sendEvent(data);
```

### setConsent

#### Syntax
```typescript
setConsent(data: Record<string, any>): void
```

#### Example

```typescript
const consentData = {
"consent": [
  {
    "standard": "Adobe",
    "version": "2.0",
    "value": {
      "collect": {
        "val": "y",
      },
      "metadata": {
        "time": Date.now(),
      }
    }
  }
]
};

AEPSDK.setConsent(consentData);
```
