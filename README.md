# aepsdk-vega

## About

This repository is a monorepo and contains a collection of Amazon Vega libraries for Adobe Experience Platform Mobile SDK as listed below. These libraries can be found in the [packages](./packages) directory.

| Package Name | Latest Version |
| ---- | ---- |
| @adobe/vega-aepcore | 1.0.1 |
| @adobe/vega-aepmedia | 1.0.1 |

## Requirements

- Vega SDK — validated against **0.23.8358** (also compatible with 0.22.x). CI builds against the version pinned by the `vega_sdk_version` parameter in [.circleci/config.yml](.circleci/config.yml).

- Node

### Vega SDK compatibility

| Vega SDK | React Native | `@amazon-devices/react-native-kepler` | `@amazon-devices/kepler-cli-platform` | Status |
| --- | --- | --- | --- | --- |
| 0.22.x | 0.72.0 | ^2.0.0 | ~0.22.0 | Supported |
| 0.23.8358 | 0.72.0 | ^2.0.0 | ~0.22.0 | Validated — see [Vega 0.23 Validation Report](https://wiki.corp.adobe.com/pages/viewpage.action?pageId=3943749330) |

> 0.23 deprecates the `kepler` CLI (use `vega`) and removes the `KEPLER_SDK_PATH` env var; this repo already uses the `vega` CLI + VVM and sets no `KEPLER_SDK_PATH`, so no source changes were required. npm package pins are unchanged (they resolve and run on 0.23).

## Installation

### Install AEP npm packages

//TODO:

### Initializing

//TODO:

## Contributing

Contributions are welcomed! See [CONTRIBUTING](CONTRIBUTING.md) and [development.md](./documentation/development.md) guides for more information.

## Licensing

This project is licensed under the Apache V2 License. See [LICENSE](LICENSE) for more information.
