# Kepler Sample App

This Kepler app demonstrates the usage of the AEP Kepler SDK.

To run this app on your Amazon device, follow the steps below to set it up beforehand.

## Install the AEP Kepler SDK

Fristly, download the `@adobe-kepler-aepcore-1.0.0.tgz` file to the root directory of the Kepler sample app project.

Next, execute the npm command provided below to install the package.

```shell
npm install @adobe-kepler-aepcore-1.0.0.tgz
```

## Initialize and configure the AEP Keper SDK

The `App.tsx` file contains the code to initialize the AEP Kepler SDK, as shown below:

- Import the `@adobe/kepler-aepcore` package

```javascript
import {AEPSDK, LogLevel} from '@adobe/kepler-aepcore';
```

- Initliaze the SDK

```typescript
AEPSDK.initialize({
    config: {
        "edge.configId": "xxx-xxx-xxx"
    },
    logLevel: LogLevel.DEBUG
});
```

## Send XDM data to the Adobe Edge Network

Use the `sendEvent` API to send XDM data to the Adobe Edge Network.

```typescript
AEPSDK.sendEvent(
  {
    xdm :
    {
      xdmKey: 'xdmVal'
    },
    data: {
      freeformKey: 'freeformVal'
    }
  }
);
```
