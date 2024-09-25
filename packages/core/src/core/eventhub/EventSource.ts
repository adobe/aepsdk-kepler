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
export const EventSource = Object.freeze({
  NONE: "com.adobe.eventSource.none",
  OS: "com.adobe.eventSource.os",
  REQUEST_CONTENT: "com.adobe.eventSource.requestContent",
  REQUEST_IDENTITY: "com.adobe.eventSource.requestIdentity",
  REQUEST_RESET: "com.adobe.eventSource.requestReset",
  RESPONSE_CONTENT: "com.adobe.eventSource.responseContent",
  RESPONSE_IDENTITY: "com.adobe.eventSource.responseIdentity",
  SHARED_STATE: "com.adobe.eventSource.sharedState",
  WILDCARD: "com.adobe.eventSource._wildcard_",
  APPLICATION_LAUNCH: "com.adobe.eventSource.applicationLaunch",
  APPLICATION_CLOSE: "com.adobe.eventSource.applicationClose",
  CONSENT_PREFERENCE: "consent:preferences",
  UPDATE_CONSENT: "com.adobe.eventSource.updateConsent",
  RESET_COMPLETE: "com.adobe.eventSource.resetComplete",
  UPDATE_IDENTITY: "com.adobe.eventSource.updateIdentity",
  REMOVE_IDENTITY: "com.adobe.eventSource.removeIdentity",
  ERROR_RESPONSE_CONTENT: "com.adobe.eventSource.errorResponseContent",
  CREATE_TRACKER: "com.adobe.eventSource.createTracker",
  TRACK_MEDIA: "com.adobe.eventSource.trackMedia",
  CONTENT_COMPLETE: "com.adobe.eventSource.contentComplete",
});
