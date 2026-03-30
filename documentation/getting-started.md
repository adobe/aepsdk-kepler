# Getting Started

This guide explains how to quickly start using the Adobe Experience Platform Vega SDK with just a few lines of code.

## Configure a datastream

A `datastream` is a server-side configuration that tells the AEP Vega SDK where to send the data it collects. You can configure a datastream to send data to multiple Adobe solutions.

If no datastream was previously created, see [Configure datastreams](https://developer.adobe.com/client-sdks/documentation/getting-started/configure-datastreams/) before moving to the next step.

## Install the AEP Vega SDK

- Download the AEP Vega SDK zip file.

## Initialize and configure the AEP Vega SDK
```typescript
import {AEPSDK} from '@adobe/vega-aepcore';
import { LogLevel } from '@adobe/vega-aepcore/dist/core/services';
```


```typescript
const sdkConfig = {
    "edge.configId": "<YOUR_DATASTREAM_ID>"
}

const options: {
    config: sdkConfig,
    logLevel: LogLevel.VERBOSE
}

AEPSDK.initialize(options);
```

## Next step

- Get familiar with the various APIs offered by the AEP Vega SDK by checking out the [API reference](./api-reference.md).

- Review the [sample app](../apps/keplersampleapp) that is integrated with the AEP Vega SDK.
