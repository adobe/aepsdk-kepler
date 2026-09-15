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

/**
 * Waits until the mocked global.fetch has been idle (no new calls) for `idleMs`,
 * or `timeout` elapses. Event-driven replacement for a fixed setTimeout: it waits
 * for the SDK's asynchronous / trailing Edge dispatches to complete over the real
 * network, and — because it waits for quiescence rather than a target count — it
 * also lets "dropped hit" cases settle without a spurious extra request.
 */
export async function waitForFetchIdle(
  idleMs: number = 1000,
  timeout: number = 15000,
  pollMs: number = 100
): Promise<void> {
  const fetchMock = global.fetch as jest.Mock;
  const start = Date.now();
  let lastCount = fetchMock.mock.calls.length;
  let stableSince = Date.now();

  while (Date.now() - start < timeout) {
    await new Promise(resolve => setTimeout(resolve, pollMs));
    const count = fetchMock.mock.calls.length;
    if (count !== lastCount) {
      lastCount = count;
      stableSince = Date.now();
    } else if (Date.now() - stableSince >= idleMs) {
      return;
    }
  }
}
