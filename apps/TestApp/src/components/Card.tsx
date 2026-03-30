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

import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CardProps {
  title: string;
  description?: string;
  onPress: () => void;
  testID?: string;
  variant?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

export const Card: React.FC<CardProps> = ({
  title,
  description,
  onPress,
  testID,
  variant = 'blue'
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={1}
      style={[
        styles.card,
        styles[variant],
        isFocused && styles.cardFocused
      ]}
      onPress={onPress}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      testID={testID}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {description && (
          <Text style={styles.description}>{description}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 20,
    margin: 10,
    width: 300,
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardFocused: {
    borderColor: 'white',
    transform: [{ scale: 1.02 }],  // Subtle scale effect
    shadowOpacity: 0.35,
  },
  blue: {
    backgroundColor: 'rgba(66, 153, 225, 0.9)',
  },
  green: {
    backgroundColor: 'rgba(72, 187, 120, 0.9)',
  },
  purple: {
    backgroundColor: 'rgba(159, 122, 234, 0.9)',
  },
  orange: {
    backgroundColor: 'rgba(237, 137, 54, 0.9)',
  },
  red: {
    backgroundColor: 'rgba(245, 101, 101, 0.9)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
  }
});
