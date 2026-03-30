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

import { MediaSessionManager } from "../src/MediaSessionManager";
import { MediaHit } from "../src/MediaHit";

const mockDispatchFn = jest.fn();

describe("MediaSessionManager tests", () => {
  test("MediaSessionManager should be defined", () => {
    const mediaSessionManager = new MediaSessionManager(mockDispatchFn);
    expect(mediaSessionManager).toBeDefined();
  });

  test("startSession - should start a new session with session start event", () => {
    const mediaSessionManager = new MediaSessionManager(mockDispatchFn);

    const sessionStartHit = new MediaHit(
      "testPlayerId",
      "testParentId",
      "media.sessionStart",
      123456,
      {
        playerId: "testPlayerId",
        xdm: {
          key: "value",
        },
      }
    );

    // Starting the session with the event
    expect(mediaSessionManager.startSession(sessionStartHit, {})).toBe(true);
    const session = mediaSessionManager.getSession("testPlayerId");
    expect(session).toBeDefined();
    expect(session?.getPlayerId()).toBe("testPlayerId");
  });

  test("startSession - should not start a new session if session already exists", () => {
    const mediaSessionManager = new MediaSessionManager(mockDispatchFn);

    // Building the session start event data
    const sessionStartHit = new MediaHit(
      "testPlayerId",
      "testParentId",
      "media.sessionStart",
      123456,
      {
        xdm: {
          key: "value",
        },
      }
    );

    // Starting the session with the event
    expect(mediaSessionManager.startSession(sessionStartHit, {})).toBe(true);
    // Trying to start the same session again
    expect(mediaSessionManager.startSession(sessionStartHit, {})).toBe(false);
  });

  test("process - should queue a media hit with the session", () => {
    const mediaSessionManager = new MediaSessionManager(mockDispatchFn);

    // Start a session
    const sessionStartHit = new MediaHit(
      "testSessionId",
      "testParentId",
      "media.sessionStart",
      123456,
      {
        xdm: {
          eventType: "media.sessionStart",
          key: "value",
        },
        data: {
          key: "value",
        },
        config: {
          key: "value",
        },
      }
    );

    mediaSessionManager.startSession(sessionStartHit, {});

    const mediaSession = mediaSessionManager.getSession("testSessionId");
    jest.spyOn(mediaSession!, "process");

    mediaSessionManager.process(sessionStartHit);

    expect(mediaSession!.process).toHaveBeenCalledTimes(1);
    expect(mediaSession!.process).toHaveBeenCalledWith(sessionStartHit);
  });

  test("process - Called with multiple media events should queue all media hits with the session", () => {
    const mediaSessionManager = new MediaSessionManager(mockDispatchFn);

    // Start a session
    const sessionStartHit = new MediaHit(
      "testSessionId",
      "testParentId",
      "media.sessionStart",
      123456,
      {
        xdm: {
          eventType: "media.sessionStart",
          key: "value",
        },
        data: {
          key: "value",
        },
        config: {
          key: "value",
        },
      }
    );
    mediaSessionManager.startSession(sessionStartHit, {});

    const playHit = new MediaHit("testSessionId", "testParentId", "media.play", 123457, {
      xdm: {
        eventType: "media.play",
        key: "value",
      },
      data: {
        key: "value",
      },
      config: {
        key: "value",
      },
    });

    const sessionCompleteHit = new MediaHit(
      "testSessionId",
      "testParentId",
      "media.sessionComplete",
      123458,
      {
        xdm: {
          eventType: "media.sessionComplete",
          key: "value",
        },
        data: {
          key: "value",
        },
        config: {
          key: "value",
        },
      }
    );

    const mediaSession = mediaSessionManager.getSession("testSessionId");
    jest.spyOn(mediaSession!, "process");

    mediaSessionManager.process(sessionStartHit);
    mediaSessionManager.process(playHit);
    mediaSessionManager.process(sessionCompleteHit);

    expect(mediaSession!.process).toHaveBeenCalledTimes(3);
    expect(mediaSession!.process).toHaveBeenNthCalledWith(1, sessionStartHit);
    expect(mediaSession!.process).toHaveBeenNthCalledWith(2, playHit);
    expect(mediaSession!.process).toHaveBeenNthCalledWith(3, sessionCompleteHit);
  });

  test("process - when sessionComplete event is received, should end the session", () => {
    const mediaSessionManager = new MediaSessionManager(mockDispatchFn);

    const sessionStartHit = new MediaHit(
      "testSessionId",
      "testParentId",
      "media.sessionStart",
      123456,
      {
        xdm: {
          eventType: "media.sessionStart",
          key: "value",
        },
      }
    );

    const sessionCompleteHit = new MediaHit(
      "testSessionId",
      "testParentId",
      "media.sessionComplete",
      123457,
      {
        xdm: {
          eventType: "media.sessionComplete",
          key: "value",
        },
      }
    );

    // start the session
    mediaSessionManager.startSession(sessionStartHit, {});

    const mediaSession = mediaSessionManager.getSession("testSessionId");
    jest.spyOn(mediaSession!, "process");

    mediaSessionManager.process(sessionStartHit);

    mediaSessionManager.process(sessionCompleteHit);

    expect(mediaSession!.process).toHaveBeenCalledTimes(2);
    expect(mediaSession!.process).toHaveBeenNthCalledWith(2, sessionCompleteHit);
    expect(mediaSessionManager.getSession("testSessionId")).toBe(null);
  });

  test("process - when sessionEnd event is received, should end the session", () => {
    const mediaSessionManager = new MediaSessionManager(mockDispatchFn);

    // Start a session
    const sessionStartHit = new MediaHit(
      "testSessionId",
      "testParentId",
      "media.sessionStart",
      123456,
      {
        xdm: {
          eventType: "media.sessionStart",
          key: "value",
        },
      }
    );

    const sessionEndHit = new MediaHit(
      "testSessionId",
      "testParentId",
      "media.sessionEnd",
      123457,
      {
        xdm: {
          eventType: "media.sessionEnd",
          key: "value",
        },
      }
    );

    mediaSessionManager.startSession(sessionStartHit, {});

    const mediaSession = mediaSessionManager.getSession("testSessionId");
    jest.spyOn(mediaSession!, "process");

    mediaSessionManager.process(sessionStartHit);

    mediaSessionManager.process(sessionEndHit);

    expect(mediaSession!.process).toHaveBeenCalledTimes(2);
    expect(mediaSession!.process).toHaveBeenNthCalledWith(2, sessionEndHit);
    expect(mediaSessionManager.getSession("testSessionId")).toBe(null);
  });

  test("process - should not queue hit if the session is inactive or does not exist", () => {
    const mediaSessionManager = new MediaSessionManager(mockDispatchFn);

    const sessionStartHit = new MediaHit(
      "testSessionId",
      "testParentId",
      "media.sessionStart",
      123456,
      {
        xdm: {
          eventType: "media.sessionStart",
          key: "value",
        },
      }
    );

    // Trying to queue hit for non-existing session
    expect(mediaSessionManager.process(sessionStartHit)).toBe(false);
  });

  test("endSession - should end the session and remove from active session map", () => {
    const mediaSessionManager = new MediaSessionManager(mockDispatchFn);

    const sessionStartHit = new MediaHit(
      "testSessionId",
      "testParentId",
      "media.sessionStart",
      123456,
      {
        xdm: {
          eventType: "media.sessionStart",
          key: "value",
        },
      }
    );

    mediaSessionManager.startSession(sessionStartHit, {});

    // End the session
    expect(mediaSessionManager.endSession("testSessionId")).toBe(true);
    expect(mediaSessionManager.getSession("testSessionId")).toBe(null);
  });

  test("endSession - should not end the session if it is not active", () => {
    const mediaSessionManager = new MediaSessionManager(mockDispatchFn);
    expect(mediaSessionManager.endSession("sessionStart event")).toBe(false);
  });

  test("getSession - should return session if it exists", () => {
    const mediaSessionManager = new MediaSessionManager(mockDispatchFn);

    // Start a session
    const sessionStartHit = new MediaHit(
      "testSessionId",
      "testParentId",
      "media.sessionStart",
      123456,
      {
        xdm: {
          eventType: "media.sessionStart",
          key: "value",
        },
      }
    );

    mediaSessionManager.startSession(sessionStartHit, {});

    // Check the session
    expect(mediaSessionManager.getSession("testSessionId")).toBeDefined();
  });

  test("getSession - should return null if session does not exist", () => {
    const mediaSessionManager = new MediaSessionManager(mockDispatchFn);
    expect(mediaSessionManager.getSession("testSessionId")).toBe(null);
  });

  test("endAllSessions - should end all active sessions", () => {
    const mediaSessionManager = new MediaSessionManager(mockDispatchFn);

    // Start multiple sessions
    const sessionStartHit1 = new MediaHit(
      "testSessionId1",
      "testParentId",
      "media.sessionStart",
      123456,
      {
        xdm: {
          eventType: "media.sessionStart",
          key: "value",
        },
      }
    );
    mediaSessionManager.startSession(sessionStartHit1, {});

    const sessionStartHit2 = new MediaHit(
      "testSessionId2",
      "testParentId",
      "media.sessionStart",
      123457,
      {
        xdm: {
          eventType: "media.sessionStart",
          key: "value",
        },
      }
    );
    mediaSessionManager.startSession(sessionStartHit2, {});

    // End all sessions
    mediaSessionManager.endAllSessions();

    expect(mediaSessionManager.getSession("testSessionId1")).toBe(null);
    expect(mediaSessionManager.getSession("testSessionId2")).toBe(null);
  });
});
