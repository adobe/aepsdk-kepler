/*
 * Copyright (c) 2022 Amazon.com, Inc. or its affiliates.  All rights reserved.
 *
 * PROPRIETARY/CONFIDENTIAL.  USE IS SUBJECT TO LICENSE TERMS.
 */

import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, ImageBackground, View, Image, Modal, Button, ScrollView} from 'react-native';

import {Link} from './components/Link';
import {AEPSDK} from '@adobe/kepler-aepcore';
import { KeplerDataStore } from '@adobe/kepler-aepcore/dist/platform-kepler/DataStore';
import { LogLevel } from '@adobe/kepler-aepcore/dist/core/services';
import { Media } from '@adobe/kepler-aepmedia';

const images = {
  aep: require('./assets/aepsdk-black.png'),
};

const keplerDataStore = new KeplerDataStore();
const clearDatastore = async () => {
  console.log('##AEPSample - Clearing Datastore');
  const sdk_keys = [
    'edge.ecid',
    'edge.consent.collect',
    'edge.locationHint',
    'edge.stateStore',
  ]

  for (const key of sdk_keys) {
    console.log(`##AEPSample - Deleting key: ${key}`);
    await keplerDataStore.delete(key);
  }
}

export const App = () => {
  const [ecid, setECID] = useState('not set');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalText, setModalText] = useState('');

  const styles = getStyles();

  useEffect(() => {
    const init = async () => {
      initSDK();
    };

    const clear = async () => {
      clearDatastore();
    }

    const ecid = async () => {
      getECID();
    };

    clear();
    setTimeout(() => {
      // wait for the datastore to clear
      init();
      ecid();
    }, 100);
  }, []); // Runs once when the component mounts.

  const initSDK = () => {
    console.log('##AEPSample - Initializing AEPSDK');

    const sdkConfig = {
      "edge.configId": "<YOUR_DATASTREAM_ID>", // required
      // "edge.domain": "<YOUR_DOMAIN>", // optional
      // "consent.default": { // optional
      //   "consents": {
      //     "collect": {
      //       "val": "y" // "p" = pending , "y" = yes, "n" = no
      //      }
      //    }
      //  }
    }

    AEPSDK.initialize(
    {
      config: sdkConfig,
      logLevel: LogLevel.VERBOSE,
      extensions: [Media.EXTENSION]
    });
  }

  const setConsent = (consentValue: string = 'y') => {
    console.log('##AEPSample - Setting Consent: ', consentValue);
    const consentData = {
      "consent": [
          {
              "standard": "Adobe",
              "version": "2.0",
              "value": {
                  "collect": {
                      "val": consentValue,
                  },
                  "metadata": {
                    "time": Date.now(),
                  }
              }
          }
      ]
  }
    AEPSDK.setConsent(consentData)
  }

  const getECID = async (showModal: boolean = false) => {
    console.log('##AEPSample - Getting ECID');
    AEPSDK.getExperienceCloudId().then((ecid) => {
      console.log('##AEPSample - Got ECID: ', ecid);
      if (ecid) {
        setECID(ecid);
        if (showModal) {
          setModalText(`ECID: ${ecid}`);
          setModalVisible(true);
        }
      }
    });
  };

  const sendEvent = () => {
    AEPSDK.sendEvent({
      xdm: {
        xdmKey: 'xdmVal',
      },
      data: {
        freeformKey: 'freeformVal',
      },
      query: {
        queryKey: 'queryVal',
      },
    });
  }

  const sendEvent2 = () => {
    AEPSDK.sendEvent({
      xdm: {
        xdmKey: 'xdmVal',
      },
      data: {
        freeformKey: 'freeformVal',
      },
      query: {
        queryKey: 'queryVal',
      },
      config:{
        datastreamConfigOverride:{
          com_adobe_experience_platform: {
            datasets: {
              event: {
                datasetId: "dataset_id_new",
              }
            }
          }
        }
      }
    });
  }
  const sendEvent3 = () => {
    AEPSDK.sendEvent({
      xdm: {
        xdmKey: 'xdmVal',
      },
      data: {
        freeformKey: 'freeformVal',
      },
      query: {
        queryKey: 'queryVal',
      },
      config:{
        datastreamIdOverride: "datastream_id_override",
      }
    });
  }

  const sendEventWithResponse = () => {
    AEPSDK.sendEventWithResponse({
      xdm: {
        xdmKey: 'xdmVal',
      },
      data: {
        freeformKey: 'freeformVal',
      },
      query: {
        queryKey: 'queryVal',
      },
    })
      .then((eventHandles: Array<Record<string, unknown>>) => {
        const sendEventResponseJson = JSON.stringify(eventHandles ?? "{}", undefined, 2);
        console.log(`##AEPSample - SendEventWithResponse Success: ${sendEventResponseJson}`);
        setModalText(`Response:\n ${sendEventResponseJson}`);
        setModalVisible(true);
      })
      .catch((error: string) => {
        console.log(`##AEPSample - SendEventWithResponse Error: ${error}`);
        setModalText(`SendEvent Error: ${error}`);
        setModalVisible(true);
      });
  };

  const createMediaSession = () => {
    Media.createMediaSession({
      "xdm": {
        "eventType": "media.sessionStart",
        "xdmKey": "xdmVal"
      },
    }, {})
  };

  const sendMediaEvent = () => {
    Media.sendMediaEvent({
      "xdm": {
        "eventType": "media.play",
        "xdmKey": "xdmVal"
      },
    })
  };

  return (
    <ImageBackground
      source={require('./assets/aep_bg.png')}
      style={styles.background}>
      <View style={styles.container}>
      <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(false);
          }}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.modalText}>
                  {modalText}
                </Text>
                {/* Add more content here */}
              </ScrollView>
              <View style={styles.modalButton}>
                <Button
                  title="Close"
                  onPress={() => setModalVisible(false)}
                />
              </View>
            </View>
          </View>
        </Modal>
        <View style={styles.links}>
          <View style={styles.headerContainer}>
            <Text style={styles.subHeaderText}>
              AEP SDK Sample App
            </Text>
          </View>
          <Link
            linkText={'getExperienceCloudId( )'}
            onPress={() => {
              {
                console.log('##Getting ECID');
                getECID(true);
              }
            }}
          />
          <Link
            linkText={'sendEvent( )'}
            onPress={() => {
              sendEvent();
            }}
          />
          <Link
            linkText={'SendEvent(datastream config override)'}
            onPress={() => {
              sendEvent2();
            }}
          />
          <Link
            linkText={'SendEvent(datastream id override)'}
            onPress={() => {
              sendEvent3();
            }}
          />
          <Link
            linkText={'sendEventWithResponse( )'}
            onPress={() => {
              sendEventWithResponse();
            }}
          />
          <Link
            linkText={'setConsent(y)'}
            onPress={() => {
              setConsent('y')
            }}
          />
          <Link
            linkText={'setConsent(n)'}
            onPress={() => {
              setConsent('n')
            }}
          />
          <Link
            linkText={'setConsent(p)'}
            onPress={() => {
              setConsent('p')
            }}
          />
          <Link
            linkText={'createMediaSession( )'}
            onPress={() => {
              createMediaSession();
            }}
          />
          <Link
            linkText={'sendMediaEvent( )'}
            onPress={() => {
              sendMediaEvent();
            }}
          />
        </View>
      </View>
      <View style={styles.textContainer}>
        <View style={styles.image}>
          <Image source={images.aep}/>
        </View>
        <Text style={styles.sdkInfoText}>
          SDK Version: {AEPSDK.version}
        </Text>
        <Text style={styles.sdkInfoText}>
          ECID: {ecid}
        </Text>
      </View>
    </ImageBackground>
  );
};

