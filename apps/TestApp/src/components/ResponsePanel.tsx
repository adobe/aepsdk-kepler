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

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import {
  NetworkMonitor,
  type NetworkLog,
  type NetworkRequest,
  type NetworkResponse
} from '../utils/NetworkMonitor';
import { NetworkLogCard } from './NetworkLogCard';

interface ResponsePanelProps {
  content: string;
  title: string;
  requestData?: string;
  requestTimestamp: number;
}

type TabType = 'current' | 'history';

export const ResponsePanel: React.FC<ResponsePanelProps> = ({
  content,
  title,
  requestData,
  requestTimestamp
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('current');
  const [networkLogs, setNetworkLogs] = useState<NetworkLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<NetworkLog | null>(null);
  const [hoveredTab, setHoveredTab] = useState<TabType | null>(null);
  const [focusedTab, setFocusedTab] = useState<TabType | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    NetworkMonitor.addListener(setNetworkLogs);
    return () => NetworkMonitor.removeListener(setNetworkLogs);
  }, []);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [requestData]);

  const formatNetworkRequest = (request: NetworkRequest) => {
    const formatBody = (bodyStr?: string) => {
      if (!bodyStr) return (
        <Text style={styles.placeholder}>No request body</Text>
      );
      try {
        const body = typeof bodyStr === 'string' ? JSON.parse(bodyStr) : bodyStr;
        return JSON.stringify(body, null, 2);
      } catch {
        return bodyStr;
      }
    };

    return (
      <>
        <Text style={styles.label}>URL:</Text>
        <Text style={styles.value} selectable={true}>{request.url}</Text>

        <Text style={styles.label}>Method:</Text>
        <Text style={styles.value} selectable={true}>{request.method}</Text>

        <Text style={styles.label}>Headers:</Text>
        <Text style={styles.value} selectable={true}>
          {JSON.stringify(request.headers, null, 2)}
        </Text>

        {request.body && (
          <>
            <Text style={styles.label}>Body:</Text>
            <Text style={styles.value} selectable={true}>
              {formatBody(request.body)}
            </Text>
          </>
        )}
      </>
    );
  };

  const formatNetworkResponse = (response: NetworkResponse) => {
    const formatBody = (bodyStr?: string) => {
      if (!bodyStr) return (
        <Text style={styles.placeholder}>No response body</Text>
      );
      try {
        const body = typeof bodyStr === 'string' ? JSON.parse(bodyStr) : bodyStr;
        return JSON.stringify(body, null, 2);
      } catch {
        return bodyStr;
      }
    };

    return (
      <>
        <Text style={styles.label}>Status:</Text>
        <Text style={[styles.value, { color: response.status < 400 ? '#4CAF50' : '#F44336' }]} selectable={true}>
          {response.status}
        </Text>

        <Text style={styles.label}>Headers:</Text>
        <Text style={styles.value} selectable={true}>
          {JSON.stringify(response.headers, null, 2)}
        </Text>

        {response.body && (
          <>
            <Text style={styles.label}>Body:</Text>
            <Text style={styles.value} selectable={true}>
              {formatBody(response.body)}
            </Text>
          </>
        )}
      </>
    );
  };

  const getTabStyle = (tabType: TabType, pressed: boolean) => [
    styles.tab,
    (hoveredTab === tabType || focusedTab === tabType) && styles.hoveredTab,
    activeTab === tabType && styles.activeTab,
    pressed && styles.tabPressed,
  ];

  const getCurrentNetworkLog = () => {
    if (!requestData) return null;
    return networkLogs.find(log =>
      log.request.timestamp >= requestTimestamp - 1000  // Allow 1 second buffer
    );
  };

  const renderCurrentTab = () => {
    const currentLog = getCurrentNetworkLog();

    return (
      <View>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>API Request</Text>
            <View style={styles.content}>
              {requestData ? (
                <Text style={styles.content} selectable={true}>{requestData}</Text>
              ) : (
                <Text style={styles.placeholder}>No API request</Text>
              )}
            </View>
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>API Response</Text>
            <View style={styles.content}>
              {content && content.length > 0 ? (
                <Text style={styles.content} selectable={true}>{content}</Text>
              ) : (
                <Text style={styles.placeholder}>No API response</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Network Request</Text>
            <View style={styles.content}>
              {currentLog ? (
                formatNetworkRequest(currentLog.request)
              ) : (
                <Text style={styles.placeholder}>No network request</Text>
              )}
            </View>
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Network Response</Text>
            <View style={styles.content}>
              {currentLog ? (
                formatNetworkResponse(currentLog.response)
              ) : (
                <Text style={styles.placeholder}>No network response</Text>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderHistoryTab = () => (
    <View>
      <Text style={styles.title}>Network History</Text>
      <ScrollView
        style={styles.historyScroll}
        showsVerticalScrollIndicator={true}>
        {networkLogs.map((log, index) => (
          <NetworkLogCard
            key={index}
            log={log}
            isSelected={selectedLog === log}
            onPress={() => setSelectedLog(log === selectedLog ? null : log)}
          >
            <View style={styles.expandedContent}>
              <Text style={styles.sectionTitle}>Request:</Text>
              <View style={styles.content}>
                {formatNetworkRequest(log.request)}
              </View>
              <Text style={styles.sectionTitle}>Response:</Text>
              <View style={styles.content}>
                {formatNetworkResponse(log.response)}
              </View>
            </View>
          </NetworkLogCard>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.panel}>
      <View style={styles.tabs}>
        <Pressable
          onPress={() => setActiveTab('current')}
          onHoverIn={() => setHoveredTab('current')}
          onHoverOut={() => setHoveredTab(null)}
          onFocus={() => setFocusedTab('current')}
          onBlur={() => setFocusedTab(null)}
          style={({ pressed }) => getTabStyle('current', pressed)}>
          <View style={styles.tabContent}>
            <Text style={[
              styles.tabText,
              (hoveredTab === 'current' || focusedTab === 'current') && styles.hoveredTabText,
              activeTab === 'current' && styles.activeTabText
            ]}>
              Current Request
            </Text>
            {activeTab === 'current' && <View style={styles.tabIndicator} />}
          </View>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('history')}
          onHoverIn={() => setHoveredTab('history')}
          onHoverOut={() => setHoveredTab(null)}
          onFocus={() => setFocusedTab('history')}
          onBlur={() => setFocusedTab(null)}
          style={({ pressed }) => getTabStyle('history', pressed)}>
          <View style={styles.tabContent}>
            <Text style={[
              styles.tabText,
              (hoveredTab === 'history' || focusedTab === 'history') && styles.hoveredTabText,
              activeTab === 'history' && styles.activeTabText
            ]}>
              History ({networkLogs.length})
            </Text>
            {activeTab === 'history' && <View style={styles.tabIndicator} />}
          </View>
        </Pressable>
      </View>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={true}
        persistentScrollbar={true}>
        {activeTab === 'current' ? renderCurrentTab() : renderHistoryTab()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    width: '30%',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginLeft: 20,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#64B5F6',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scrollView: {
    flex: 1,
    paddingRight: 8,
    minHeight: 0,
    '::-webkit-scrollbar': {
      width: '8px',
    },
    '::-webkit-scrollbar-thumb': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '4px',
    },
  },
  content: {
    color: 'white',
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 20,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12,
  },
  placeholder: {
    fontStyle: 'italic',
    opacity: 0.7,
    color: 'white',
  },
  logItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedLog: {
    backgroundColor: 'rgba(100, 181, 246, 0.1)',
  },
  logTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  logStatus: {
    color: '#64B5F6',
    fontSize: 12,
  },
  logDetails: {
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  column: {
    flex: 1,
    marginHorizontal: 8,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
  },
  tabContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    position: 'relative',
  },
  tabPressed: {
    backgroundColor: 'rgba(100, 181, 246, 0.1)',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#64B5F6',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#64B5F6',
  },
  label: {
    color: '#64B5F6',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 4,
  },
  value: {
    color: 'white',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 8,
    borderRadius: 4,
  },
  contentContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#64B5F6',
  },
  historyScroll: {
    flex: 1,
  },
  expandedContent: {
    marginTop: 12,
    padding: 8,
  },
  hoveredTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  hoveredTabText: {
    color: 'white',
  },
});
