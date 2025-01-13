/*
Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import { Log } from "@adobe/kepler-aepcore/dist/core/utils/Log";
import { getEventDispatcher } from "@adobe/kepler-aepcore/dist/core";
import { Event, EventType, EventSource } from "@adobe/kepler-aepcore/dist/core/eventhub";
import { Extension } from "@adobe/kepler-aepcore/dist/core/extension";
import { Media } from "./Media";
import { MediaConstants } from "./MediaConstants";
import { MediaExtension } from "./MediaExtension";

const LOG_EXTENSION = MediaConstants.EXTENSION_NAME;
const LOG_TAG = "MediaAPI";

export class MediaAPI implements Media {
  readonly EXTENSION: Extension = new MediaExtension();

  // public APIs
}

export const media: Media = new MediaAPI();
