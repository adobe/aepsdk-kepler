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
  - [sendEventWithResponse](#sendEventWithResponse)
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
function initialize(options?: InitOptions): void
```

- Parameters

  - `options` (optional): An object of type `InitOptions` that can contain the following properties:

    - `config` (optional): A record of key-value pairs for configuration settings. Refer to the [updateConfiguration](#updateConfiguration) API details below for the list of supported keys.

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
        "consent.default": { // optional
          "consents": {
            "collect": {
              "val": "p"
            }
          }
        }
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
function updateConfiguration(config: Record<string, any>): void
```

- Parameters

  - `config`: A record of key-value pairs for configuration settings.


- Reserved keys and sample values for the configuration object.

|   Key  | Value (example) | Required | SDK version
| -------- | ------- | ------- | ------- |
| `edge.configId`  | xxx-xxx-xxx | Y | `1.0.0`|
| `edge.domain` | edgeDomain     | N|`1.0.0`|
| `consent.default`    |  {"consents":{"collect":{"val":"p"}}}   | N|`1.0.0`|

The `edge.configId` value is presented as Datastream ID in the [Datastream details](https://experienceleague.adobe.com/en/docs/experience-platform/datastreams/configure#view-details) page.

The `edge.domain` value is the first-party domain mapped to the Adobe-provisioned Edge Network domain. For more information, see this [documentation](https://developer.adobe.com/client-sdks/edge/edge-network/#domain-configuration).


#### Example

```typescript
import {AEPSDK} from '@adobe/kepler-aepcore';

AEPSDK.updateConfiguration({
    "edge.configId": "xxx-xxx-xxx", // required
    "edge.domain": "edgeDomain", // optional
    "consent.default": { // optional
      "consents": {
        "collect": {
          "val": "p"
        }
      }
    }
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

  - `logLevel`: The desired logging level.

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

### sendEventWithResponse

#### Syntax
```typescript
sendEventWithResponse(data: Record<string, unknown>): Promise<Array<Record<string, unknown>>>;
```

#### Example
```typescript
 AEPSDK.sendEventWithResponse({
      xdm: {
        xdmKey: 'xdmVal',
      },
      data: {
        freeformKey: 'freeformVal',
      }
    })
      .then((sendEventResponse: Array<Record<string, unknown>>) => {
        // Handle success
        sendEventResponseJson = JSON.stringify(sendEventResponse)
        console.log(`SendEventWithResponse Success: ${sendEventResponseJson}`);
      })
      .catch((error: string) => {
        // Handle error
        console.log(`SendEventWithResponse Error: ${error}`);
      });

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
