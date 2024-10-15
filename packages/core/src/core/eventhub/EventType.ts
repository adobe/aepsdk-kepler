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
export const EventType = {
  CONFIGURATION: "com.adobe.eventType.configuration",
  CONSENT: "com.adobe.eventType.edgeConsent",
  EDGE: "com.adobe.eventType.edge",
  EDGE_IDENTITY: "com.adobe.eventType.edgeIdentity",
  EDGE_MEDIA: "com.adobe.eventType.edgeMedia",
  HUB: "com.adobe.eventType.hub",
  RULES_ENGINE: "com.adobe.eventType.rulesEngine",
  WILDCARD: "com.adobe.eventType._wildcard_",
} as const;
