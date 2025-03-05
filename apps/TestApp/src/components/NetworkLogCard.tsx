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

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { NetworkLog } from '../utils/NetworkMonitor';

interface NetworkLogCardProps {
  log: NetworkLog;
  isSelected: boolean;
  onPress: () => void;
  children?: React.ReactNode;
}

export const NetworkLogCard: React.FC<NetworkLogCardProps> = ({
  log,
  isSelected,
  onPress,
  children
}) => {
  const isSuccess = log.response.status < 400;
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={[
        styles.pressable,
        (isHovered || isFocused) && styles.hovered,
        isSelected && styles.selectedCard
      ]}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.row}>
            <Text style={styles.method}>{log.request.method}</Text>
            <Text style={styles.url} selectable={true}>
              {log.request.url}
            </Text>
          </View>
          <Text style={[styles.status, { color: isSuccess ? '#4CAF50' : '#F44336' }]}>
            {log.response.status}
          </Text>
          <Text style={styles.expandIcon}>
            {isSelected ? '▲' : '▼'}
          </Text>
        </View>
        {isSelected && children}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pressed: {
    opacity: 0.7,
  },
  hovered: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'white',
  },
  selectedCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'white',
  },
  card: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 8,
    flexWrap: 'wrap',
  },
  method: {
    color: '#64B5F6',
    fontWeight: 'bold',
    marginRight: 8,
    fontSize: 14,
    minWidth: 60,
  },
  url: {
    color: 'white',
    fontSize: 14,
    flex: 1,
    flexWrap: 'wrap',
  },
  status: {
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
    minWidth: 30,
    textAlign: 'right',
  },
  expandIcon: {
    color: 'white',
    marginLeft: 8,
    fontSize: 12,
    width: 12,
    textAlign: 'center',
    backgroundColor: 'transparent',
    padding: 0,
  },
});