const getStyles = () =>
  StyleSheet.create({
    background: {
      color: 'white',
      flex: 1,
      flexDirection: 'column',
    },
    container: {
      flex: 6,
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerContainer: {
      marginLeft: 200,
    },
    headerText: {
      color: 'white',
      fontSize: 80,
      marginBottom: 10,
    },
    subHeaderText: {
      color: 'white',
      fontSize: 45,
      fontWeight: 'bold',
    },
    links: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'space-around',
      height: 600,
    },
    image: {
      flex: 1,
      paddingLeft: 10,
    },
    textContainer: {
      justifyContent: 'center',
      flex: 1,
      marginLeft: 190,
    },
    text: {
      color: 'white',
      fontSize: 40,
    },
    sdkInfoText: {
      color: 'white',
      fontSize: 40,
      marginLeft: 150,
      marginBottom: 30,
      fontWeight: 'bold'
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: 40,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      width: '50%',
      maxHeight: '70%', // Ensure the modal doesn't exceed screen height
      backgroundColor: 'white',
      borderRadius: 10,
      padding: 20,
    },
    scrollContainer: {
      paddingVertical: 10, // Add padding inside the scrollable area
    },
    modalText: {
      fontSize: 25,
      marginBottom: 20, // Adds space below the text
    },
    modalButton: {
      marginTop: 20, // Adds space above the button
    },
  });
