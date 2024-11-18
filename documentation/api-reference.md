# Adobe Experience Platform Kepler SDK API Reference

This document lists the APIs provided by AEP Kepler SDK, along with code samples for API usage.

- [Core APIs](#core-apis)
  - [initialize](#initialize)
  - [updateConfiguration](#updateConfiguration)
  - [setLogLevel](#setLogLevel)
- [Edge APIs](#edge-apis)
  - [getExperienceCloudId](#getExperienceCloudId)
  - [sendEvent](#sendEvent)
  - [setConsent](#setConsent)

## Core APIs

### initialize

This function initializes the SDK, it needs to be called prior to calling any other SDK functions.

#### Syntax

```typescript
function initialize(params?: InitOptions): void
```

```typescript
interface InitOptions {
  config?: Record<string, any>;
  logLevel?: LogLevel;
}
```

#### Example

```typescript
import {AEPSDK} from '@adobe/kepler-aepcore';

AEPSDK.initialize({
    config: {
        "edge.configId": "xxx-xxx-xxx"
    }
});
```

---

### updateConfiguration

#### Syntax

```typescript
function updateConfiguration(configuration: Record<string, any>): void
```

#### Example

```typescript
import {AEPSDK} from '@adobe/kepler-aepcore';

AEPSDK.updateConfiguration({
    "edge.configId": "xxx-xxx-xxx"
});
```

---

### setLogLevel

#### Syntax

```typescript
function setLogLevel(logLevel: LogLevel): void
```

```typescript
export enum LogLevel {
  ERROR = 0,
  WARNING = 1,
  DEBUG = 2,
  VERBOSE = 3,
}
```

#### Example

```typescript
import {AEPSDK} from '@adobe/kepler-aepcore';

AEPSDK.setLogLevel(LogLevel.VERBOSE);
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
