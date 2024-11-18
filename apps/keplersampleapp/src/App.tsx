/*
 * Copyright (c) 2022 Amazon.com, Inc. or its affiliates.  All rights reserved.
 *
 * PROPRIETARY/CONFIDENTIAL.  USE IS SUBJECT TO LICENSE TERMS.
 */

import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, ImageBackground, View, Image} from 'react-native';
import {Link} from './components/Link';
import {AEPSDK} from '@adobe/kepler-aepcore';
// import { KeplerDataStore } from '@adobe/kepler-aepcore/dist/platform-kepler/DataStore';

// const keplerDataStore = new KeplerDataStore();
// const clearDatastore = async () => {
//   console.log('##AEPSample - Clearing Datastore');
//   const sdk_keys = [
//     'ecid',
//     'locationHint'
//   ]

//   for (const key of sdk_keys) {
//     console.log(`##AEPSample - Deleting key: ${key}`);
//     await keplerDataStore.delete(key);
//   }
// }

const images = {
  aep: require('./assets/aepsdk-black.png'),
};

export const App = () => {
  const [ecid, setECID] = useState('not set');

  const styles = getStyles();

  useEffect(() => {
    const init = async () => {
      initSDK();
    };

    const clear = async () => {
      // clearDatastore();
    }

    const ecid = async () => {
      const ecid = await AEPSDK.getExperienceCloudId();
      if (ecid) {
        setECID(ecid);
      }

    };
    clear();
    init();
    ecid();
  }, []); // Runs once when the component mounts.

  const initSDK = () => {
    console.log('##AEPSample - Initializing AEPSDK');
    AEPSDK.setLogLevel(3);
    AEPSDK.initialize();
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

  const getECID = async () => {
    console.log('##AEPSample - Getting ECID');
    AEPSDK.getExperienceCloudId().then((ecid) => {
      console.log('##AEPSample - Got ECID: ', ecid);
      if (ecid) {
        console.log('##AEPSample - Setting ECID: ', ecid);
        setECID(ecid);
      }
    });
  };

  return (
    <ImageBackground
      source={require('./assets/aep_bg.png')}
      style={styles.background}>
      <View style={styles.container}>
        <View style={styles.links}>
          <View style={styles.headerContainer}>
            <Text style={styles.subHeaderText}>
              AEP SDK Sample App
            </Text>
          </View>
          <Link
            linkText={'SendEvent'}
            onPress={() => {
              AEPSDK.sendEvent(
                {
                  xdm :
                  {
                    xdmKey: 'xdmVal'
                  },
                  data: {
                    freeformKey: 'freeformVal'
                  }
                }

              );
            }}
          />
          <Link
            linkText={'Get ECID'}
            onPress={() => {
              {
                console.log('##Getting ECID');
                getECID();
              }
            }}
          />
          <Link
            linkText={'Set Consent (y)'}
            onPress={() => {
              setConsent('y')
            }}
          />
          <Link
            linkText={'Set Consent (n)'}
            onPress={() => {
              setConsent('n')
            }}
          />
          <Link
            linkText={'Set Consent (p)'}
            onPress={() => {
              setConsent('p')
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
  });
