# Adobe Experience Platform Kepler SDK Sample App

This is a sample React Native application demonstrating the usage of Adobe Experience Platform Kepler SDK.

## Package Contents

```
AEPKeplerSDK/
├── libs/                    # SDK Libraries
│   ├── @adobe-kepler-aepcore-*.tgz
│   └── @adobe-kepler-aepmedia-*.tgz
├── docs/                    # SDK Documentation
│   ├── api-reference.md
│   ├── getting-started.md
│   └── Tutorials/
└── AEPSampleApp/           # Sample Application
    └── ...
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure the SDK:
   Update the `src/AEPSDKConfig.json` file with your configuration:
   ```json
   {
     "edge.configId": "<YOUR_DATASTREAM_ID>"
   }
   ```

3. Initialize the SDK in your application:
   ```typescript
   import { AEPSDK, LogLevel } from '@adobe/kepler-aepcore';
   import { Media } from '@adobe/kepler-aepmedia';

   const sdkConfig = {
     "edge.configId": sdkConfiguration["edge.configId"]
   };

   AEPSDK.initialize({
     config: sdkConfig,
     logLevel: LogLevel.VERBOSE,
     extensions: [Media.EXTENSION]
   });
   ```

## Prerequisites

- Node.js (v16 or later)
- npm or yarn
- React Native development environment set up

## Troubleshooting

If you encounter any issues:

1. Verify your datastream ID is correctly configured in `AEPSDKConfig.json`
2. Check that all dependencies are installed properly
3. Make sure your React Native development environment is properly set up

## API References

For detailed API documentation and advanced configuration options, please refer to the AEP SDK documentation.
