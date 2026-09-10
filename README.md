# aepsdk-vega

## About

This repository is a monorepo and contains a collection of Amazon Vega libraries for Adobe Experience Platform Mobile SDK as listed below. These libraries can be found in the [packages](./packages) directory.

| Package Name | Latest Version |
| ---- | ---- |
| @adobe/vega-aepcore | 1.0.1 |
| @adobe/vega-aepmedia | 1.0.1 |

## Requirements

- Vega SDK — validated on stable SDK **0.24.9914** with **React Native 0.83** (React 19.2.0). Also builds against **0.23.8358** (React Native 0.72) on VVM.

- Node **≥ 22.14.0** (required by RN 0.83; was 16.x on RN 0.72).

### Vega SDK compatibility

| Vega SDK | React Native | `@amazon-devices/react-native-kepler` | `@amazon-devices/kepler-cli-platform` | Status |
| --- | --- | --- | --- | --- |
| 0.22.x | 0.72.0 | ^2.0.0 | ~0.22.0 | Supported |
| 0.23.8358 | 0.72.0 | ^2.0.0 | ~0.22.0 | Validated |
| 0.24.9914 (GA) | 0.83.0 (React 19.2.0) | 4.0.0 | 0.22.14 | Validated — `build_all`, unit tests (355/355), and integration tests green; sample app builds, installs, and launches on the Vega Virtual Device with no crashes. |

> **React Native 0.83 (Vega SDK 0.24.9914) notes.** Requires Node ≥ 22.14.0. RN 0.83 replaces `metro-react-native-babel-preset` with `@react-native/babel-preset`, and apps pin the matching build tools in their `devDependencies`: `@amazon-devices/kepler-module-manifest-builder@0.1.16` and `@amazon-devices/keplerscript-commonmodules@1.1.0`. No AEP SDK source changes are required — the SDK is pure JS/TS with no native module to port for the New Architecture.
>
> The `kepler` CLI is deprecated (use `vega`) and the `KEPLER_SDK_PATH` env var is removed; this repo uses the `vega` CLI + VVM and sets no `KEPLER_SDK_PATH`.

## Installation

### Install AEP npm packages

//TODO:

### Initializing

//TODO:

## Contributing

Contributions are welcomed! See [CONTRIBUTING](CONTRIBUTING.md) and [development.md](./documentation/development.md) guides for more information.

## Licensing

This project is licensed under the Apache V2 License. See [LICENSE](LICENSE) for more information.
