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
    EXTENSION_NAME: 'com.adobe.mobile.marketing.edge',
    FRIENDLY_NAME: 'Edge',
    EXTENSION_VERSION: '1.0.0',

    LOG_SOURCE: 'Edge',

    DataStoreKey: {
        ECID: 'ecid'
    },

    IdentityMap: {
        NameSpace :{
            ECID: 'ECID'
        }
    },

    SharedState: {
        STATE_OWNER: 'stateowner',

        Edge: {
            STATE_OWNER_NAME: 'com.adobe.edge',
        }
    },

    XDMKeys: {
        IDENTITY_MAP: 'identityMap',
    }


} as const;
