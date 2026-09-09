# Adobe Experience Platform Vega SDK — Media API Reference

This document describes the public APIs provided by **@adobe/vega-aepmedia** (Adobe Experience Platform Media Analytics) for **Amazon Vega (Kepler)** React Native apps. The Media package depends on **@adobe/vega-aepcore** and registers a Media extension that works with the core SDK’s event hub and Edge pipeline.

> **IMPORTANT**
> - Initialize **@adobe/vega-aepcore** with **`Media.EXTENSION`** before using media APIs.
> - A **media session** must be started with **`createMediaSession`** before **`sendMediaEvent`**.

---

## Contents

- [Installation](#installation)
- [Register the Media extension](#register-the-media-extension)
- [Media APIs](#media-apis)
  - [Media.EXTENSION](#mediaextension)
  - [createMediaSession](#createmediasession)
  - [sendMediaEvent](#sendmediaevent)
- [Session and playback notes](#session-and-playback-notes)
- [Further reading](#further-reading)

---

## Installation

Add the core and media packages to your app (versions should stay aligned per your release):

```bash
yarn add @adobe/vega-aepcore @adobe/vega-aepmedia
```

---

## Register the Media extension

Pass **`Media.EXTENSION`** in the **`extensions`** array when calling **`AEPSDK.initialize`** from **`@adobe/vega-aepcore`**.

#### Example

```typescript
import { AEPSDK, LogLevel } from '@adobe/vega-aepcore';
import { Media } from '@adobe/vega-aepmedia';

await AEPSDK.initialize({
  config: {
    'edge.configId': '<YOUR_DATASTREAM_ID>',
  },
  logLevel: LogLevel.VERBOSE,
  extensions: [Media.EXTENSION],
});
```

---

## Media APIs

### Media.EXTENSION

The **`Extension`** instance used to register the Media component with the core SDK. Pass it only to **`AEPSDK.initialize({ extensions: [...] })`**.

#### Syntax

```typescript
readonly EXTENSION: Extension;
```

---

### createMediaSession

Creates a new media session using XDM data whose event type is **`media.sessionStart`**. Invalid or incomplete XDM may be rejected internally (check SDK logs).

The implementation validates XDM via **`MediaAPIHelper`**, assigns a default **`playerId`**, and dispatches a **`createMediaSession`** event on the core event hub.

#### Syntax

```typescript
createMediaSession(data: Record<string, unknown>): void;
```

#### Parameters

- **`data`**: Object containing XDM for **`media.sessionStart`**, typically including **`mediaCollection`** with **`sessionDetails`**. Session start flows are described in Adobe’s Media Edge documentation (see [Further reading](#further-reading)).

> **NOTE**
> **`sessionDetails`** must satisfy the [session details](https://github.com/adobe/xdm/blob/master/docs/reference/datatypes/sessiondetails.schema.md) field group requirements for your implementation.

#### Example

```typescript
import { Media } from '@adobe/vega-aepmedia';

const sessionStartXDM = {
  xdm: {
    eventType: 'media.sessionStart',
    mediaCollection: {
      playhead: 0,
      sessionDetails: {
        streamType: 'video',
        friendlyName: 'Name of the media',
        hasResume: false,
        name: 'CONTENT_ID',
        length: 100,
        contentType: 'vod',
        channel: 'SampleChannel',
        playerName: 'SamplePlayer',
      },
    },
  },
};

Media.createMediaSession(sessionStartXDM);
```

---

### sendMediaEvent

Sends a media lifecycle or analytics event (play, pause, ping, ad events, session end, etc.) for the **active** session. **`createMediaSession`** must have been called successfully first.

#### Syntax

```typescript
sendMediaEvent(data: Record<string, unknown>): void;
```

#### Parameters

- **`data`**: XDM payload for the event (e.g. **`eventType`**: **`media.play`**, **`media.ping`**, **`media.sessionEnd`**, …) with **`mediaCollection`** including **`playhead`** where required by the event type.

#### Example — `media.play`

```typescript
import { Media } from '@adobe/vega-aepmedia';

const playhead = 0; // integer, non-negative

const playXDM = {
  xdm: {
    eventType: 'media.play',
    mediaCollection: {
      playhead,
    },
  },
};

Media.sendMediaEvent(playXDM);
```

#### Example — `media.ping`

```typescript
const pingXDM = {
  xdm: {
    eventType: 'media.ping',
    mediaCollection: {
      playhead: currentPlayhead,
    },
  },
};

Media.sendMediaEvent(pingXDM);
```

---

## Session and playback notes

- **Active session**: Use **`sendMediaEvent`** only after a session has been started with **`createMediaSession`**.
- **Single session**: Only one media session should be active at a time. To start another session, end the current one with the appropriate session-complete / session-end events per [Media Edge API](https://experienceleague.adobe.com/docs/experience-platform/edge-network-server-api/media-edge-apis/getting-started.html) guidance.
- **Pings**: During playback, send **`media.ping`** at the required cadence with an up-to-date **`playhead`** so the server can track progress reliably.
- **Playhead**: Use a **non-negative integer** for **`playhead`** where applicable; invalid values may be treated as errors.

---

## Further reading

- [Media Edge APIs — getting started](https://developer.adobe.com/client-sdks/edge/media-for-edge-network/tutorial#track-media-playback)
- [Adobe Experience Platform Mobile SDKs](https://developer.adobe.com/client-sdks/documentation/)
