/*
Copyright 2026 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import React, {useEffect, useState} from 'react';
import {
  Text,
  ImageBackground,
  View,
  Image,
  ScrollView
} from 'react-native';
import { Card } from './components/Card';
import { Section } from './components/Section';
import { images } from './constants';
import { ResponsePanel } from './components/ResponsePanel';
import { appStyles } from './styles/appStyles';

import { AEPSDK } from '@adobe/kepler-aepcore';
import { Media } from '@adobe/kepler-aepmedia';
import { LogLevel } from '@adobe/kepler-aepcore/dist/core/services';

// to reset SDK datastore
import { KeplerDataStore } from '@adobe/kepler-aepcore/dist/platform-kepler/DataStore';
// NETWORK MONITORING - START
// Remove this import if reverting network monitoring
import { NetworkMonitor } from './utils/NetworkMonitor';
// NETWORK MONITORING - END


export const App = () => {
  console.log('App component rendering');

  const [ecid, setECID] = useState('not set');
  const [responseText, setResponseText] = useState('');
  const [responseTitle, setResponseTitle] = useState('Response Panel');
  const [requestData, setRequestData] = useState('');
  const [requestTimestamp, setRequestTimestamp] = useState(0);

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const sdkConfiguration = require('./AEPSDKConfig.json');

  const keplerDataStore = new KeplerDataStore();

  useEffect(() => {
    console.log('App component mounted');
    NetworkMonitor.initialize();
    initAEPSDK();
    handleGetECID();
  }, []);

  // Update the response panel
  const updatePanel = (title: string, request: unknown, response?: unknown) => {
    const requestTimestamp = Date.now();
    setResponseTitle(title);
    setRequestData(JSON.stringify(request, null, 2));
    setResponseText(response ? JSON.stringify(response, null, 2) : '');
    // Pass timestamp to ResponsePanel
    setRequestTimestamp(requestTimestamp);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const clearDatastore = async () => {
    const sdk_keys = [
      'edge.ecid',
      'edge.consent.collect',
      'edge.locationHint',
      'edge.stateStore',
    ];

    for (const key of sdk_keys) {
      keplerDataStore.delete(key);
    }
  }

  // Initialize the AEPSDK
  const initAEPSDK = async () => {
      const sdkConfig = {
        "edge.configId": sdkConfiguration["edge.configId"],
      };

      AEPSDK.initialize({
        config: sdkConfig,
        logLevel: LogLevel.DEBUG,
        extensions: [Media.EXTENSION]
      });
    }

  // Get the ECID from the AEPSDK
  // Update the response panel with the ECID
  const handleGetECID = async () => {
    try {
      const ecid = await AEPSDK.getExperienceCloudId();
      if (ecid) {
        setECID(ecid);
        updatePanel('Get ECID', 'Retrieving ECID...', `ECID: ${ecid}`);
      }
    } catch (error) {
      console.error('GetECID Error:', error);
      updatePanel('Get ECID Error', 'Retrieving ECID...', `Error: ${error}`);
    }
  };

  // Send an event to the AEPSDK
  // Update the response panel with the event data
  const handleSendEvent = async (withConfigOverride = false, withDatastreamIdOverride = false) => {
    let config = {};
    if (withConfigOverride) {
      config = { ...config, datastreamConfigOverride: sdkConfiguration["datastreamConfigOverride"] };
    }
    if (withDatastreamIdOverride) {
      config = { ...config, datastreamIdOverride: sdkConfiguration["datastreamIdOverride"]};
    }

    const sendEventData = {
        xdm: { xdmKey: 'xdmVal' },
        data: { freeformKey: 'freeformVal' },
        query: { queryKey: 'queryVal' },
        config: config
    }

    AEPSDK.sendEvent(sendEventData);
    updatePanel('Send Event', sendEventData);
  };

  // Send an event to the AEPSDK and handle the response
  // Update the response panel with the event data and response
  const handleSendEventWithResponse = async (withConfigOverride = false, withDatastreamIdOverride = false) => {
    let config = {};
    if (withConfigOverride) {
      config = { ...config, datastreamConfigOverride: sdkConfiguration["datastreamConfigOverride"] };
    }
    if (withDatastreamIdOverride) {
      config = { ...config, datastreamIdOverride: sdkConfiguration["datastreamIdOverride"]};
    }

    const sendEventData = {
      xdm: { xdmKey: 'xdmVal' },
      data: { freeformKey: 'freeformVal' },
      query: { queryKey: 'queryVal' },
      config: config
    }

    try {
      const response = await AEPSDK.sendEventWithResponse(sendEventData);
      updatePanel('Send Event with Response', sendEventData, response);
    } catch (error) {
      console.error('SendEvent Error:', error);
      updatePanel('Send Event Error', sendEventData, `Error: ${error}`);
    }
  };

  const handleMediaSession = async () => {
      const mediaData = {
        "xdm": {
            "eventType": "media.sessionStart",
            "mediaCollection": {
                "playhead": 0,
                "sessionDetails": {
                    "streamType": "video",
                    "friendlyName": "KeplerSampleApp::test_media_name",
                    "hasResume": false,
                    "name": "KeplerSampleApp::test_media_id",
                    "length": 100,
                    "contentType": "vod",
                    "channel": "KeplerSampleApp::test_channel",
                    "playerName": "KeplerSampleApp::test_player_name"
                }
            }
        }
      };
       Media.createMediaSession(mediaData);
      updatePanel('Create Media Session', mediaData);
  };

  const handleMediaEvent = async (eventType: string = "media.ping") => {
      const mediaEventData = {
        "xdm": {
          "eventType": eventType,
          "mediaCollection": {
              "playhead": 1,
            }
        }
      };
       Media.sendMediaEvent(mediaEventData);
      updatePanel('Send Media Event', mediaEventData);
  };

  const handleSetConsent = async (value: 'y' | 'n' | 'p') => {
      const consentData = {
        consent: [{
          standard: "Adobe",
          version: "2.0",
          value: {
            collect: { val: value },
            metadata: { time: new Date().toISOString() }
          }
        }]
      };
      AEPSDK.setConsent(consentData);
      updatePanel('Set Consent', consentData);

  };

  const handleUpdateConfiguration = async () => {
    const configData = {
      "edge.domain": "edge.data.adobedc.net",
    };
    AEPSDK.updateConfiguration(configData);
    updatePanel('Update Configuration', configData);
  };

  return (
    <ImageBackground
      source={images.background}
      style={appStyles.background}
      onError={(e) => console.error('Background image failed to load:', e.nativeEvent.error)}>
      <View style={[appStyles.container, {backgroundColor: 'rgba(0,0,0,0.5)'}]}>
        {/* Info Panel */}
        <View style={appStyles.infoPanel}>
          <View style={appStyles.infoLeft}>
            <Image source={images.aep} style={appStyles.logo}/>
          </View>
          <View style={appStyles.infoRight}>
            <Text style={appStyles.infoTitle}>AEP SDK Sample App</Text>
            <Text style={appStyles.infoText}>SDK Version: {AEPSDK.version}</Text>
            <Text style={appStyles.infoText}>ECID: {ecid}</Text>
          </View>
        </View>

        <View style={appStyles.mainContent}>
          <ScrollView style={appStyles.scrollView}>
            <View style={appStyles.cardsContainer}>
              <Section title="Core APIs">
                <Card
                  title="Get ECID NAMAN"
                  description="Retrieve Experience Cloud ID"
                  onPress={handleGetECID}
                  variant="blue"
                />
                <Card
                  title="Update Configuration"
                  description="Update SDK configuration"
                  onPress={handleUpdateConfiguration}
                  variant="blue"
                />
              </Section>

              <Section title="Consent APIs">
                <Card
                  title="Set Consent (Yes)"
                  description="Set consent value to Yes"
                  onPress={() => handleSetConsent('y')}
                  variant="orange"
                />
                <Card
                  title="Set Consent (No)"
                  description="Set consent value to No"
                  onPress={() => handleSetConsent('n')}
                  variant="orange"
                />
              </Section>

              <Section title="Edge APIs">
                <Card
                  title="Send Event"
                  description="Send basic event"
                  onPress={() => handleSendEvent()}
                  variant="green"
                />
                <Card
                  title="Send Event with Response"
                  description="Send event and handle response"
                  onPress={handleSendEventWithResponse}
                  variant="green"
                />
                <Card
                  title="Send Event with Config Override"
                  description="Send event with datastream config override and handle response"
                  onPress={() => handleSendEventWithResponse(true)}
                  variant="green"
                />
                <Card
                  title="Send Event with ID Override"
                  description="Send event with datastream ID override and handle response"
                  onPress={() => handleSendEventWithResponse(false, true)}
                  variant="green"
                />
              </Section>

              <Section title="Media APIs">
                <Card
                  title="Create Media Session"
                  description="Initialize media tracking"
                  onPress={handleMediaSession}
                  variant="purple"
                />
                <Card
                  title="Send Media Play"
                  description="Send media tracking event"
                  onPress={() => handleMediaEvent("media.play")}
                  variant="purple"
                />
                <Card
                  title="Send Media Pause"
                  description="Send media tracking event"
                  onPress={() => handleMediaEvent("media.pauseStart")}
                  variant="purple"
                />
                <Card
                  title="Send Media Complete"
                  description="Send media tracking event"
                  onPress={() => handleMediaEvent("media.sessionComplete")}
                  variant="purple"
                />
                <Card
                  title="Send Media End"
                  description="Send media tracking event"
                  onPress={() => handleMediaEvent("media.sessionEnd")}
                  variant="purple"
                />

              </Section>
            </View>
          </ScrollView>

          <ResponsePanel
            content={responseText}
            title={responseTitle}
            requestData={requestData}
            requestTimestamp={requestTimestamp}
          />
        </View>
      </View>
    </ImageBackground>
  );
};
