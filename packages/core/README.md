# Adobe Experience Platform Vega SDK — Core API Reference

This document lists the public APIs provided by **@adobe/vega-aepcore** for Adobe Experience Platform on **Amazon Vega (Kepler)** React Native applications, with TypeScript-oriented usage samples.

> **IMPORTANT:** Call **`AEPSDK.initialize()`** before calling any other SDK API. Provide a valid **`edge.configId`** (Datastream ID) in `initialize` or **`updateConfiguration`** so Edge-related calls can succeed.

---

## Contents

- [Core APIs](#core-apis)
  - [initialize](#initialize)
  - [updateConfiguration](#updateconfiguration)
  - [setLogLevel](#setloglevel)
  - [getLogLevel](#getloglevel)
  - [version](#version)
- [Edge APIs](#edge-apis)
  - [getExperienceCloudId](#getexperiencecloudid)
  - [sendEvent](#sendevent)
  - [sendEventWithResponse](#sendeventwithresponse)
  - [setConsent](#setconsent)
- [Configuration keys](#configuration-keys)

---

## Core APIs

### initialize

Initializes the SDK. Must be invoked before other SDK APIs.

The optional `options` object can include configuration, log level, and **`extensions`**: an array of **`Extension`** instances to register when the SDK starts (optional; omit if you do not use additional extensions).

#### Syntax

```typescript
interface InitOptions {
  config?: Record<string, unknown>;
  logLevel?: LogLevel;
  extensions?: Array<Extension>;
}

function initialize(options?: InitOptions): Promise<void>;
```

#### Parameters

- **`options`** (optional)
  - **`config`**: Configuration keys — see [Configuration keys](#configuration-keys).
  - **`logLevel`**: Logging level (`LogLevel` enum).
  - **`extensions`**: Array of `Extension` instances to register at startup.

#### Example

```typescript
import { AEPSDK, LogLevel } from '@adobe/vega-aepcore';

await AEPSDK.initialize({
  config: {
    'edge.configId': '<YOUR_DATASTREAM_ID>',
  },
  logLevel: LogLevel.VERBOSE,
});
```

To register optional extensions, pass **`extensions: [yourExtension, ...]`** using `Extension` instances from your integration packages.

---

### updateConfiguration

Updates SDK configuration. If configuration was passed to `initialize`, calling `updateConfiguration` merges/overrides as implemented by the configuration module.

#### Syntax

```typescript
function updateConfiguration(config: Record<string, unknown>): void;
```

#### Example

```typescript
import { AEPSDK } from '@adobe/vega-aepcore';

AEPSDK.updateConfiguration({
  'edge.configId': '<YOUR_DATASTREAM_ID>',
  'edge.domain': '<YOUR_COMPANY_SUBDOMAIN>',
  'consent.default': {
    consents: {
      collect: {
        val: 'p',
      },
    },
  },
});
```

> **NOTE**
> Some APIs require valid configuration before network calls; hits may be queued until `edge.configId` is set.

---

### setLogLevel

Sets the SDK log level.

#### Syntax

```typescript
enum LogLevel {
  ERROR = 0,
  WARNING = 1,
  DEBUG = 2,
  VERBOSE = 3,
}

function setLogLevel(logLevel: LogLevel): void;
```

`LogLevel` is exported from:

```typescript
import { LogLevel } from '@adobe/vega-aepcore';
```

#### Example

```typescript
import { AEPSDK, LogLevel } from '@adobe/vega-aepcore';

AEPSDK.setLogLevel(LogLevel.VERBOSE);
```

---

### getLogLevel

Returns the current log level.

#### Syntax

```typescript
function getLogLevel(): LogLevel;
```

#### Example

```typescript
import { AEPSDK } from '@adobe/vega-aepcore';

const level = AEPSDK.getLogLevel();
```

---

### version

The SDK exposes a string version on the **`AEPSDK`** object (aligned with the core extension version).

#### Syntax

```typescript
// AEPSDK.version is a readonly string on the exported object
```

#### Example

```typescript
import { AEPSDK } from '@adobe/vega-aepcore';

console.log(AEPSDK.version);
```

---

## Edge APIs

### getExperienceCloudId

Returns the Experience Cloud ID (ECID) for the user, or `null` if unavailable.

#### Syntax

```typescript
function getExperienceCloudId(): Promise<string | null>;
```

#### Example (async/await)

```typescript
import { AEPSDK } from '@adobe/vega-aepcore';

const ecid = await AEPSDK.getExperienceCloudId();
if (ecid) {
  // use ecid
}
```

#### Example (then)

```typescript
AEPSDK.getExperienceCloudId().then((ecid) => {
  if (ecid) {
    // use ecid
  }
});
```

---

### sendEvent

Sends an Experience Event to Adobe Experience Edge. Payload should include XDM data as required by your schema.

#### Syntax

```typescript
function sendEvent(event: Record<string, unknown>): void;
```

#### Example

```typescript
import { AEPSDK } from '@adobe/vega-aepcore';

AEPSDK.sendEvent({
  xdm: {
    eventType: 'commerce.orderPlaced',
    commerce: {
      /* ... */
    },
  },
  data: {
    customKey: 'customValue',
  },
});
```

---

### sendEventWithResponse

Sends an event and returns a **Promise** of Edge responses. Invalid payloads may cause the promise to reject — use **try/catch** or **`.catch()`**.

#### Syntax

```typescript
function sendEventWithResponse(
  event: Record<string, unknown>
): Promise<Array<Record<string, unknown>>>;
```

#### Example

```typescript
import { AEPSDK } from '@adobe/vega-aepcore';

try {
  const responses = await AEPSDK.sendEventWithResponse({
    xdm: { eventType: 'example.event' },
    data: { customKey: 'customValue' },
  });
  console.log(JSON.stringify(responses));
} catch (error) {
  console.log('sendEventWithResponse error:', error);
}
```

---

### setConsent

Sends consent preferences to the Edge Network. Use a payload that matches your organization’s consent schema (e.g. Adobe standard 2.0 where applicable).

#### Syntax

```typescript
function setConsent(consent: Record<string, unknown>): void;
```

#### Example

```typescript
import { AEPSDK } from '@adobe/vega-aepcore';

AEPSDK.setConsent({
  consent: [
    {
      standard: 'Adobe',
      version: '2.0',
      value: {
        collect: {
          val: 'y',
        },
        metadata: {
          time: new Date().toISOString(),
        },
      },
    },
  ],
});
```

---

## Configuration keys

Reserved keys for the configuration object passed to **`initialize`** / **`updateConfiguration`**:

| Key | Type | Required | Description |
| --- | --- | --- | --- |
| `edge.configId` | String | **Yes** | Datastream ID. Shown as **Datastream ID** in [Datastream details](https://experienceleague.adobe.com/en/docs/experience-platform/datastreams/configure#view-details). |
| `edge.domain` | String | No | First-party domain mapped to Adobe Edge — see [Edge Network domain configuration](https://developer.adobe.com/client-sdks/edge/edge-network/#domain-configuration). |
| `consent.default` | Object | No | Default consent when user preference is unknown or pending. |

---

## More documentation

- [Adobe Experience Platform Mobile SDKs](https://developer.adobe.com/client-sdks/documentation/)
