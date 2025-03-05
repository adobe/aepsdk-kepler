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

export type NetworkRequest = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
};

export type NetworkResponse = {
  status: number;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
};

export type NetworkLog = {
  request: NetworkRequest;
  response: NetworkResponse;
};

class NetworkMonitor {
  private static logs: NetworkLog[] = [];
  private static listeners: ((logs: NetworkLog[]) => void)[] = [];

  static initialize() {
    const originalFetch = global.fetch;
    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const request: NetworkRequest = {
        url: typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
        method: init?.method || 'GET',
        headers: init?.headers ? Object.fromEntries(Object.entries(init.headers)) : {},
        body: init?.body ?
          (typeof init.body === 'string' ? init.body : JSON.stringify(init.body))
          : undefined,
        timestamp: Date.now(),
      };

      try {
        const response = await originalFetch(input, init);
        const responseClone = response.clone();
        const responseBody = await responseClone.text();

        // Convert Headers to plain object
        const headerObj: Record<string, string> = {};
        response.headers.forEach((value: string, key: string) => {
          headerObj[key] = value;
        });

        const networkLog: NetworkLog = {
          request,
          response: {
            status: response.status,
            headers: headerObj,
            body: responseBody,
            timestamp: Date.now(),
          },
        };

        this.logs.push(networkLog);
        this.notifyListeners();
        return response;
      } catch (error: unknown) {
        const networkLog: NetworkLog = {
          request,
          response: {
            status: 0,
            headers: {},
            body: error instanceof Error ? error.message : String(error),
            timestamp: Date.now(),
          },
        };
        this.logs.push(networkLog);
        this.notifyListeners();
        throw error;
      }
    };
  }

  static addListener(listener: (logs: NetworkLog[]) => void) {
    this.listeners.push(listener);
  }

  static removeListener(listener: (logs: NetworkLog[]) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  static clearLogs() {
    this.logs = [];
    this.notifyListeners();
  }

  private static notifyListeners() {
    this.listeners.forEach(listener => listener([...this.logs]));
  }
}

export { NetworkMonitor };
