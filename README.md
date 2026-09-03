# aepsdk-vega

## About

This repository is a monorepo and contains a collection of Amazon Vega libraries for Adobe Experience Platform Mobile SDK as listed below. These libraries can be found in the [packages](./packages) directory.

| Package Name | Latest Version |
| ---- | ---- |
| @adobe/vega-aepcore | 1.0.1 |
| @adobe/vega-aepmedia | 1.0.1 |

## Requirements

- Vega SDK — targeting the **React Native 0.83 preview** (runs as a second runtime alongside RN 0.72). Toolchain builds against SDK **0.23.8358** on VVM. CI builds against the version pinned by the `vega_sdk_version` parameter in [.circleci/config.yml](.circleci/config.yml).

- Node **≥ 22.14.0** (required by RN 0.83; was 16.x on RN 0.72).

### Vega SDK compatibility

| Vega SDK / track | React Native | `@amazon-devices/react-native-kepler` | `@amazon-devices/kepler-cli-platform` | Status |
| --- | --- | --- | --- | --- |
| 0.22.x | 0.72.0 | ^2.0.0 | ~0.22.0 | Supported |
| 0.23.8358 | 0.72.0 | ^2.0.0 | ~0.22.0 | Validated — see [Vega 0.23 Validation Report](https://wiki.corp.adobe.com/pages/viewpage.action?pageId=3943749330) |
| RN 0.83 preview | 0.83.0 (React 19.2.0) | 4.0.0-rn-83 | 0.22.13-rn-83.3 | Build + install + launch validated on preview SDK **0.24.8606** VVD; `build_all` + unit (355/355) green. **App SIGABRTs at init on-device** — native KeplerScript↔React bridge crash (see [migration report](documentation/vega-rn-0.83-migration-report.md) §6). Root cause: public-npm + hand-picked preview versions vs. the matched set from Amazon's private Vega registry / buildertools MCP. |

> **RN 0.83 preview notes.** Preview packages use `-rn-83` npm tags. Build needs Node ≥ 22.14.0. `kepler-cli-platform@*-rn-83` declares its companion tools with non-`rn-83` ranges, so the RN 0.83 build tools must be pinned explicitly in each app's `devDependencies`: `@amazon-devices/kepler-module-manifest-builder@0.1.16-rn-83.2` and `@amazon-devices/keplerscript-commonmodules@1.1.0-rn-83`. `metro-react-native-babel-preset` is replaced by `@react-native/babel-preset`. No AEP SDK source changes were required (the SDK is pure JS/TS with no native TurboModule to port for the New Architecture); the only app fix was removing web-only `::-webkit-scrollbar` keys from a React Native `StyleSheet` that RN 0.83's stricter types reject.
>
> 0.23 deprecates the `kepler` CLI (use `vega`) and removes the `KEPLER_SDK_PATH` env var; this repo already uses the `vega` CLI + VVM and sets no `KEPLER_SDK_PATH`.

## Installation

### Install AEP npm packages

//TODO:

### Initializing

//TODO:

## Contributing

Contributions are welcomed! See [CONTRIBUTING](CONTRIBUTING.md) and [development.md](./documentation/development.md) guides for more information.

## Licensing

This project is licensed under the Apache V2 License. See [LICENSE](LICENSE) for more information.
