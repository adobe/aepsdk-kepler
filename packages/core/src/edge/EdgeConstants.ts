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

export const EdgeConstants = {
  EXTENSION_NAME: "com.adobe.edge",
  FRIENDLY_NAME: "Edge",
  EXTENSION_VERSION: "1.0.0-beta.1",

  Service: {
    DATASTORE: "dataStore",
  },

  Event: {
    Name: {
      SEND_EVENT: "AEP Send Event Request",
      GET_IDENTITY_ECID: "AEP Identity ECID Request",
      SET_CONSENT: "AEP Set Consent Request",
      IDENTITY_ECID_RESPONSE: "AEP Identity ECID Response",
    },
  },

  ConfigurationKey: {
    EDGE_DOMAIN: "edge.domain",
    DATASTREAM_ID: "edge.configId",
    DEFAULT_CONSENT: "consent.default",
  },

  DataStoreKey: {
    ECID: "edge.ecid",
    COLLECT_CONSENT: "edge.consent.collect",
    LOCATION_HINT: "edge.locationHint",
    STATE_STORE: "edge.stateStore",
  },

  IdentityMap: {
    NameSpace: {
      ECID: "ECID",
    },
  },

  SharedState: {
    STATE_OWNER: "stateowner",

    Owner: {
      EDGE: "com.adobe.edge",
      CONFIGURATION: "com.adobe.module.configuration",
    },

    Keys: {
      ECID: "ecid",
      CONSENT_COLLECT: "consent.collect",
    },
  },

  EventData: {
    Keys: {
      ECID: "ecid",
      TIMESTAMP: "timestamp",
      XDM: "xdm",
      CONFIG: "config",
      REQUEST: "request",
      PATH: "path",
      DATASTREAM_ID_OVERRIDE: "datastreamIdOverride",
      DATASTREAM_CONFIG_OVERRIDE: "datastreamConfigOverride",
    },
  },

  ResponseData: {
    Keys: {
      HANDLE: "handle",
      PAYLOAD: "payload",
      KEY: "key",
      TYPE: "type",
      MAX_AGE: "maxAge",
      HINT: "hint",
      TTL_SECONDS: "ttlSeconds",
      NAMESPACE: "namespace",
      CODE: "code",
      COLLECT: "collect",
      VAL: "val",
      ID: "id",
      IDENTITY_RESULT: "identity:result",
      CONSENT_PREFERENCES: "consent:preferences",
      LOCATION_HINT_RESULT: "locationHint:result",
      STATE_STORE: "state:store",
      SCOPE: "scope",
    },
  },

  Request: {
    TIMEOUT: 5000,
    Data: {
      IDENTITY_MAP: "identityMap",
      XDM: "xdm",
      Meta: {
        KEY: "meta",
        ENTRIES: "entries",
        STATE: "state",
        CONFIG_OVERRIDES: "configOverrides",
        SDK_CONFIG: "sdkConfig",
        DATASTREAM: "datastream",
        ORIGINAL: "original",
      },
      Query: {
        KEY: "query",
        IDENTITY: "identity",
        CONSENT: "consent",
        UPDATE: "update",
      },
    },
    ImplementationDetails: {
      NAME: "https://ns.adobe.com/experience/mobilesdk/js",
      ENVIRONMENT: "app",
    },
    Path: {
      PREFIX: "/ee",
      INTERACT: "/v1/interact",
      CONSENT: "/v1/privacy/set-consent",
    },
    Url: {
      SCHEME: "https://",
      DEFAULT: "edge.adobedc.net",
    },
    Retry: {
      TIMEOUT: 30000,
    },
    RecoverableStatusCodes: [408, 500, 503],
    StatusCode: {
      SUCCESS: 200,
      MULTI_STATUS: 207,
      NO_CONTENT: 204,
    },
  },
} as const;
