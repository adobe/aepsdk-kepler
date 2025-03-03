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

import { MediaHit } from "../src/MediaHit";
import { MediaSession } from "../src/MediaSession";
import { Log } from "@adobe/kepler-aepcore/dist/core/utils/Log";
import { MediaConstants } from "../src/MediaConstants";

const EVENT_TYPE = MediaConstants.EventType;

const sessionStartHit = new MediaHit(
  "testClientSessionId",
  "testParentEventId",
  EVENT_TYPE.SESSION_START,
  123456789,
  {
    xdm: {
      eventType: EVENT_TYPE.SESSION_START,
      mediaCollection: {
        sessionDetails: {
          key: "value",
        },
      },
      timestamp: 123456789,
    },
  }
);

const playHit = new MediaHit(
  "testClientSessionId",
  "testParentEventId",
  EVENT_TYPE.PLAY,
  123456789,
  {
    xdm: {
      eventType: EVENT_TYPE.PLAY,
      key: "value",
      timestamp: 123456789,
    },
  }
);

const pingHit = new MediaHit("testClientSessionId", "testParentEventId", EVENT_TYPE.PING, 61000, {
  xdm: {
    eventType: EVENT_TYPE.PING,
    timestamp: 61000,
  },
});

describe("MediaSession tests", () => {
  const mockDispatchFn: jest.Mock = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks(); // Add this to restore all mocked implementations
  });

  test("MediaSession should be defined", () => {
    const mediaSession = new MediaSession("testPlayerId", mockDispatchFn);
    expect(mediaSession).toBeDefined();
    expect(mediaSession.getPlayerId()).toBe("testPlayerId");
    expect(mediaSession.isActive()).toBe(true);
  });

  test("end() should try dispatching queued hits and end the session", () => {
    let tryDispatchMediaEventsCalledTimes = 0;
    jest
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .spyOn<any, any>(MediaSession.prototype, "tryDispatchMediaEvents")
      .mockImplementation(() => {
        // Mocked implementation
        tryDispatchMediaEventsCalledTimes++;
      });

    const mediaSession = new MediaSession("testPlayerId", mockDispatchFn);
    mediaSession.end();
    expect(mediaSession.isActive()).toBe(false);
    expect(tryDispatchMediaEventsCalledTimes).toBe(1);
  });

  test("end() should be ignored end if session is already inactive", () => {
    const logErrorSpy = jest.spyOn(Log, "error").mockImplementation();
    let tryDispatchMediaEventsCalledTimes = 0;
    jest
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .spyOn<any, any>(MediaSession.prototype, "tryDispatchMediaEvents")
      .mockImplementation(() => {
        // Mocked implementation
        tryDispatchMediaEventsCalledTimes++;
      });

    const testSessionId = "testClientSessionId";

    const mediaSession = new MediaSession(testSessionId, mockDispatchFn);
    expect(mediaSession.isActive()).toBe(true);

    mediaSession.end();
    // verify that media session is inactive
    expect(mediaSession.isActive()).toBe(false);

    // Second end call
    mediaSession.end();

    expect(tryDispatchMediaEventsCalledTimes).toBe(1);
    // expect error log for second end call
    expect(logErrorSpy).toHaveBeenCalledWith(
      "com.adobe.edge.media",
      "MediaSession",
      expect.stringContaining(
        `end() - Cannot end media session with playerId:(${testSessionId}), as it is not active.`
      )
    );
    logErrorSpy.mockRestore();
  });

  test("abort() should clear the hit queue and end the session", () => {
    let tryDispatchMediaEventsCalledTimes = 0;
    jest
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .spyOn<any, any>(MediaSession.prototype, "tryDispatchMediaEvents")
      .mockImplementation(() => {
        // Mocked implementation
        tryDispatchMediaEventsCalledTimes++;
      });

    const mediaSession = new MediaSession("testClientSessionId", mockDispatchFn);
    mediaSession.process(sessionStartHit);
    mediaSession.process(playHit);
    const hitQueue = mediaSession.getHitQueue();
    expect(hitQueue.size()).toBe(2);
    expect(tryDispatchMediaEventsCalledTimes).toBe(2);

    mediaSession.abort();
    expect(mediaSession.isActive()).toBe(false);
    expect(hitQueue.size()).toBe(0);
    // abort should not try to dispatch queued hits, so the count should remain same
    expect(tryDispatchMediaEventsCalledTimes).toBe(2);
  });

  test("abort() should be ignored if session is already inactive", () => {
    const logErrorSpy = jest.spyOn(Log, "error").mockImplementation();
    let tryDispatchMediaEventsCalledTimes = 0;
    jest
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .spyOn<any, any>(MediaSession.prototype, "tryDispatchMediaEvents")
      .mockImplementation(() => {
        // Mocked implementation
        tryDispatchMediaEventsCalledTimes++;
      });

    // mock isActive to return false
    jest.spyOn(MediaSession.prototype, "isActive").mockReturnValue(false);

    const mediaSession = new MediaSession("testClientSessionId", mockDispatchFn);

    mediaSession.abort();
    expect(mediaSession.isActive()).toBe(false);
    expect(tryDispatchMediaEventsCalledTimes).toBe(0);
    expect(logErrorSpy).toHaveBeenCalledWith(
      "com.adobe.edge.media",
      "MediaSession",
      expect.stringContaining(
        `abort() - Cannot abort media session with playerId:(${mediaSession.getPlayerId()}), as it is not active.`
      )
    );
    logErrorSpy.mockRestore();
  });

  test("process() should queue the hit and try dispatching queued hits (tryDispatchMediaEvents is mocked)", () => {
    let tryDispatchMediaEventsCalledTimes = 0;
    jest
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .spyOn<any, any>(MediaSession.prototype, "tryDispatchMediaEvents")
      .mockImplementation(() => {
        // Mocked implementation
        tryDispatchMediaEventsCalledTimes++;
      });

    const mediaSession = new MediaSession("testClientSessionId", mockDispatchFn);

    mediaSession.process(sessionStartHit);
    const hitQueue = mediaSession.getHitQueue();
    expect(hitQueue.size()).toBe(1);
    expect(hitQueue.peek()).toBe(sessionStartHit);
    expect(tryDispatchMediaEventsCalledTimes).toBe(1);
  });

  test("process() should ignore the hit if session is inactive (tryDispatchMediaEvents is mocked)", () => {
    const logErrorSpy = jest.spyOn(Log, "error").mockImplementation();
    const mediaSession = new MediaSession("testPlayerId", mockDispatchFn);
    mediaSession.end();

    mediaSession.process(sessionStartHit);
    const hitQueue = mediaSession.getHitQueue();
    expect(hitQueue.size()).toBe(0);
    expect(logErrorSpy).toHaveBeenCalledWith(
      "com.adobe.edge.media",
      "MediaSession",
      expect.stringContaining(
        `Media session with playerId:(${mediaSession.getPlayerId()}) is not active. Cannot process hits.`
      )
    );
    logErrorSpy.mockRestore();
  });

  test("process() media.sessionStart event should dispatch the hit if session is active (tryDispatchMediaEvents is not mocked)", () => {
    const mediaSession = new MediaSession("testPlayerId", mockDispatchFn);

    mediaSession.process(sessionStartHit);

    expect(mockDispatchFn).toHaveBeenCalledWith(
      expect.objectContaining({
        _parentId: "testParentEventId",
        _responseId: null,
        name: "media.sessionStart",
        type: "com.adobe.eventType.edge",
        source: "com.adobe.eventSource.requestContent",
        data: {
          data: expect.objectContaining({
            xdm: {
              eventType: EVENT_TYPE.SESSION_START,
              mediaCollection: {
                sessionDetails: {
                  key: "value",
                },
              },
              timestamp: 123456789,
            },
            request: {
              path: "/va/v1/sessionStart",
            },
          }),
        },
        uuid: expect.any(String),
        sequentialId: expect.any(Number),
        timestamp: expect.any(Number),
      })
    );
  });

  test("process() media.play event should dispatch the hit if session is active and backendSessionId is set (tryDispatchMediaEvents is not mocked)", () => {
    const mediaSession = new MediaSession("testPlayerId", mockDispatchFn);
    jest.spyOn(mediaSession, "getBackendSessionId").mockReturnValue("testBackendSessionId");

    mediaSession.process(playHit);

    expect(mockDispatchFn).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "media.play",
        type: "com.adobe.eventType.edge",
        source: "com.adobe.eventSource.requestContent",
        data: {
          data: expect.objectContaining({
            xdm: {
              eventType: EVENT_TYPE.PLAY,
              key: "value",
              mediaCollection: {
                sessionID: "testBackendSessionId",
              },
              timestamp: 123456789,
            },
            request: {
              path: "/va/v1/play",
            },
          }),
        },
      })
    );
  });

  test("process() media.play event should not dispatch the hit if session is active but backendSessionId is not set (tryDispatchMediaEvents is not mocked)", () => {
    const logDebugSpy = jest.spyOn(Log, "debug").mockImplementation();
    const mediaSession = new MediaSession("testPlayerId", mockDispatchFn);
    jest.spyOn(mediaSession, "getBackendSessionId").mockReturnValue(null);

    mediaSession.process(playHit);

    expect(mockDispatchFn).not.toHaveBeenCalled();
    expect(logDebugSpy).toHaveBeenCalledWith(
      "com.adobe.edge.media",
      "MediaSession",
      expect.stringContaining(
        `tryDispatchMediaEvents() - Waiting for backend session ID for event: ${playHit.eventType}`
      )
    );
    logDebugSpy.mockRestore();
  });

  test("process() should dispatch media event and log a warning if the time difference between events is greater than the maximum ping interval", () => {
    const logWarningSpy = jest.spyOn(Log, "warning").mockImplementation();

    const mediaSession = new MediaSession("testPlayerId", mockDispatchFn);

    jest.spyOn(mediaSession, "getBackendSessionId").mockReturnValue("testBackendSessionId");

    const testLastEventTimestamp = 1000;
    jest.spyOn(mediaSession, "getLastEventTimestamp").mockReturnValue(testLastEventTimestamp);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn<any, any>(MediaSession.prototype, "tryDispatchMediaEvents");

    mediaSession.process(pingHit);

    expect(logWarningSpy).toHaveBeenCalledWith(
      "com.adobe.edge.media",
      "MediaSession",
      expect.stringContaining(
        `Time difference between events (${
          (pingHit.timestamp - testLastEventTimestamp) / 1000
        } seconds) is greater than 50 seconds. Hits may be dropped on the server side. Please dispatch ping events more frequently.`
      )
    );
    logWarningSpy.mockRestore();
  });

  test("handleSessionUpdate() should update the backendSessionId", () => {
    const mediaSession = new MediaSession("testPlayerId", mockDispatchFn);

    //mock sessionStartRequestId
    jest.spyOn(mediaSession, "getSessionStartRequestId").mockReturnValue("testRequestId");

    mediaSession.handleSessionUpdate("testRequestId", "testBackendSessionId");
    expect(mediaSession.getBackendSessionId()).toBe("testBackendSessionId");
  });

  test("handleErrorResponse() should not abort the session if the requestId does not match the sessionStartRequestId", () => {
    const mediaSession = new MediaSession("testPlayerId", mockDispatchFn);

    jest.spyOn(mediaSession, "abort");
    jest
      .spyOn(mediaSession, "getSessionStartRequestId")
      .mockReturnValue("NotSessionStartRequestId");

    mediaSession.handleErrorResponse("testRequestId", {
      status: 400,
      type: "https://ns.adobe.com/aep/errors/va-edge-0400-400",
    });

    expect(mediaSession.isActive()).toBe(true);
    expect(mediaSession.abort).not.toHaveBeenCalled();
  });

  test("handleErrorResponse() should abort the session if the session creation fails.", () => {
    const mediaSession = new MediaSession("testPlayerId", mockDispatchFn);

    jest.spyOn(mediaSession, "abort");

    //mock getSessionStartRequestId to return testRequestId
    jest.spyOn(mediaSession, "getSessionStartRequestId").mockReturnValue("testRequestId");

    expect(mediaSession.isActive()).toBe(true);

    mediaSession.handleErrorResponse("testRequestId", {
      status: 400,
      type: "https://ns.adobe.com/aep/errors/va-edge-0400-400",
    });
    expect(mediaSession.isActive()).toBe(false);
    expect(mediaSession.abort).toHaveBeenCalled();
  });

  test("handleErrorResponse() should not abort the session if the requestId does not match the sessionStartRequestId", () => {
    const mediaSession = new MediaSession("testPlayerId", mockDispatchFn);
    jest.spyOn(mediaSession, "abort");
    jest
      .spyOn(mediaSession, "getSessionStartRequestId")
      .mockReturnValue("NotSessionStartRequestId");

    mediaSession.handleErrorResponse("testRequestId", {
      status: 400,
      type: "https://ns.adobe.com/aep/errors/va-edge-0400-400",
    });

    expect(mediaSession.isActive()).toBe(true);
    expect(mediaSession.abort).not.toHaveBeenCalled();
  });
});
