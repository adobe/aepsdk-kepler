# Adobe Experience Platform Vega SDK API Reference

This document lists the APIs provided by AEP Vega SDK, along with code samples for API usage.


> **IMPORTANT:**
> Refer to [Getting started page](./getting-started.md) before to get familiar with initial setup.

> **NOTE:**
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
- [Media APIs](#media-apis)
  - [Register Media Extension](#register-media-extension)
  - [createMediaSession](#createMediaSession)
  - [sendMediaEvent](#sendMediaEvent)

## Core APIs

### initialize

This function initializes the SDK, it needs to be called prior to calling any other SDK APIs.

The optional `options` parameter allows for customizable initialization settings. If `options` object is not provided, the function will proceed with default settings.

#### Syntax

```typescript
interface InitOptions {
  config?: Record<string, any>;
  logLevel?: LogLevel;
  extensions?: Array<Extension>;
}
```

```typescript
function initialize(options?: InitOptions): void
```

- Parameters

  - `options` (optional): An object of type `InitOptions` that can contain the following properties:

    - `config` (optional): A record of key-value pairs for configuration settings. Refer to the [updateConfiguration](#updateConfiguration) API details below for the list of supported keys.

    - `logLevel` (optional): A value of type `LogLevel` that specifies the logging level.

    - `extensions` (optional): An array of extensions to be registered with the SDK.

- Returns

    - `Promise<void>`: A promise that resolves when the initialization process is complete.


#### Example

```typescript
import {AEPSDK} from '@adobe/vega-aepcore';
import { LogLevel } from '@adobe/vega-aepcore/dist/core/services';
```

```typescript
AEPSDK.initialize({
    config: {
      "edge.configId": "<YOUR_DATASTREAM_ID>"
    },
    logLevel: LogLevel.VERBOSE,
    extensions: [Media.EXTENSION]
});
```

> **NOTE: **
> Refer to the [Configuration](#configuration) section to learn more about all the available configuration keys
---

### updateConfiguration

This function updates the SDK configuration with the provided key-value pairs.

If the configuration was provided when calling the `initialize` function, calling `updateConfiguration` will override the existing configuration.

#### Syntax

```typescript
function updateConfiguration(config: Record<string, any>): void
```

- Parameters

  - `config`: A record of key-value pairs for configuration settings.


#### Example

```typescript
import {AEPSDK} from '@adobe/vega-aepcore';

AEPSDK.updateConfiguration({
    "edge.configId": "<YOUR_DATASTREAM_ID>", // required
    "edge.domain": "<YOUR_COMPANY_NAME.ABC>", // optional
    "consent.default": { // optional
      "consents": {
        "collect": {
          "val": "p"
        }
      }
    }
});
```

> **NOTE:**
> Refer to the [Configuration](#configuration) section to learn more about all the available configuration keys

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
import {AEPSDK} from '@adobe/vega-aepcore';

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
import {AEPSDK} from '@adobe/vega-aepcore';

AEPSDK.getLogLevel();
```

---

## Edge APIs

### getExperienceCloudId

#### Syntax
```typescript
getExperienceCloudId(): Promise<String | null>
```

#### Example using then
```typescript
// Option 1: handle it using then
AEPSDK.getExperienceCloudId().then((ecid) => {
  if (ecid) {
    // handle ecid
  }
});
```

### Example using await
```typescript
// Option 2: wait for the promise to resolve
const ecid = await AEPSDK.getExperienceCloudId()
```

### sendEvent

#### Syntax
```typescript
sendEvent(data: Record<string, any>): void
```
> **Note**
> SendEvent now supports datasream overrides. To Learn more about how to override datastream Id and/or datastream configuration refer [Sending Datastream overrides using sendEvent API](Tutorials/send-overrides-sendevent.md)

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

> **IMPORTANT**
> Promise returned by SendEventWithResponse might throw errors in case of invalid data, so be sure to catch and handle error as shown in the sample.

#### Example with then
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

#### Example with await
```typescript
const sendEventResponse = await AEPSDK.sendEventWithResponse({
      xdm: {
        xdmKey: 'xdmVal',
      },
      data: {
        freeformKey: 'freeformVal',
      }
    })
      .catch((error: string) => {
        // Handle error
        console.log(`SendEventWithResponse Error: ${error}`);
      });

sendEventResponseJson = JSON.stringify(sendEventResponse)

console.log(`SendEventWithResponse Success: ${sendEventResponseJson}`);
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

## Configuration Keys

Reserved keys and their description for the configuration object.

|   Key  | Value Type | Required | Description |
| -------- | ------- | ------- | ------- |
| `edge.configId`  | String | Yes | Datastream ID to send the data to. The value is presented as Datastream ID in the [Datastream details](https://experienceleague.adobe.com/en/docs/experience-platform/datastreams/configure#view-details). |
| `edge.domain` | String     | No| Custom domain to be used to send the edge request to. The value is the first-party domain mapped to the Adobe-provisioned Edge Network domain. For more information, see this [documentation](https://developer.adobe.com/client-sdks/edge/edge-network/#domain-configuration).  |
| `consent.default` |  Map   | No | Default consent to be used when consent is unknown or pending. Typically used with value when waiting for consent preferences from the end user. |

## Media APIs

### Register Media Extension

Register the Media Extension while initializing the SDK. Refer [initialize](#initialize) for more details.

### createMediaSession

> [!NOTE]
> SessionStart API requires [sessionDetails](https://github.com/adobe/xdm/blob/master/docs/reference/datatypes/sessiondetails.schema.md) fieldgroup with all the required fields present in the request payload.

> [!IMPORTANT]
> Only one media session can be active at a time. If you call `createMediaSession` while a media session is already active, an error will be thrown. To start a new media session, you must first end the existing session by using the `media.sessionComplete` or `media.sessionEnd` event through the [sendMediaEvent](#sendMediaEvent) API.

#### Syntax
```typescript
createMediaSession(data: Record<string, unknown>): void
```

#### Example
```typescript
const mediaStartData = {
  "xdm": {
      "eventType": "media.sessionStart",
      "mediaCollection": {
        "playhead": 0,
        "sessionDetails": {
          "streamType": "video",
          "friendlyName": "Name of the media",
          "hasResume": false,
          "name": "CONTENT_ID",
          "length": 100,
          "contentType": "vod",
          "channel": "SampleChannel",
          "playerName": "SamplePlayer"
        }
      }
  }
}

AEPSDK.createMediaSession(mediaStartData);
```

### sendMediaEvent

> [!IMPORTANT]
> Media session needs to be active before using `sendMediaEvent` API. Use `createMediaSession` API to create the session.

About the XDM data structure, please refer to the [Media Edge API Documentation](https://experienceleague.adobe.com/docs/experience-platform/edge-network-server-api/media-edge-apis/getting-started.html?lang=en).

> [!IMPORTANT]
> Ensure that the `media.ping` event is sent at least once every second with the latest playhead value during the video playback. AEP Roku SDK relies on these pings to function properly.

#### Syntax
```typescript
sendMediaEvent(data: Record<string, unknown>): void
```

#### Example
```typescript
const playData = {
  "xdm": {
    "eventType": "media.play",
    "mediaCollection": {
      "playhead": <currentPlayheadValue>,
    }
  }
}

AEPSDK.sendMediaEvent(playData);
```
