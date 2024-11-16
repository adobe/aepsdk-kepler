# Adobe Experience Platform Kepler SDK API Reference

This document lists the APIs provided by AEP Kepler SDK, along with code samples for API usage.

- Core APIs
  - [initialize](#initialize)
  - [updateConfiguration](#updateConfiguration)
  - [setLogLevel](#setLogLevel)

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