# Adobe Experience Platform Kepler SDK API Reference

This document lists the APIs provided by AEP Kepler SDK, along with code samples for API usage.

- Core APIs
  - [start](#start)
  - [updateConfiguration](#updateConfiguration)
  - [setLogLevel](#setLogLevel)

## Core APIs

### start

This function initializes the SDK, it needs to be called prior to calling any other SDK functions.

#### Syntax

```typescript
function start(params?: SDKParams): void
```

```typescript
interface SDKParams {
  config?: Map<string, any>;
}
```

#### Example

```typescript
import {AEPSDK} from '@adobe/kepler-aepcore';

AEPSDK.start({
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