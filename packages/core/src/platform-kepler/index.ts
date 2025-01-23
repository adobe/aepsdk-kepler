/*
Copyright 2024 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/
import { registerService } from "../core/services";
import { KeplerDataStore } from "./DataStore";
import { Log } from "../core/utils/Log";
import { LOG_EXTENSION } from "./Constants";
import { CryptoService } from "./Crypto";

const LOG_TAG = "registerPlatformService";

export function registerPlatformService(): void {
  Log.debug(LOG_EXTENSION, LOG_TAG, "registerPlatformService() - Registering KeplerDataStore");
  registerService("dataStore", new KeplerDataStore());
  registerService("crypto", new CryptoService());
}
