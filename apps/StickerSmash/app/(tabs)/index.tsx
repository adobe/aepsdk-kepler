import '@adobe/platform-react-native';
// import { AEPSDK } from '@adobe/js-aepcore';
import { sendEdgeRequest } from "shared-js-component";

import React from 'react';
import { Button, View, StyleSheet } from 'react-native';

const handleClick = () => {
  
  // ------------------ AEPSDK ------------------
  // AEPSDK.initialize({
  //   config: {
  //     "k":"v"
  //   },
  //   logLevel: 3
  // }).then(() => {
  //   AEPSDK.setLogLevel(3);
  //   console.log('AEPSDK initialized');
  //   AEPSDK.sendEvent(
  //     {
  //       xdm :
  //       {
  //         xdmKey: 'xdmVal'
  //       },
  //       data: {
  //         freeformKey: 'freeformVal'
  //       }
  //     }
  
  //   );
  // });
  sendEdgeRequest();
  // ------------------ AEPSDK ------------------
  
};
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Button title="New Button" onPress={handleClick} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});