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

import { MediaSessionManager } from "../src/MediaSessionManager";
import { MediaHit } from "../src/MediaHit";

describe("MediaSessionManager tests", () => {
  test("MediaSessionManager should be defined", () => {
    const mediaSessionManager = new MediaSessionManager();
    expect(mediaSessionManager).toBeDefined();
  });

  test("startSession - should start a new session", () => {
    const mediaSessionManager = new MediaSessionManager();
    expect(mediaSessionManager.startSession("sessionId", {})).toBe(true);
    expect(mediaSessionManager.activeSessions["sessionId"]).toBeDefined();
    expect(mediaSessionManager.getSession("sessionId")).toBeDefined();
  });

  test("startSession - should not start a new session if session already exists", () => {
    const mediaSessionManager = new MediaSessionManager();
    expect(mediaSessionManager.startSession("sessionId", {})).toBe(true);
    expect(mediaSessionManager.startSession("sessionId", {})).toBe(false);
  });

  test("queue - should queue a media hit with the session", () => {
    const mediaSessionManager = new MediaSessionManager();
    mediaSessionManager.startSession("sessionId", {});

    const mediaSession = mediaSessionManager.getSession("sessionId");
    jest.spyOn(mediaSession!, "process");

    const hit = new MediaHit("uuid", "eventType", 123456, { xdm: "data" });
    mediaSessionManager.queue("sessionId", hit);

    expect(mediaSession!.process).toHaveBeenCalledTimes(1);
    expect(mediaSession!.process).toHaveBeenCalledWith(hit);
  });

  test("queue - should queue multiple media hits with different session", () => {
    const mediaSessionManager = new MediaSessionManager();
    mediaSessionManager.startSession("sessionId1", {});
    mediaSessionManager.startSession("sessionId2", {});
    mediaSessionManager.startSession("sessionId3", {});

    const mediaSession1 = mediaSessionManager.getSession("sessionId1");
    jest.spyOn(mediaSession1!, "process");
    const mediaSession2 = mediaSessionManager.getSession("sessionId2");
    jest.spyOn(mediaSession2!, "process");
    const mediaSession3 = mediaSessionManager.getSession("sessionId3");
    jest.spyOn(mediaSession3!, "process");

    const hit1 = new MediaHit("uuid1", "eventType1", 123456, { xdm: "data1" });
    const hit2 = new MediaHit("uuid2", "eventType2", 123456, { xdm: "data2" });
    const hit3 = new MediaHit("uuid3", "eventType3", 123456, { xdm: "data3" });

    mediaSessionManager.queue("sessionId1", hit1);
    mediaSessionManager.queue("sessionId1", hit2);
    mediaSessionManager.queue("sessionId2", hit2);
    mediaSessionManager.queue("sessionId2", hit3);
    mediaSessionManager.queue("sessionId3", hit3);
    mediaSessionManager.queue("sessionId3", hit1);

    expect(mediaSession1!.process).toHaveBeenCalledTimes(2);
    expect(mediaSession1!.process).toHaveBeenNthCalledWith(1, hit1);
    expect(mediaSession1!.process).toHaveBeenNthCalledWith(2, hit2);

    expect(mediaSession2!.process).toHaveBeenCalledTimes(2);
    expect(mediaSession2!.process).toHaveBeenNthCalledWith(1, hit2);
    expect(mediaSession2!.process).toHaveBeenNthCalledWith(2, hit3);

    expect(mediaSession3!.process).toHaveBeenCalledTimes(2);
    expect(mediaSession3!.process).toHaveBeenNthCalledWith(1, hit3);
    expect(mediaSession3!.process).toHaveBeenNthCalledWith(2, hit1);
  });

  test("queue - should not queue hit if the session is inactive or does not exist", () => {
    const mediaSessionManager = new MediaSessionManager();
    const hit = new MediaHit("uuid", "eventType", 123456, { xdm: "data" });

    expect(mediaSessionManager.queue("sessionId", hit)).toBe(false);
  });

  test("endSession - should end the session and remove from active session map", () => {
    const mediaSessionManager = new MediaSessionManager();
    mediaSessionManager.startSession("sessionId", {});
    expect(mediaSessionManager.endSession("sessionId")).toBe(true);
    expect(mediaSessionManager.getSession("sessionId")).toBe(null);
  });

  test("endSession - should not end the session if it is not active", () => {
    const mediaSessionManager = new MediaSessionManager();
    expect(mediaSessionManager.endSession("sessionId")).toBe(false);
  });

  test("endSession - should not end the session if it does not exist", () => {
    const mediaSessionManager = new MediaSessionManager();
    mediaSessionManager.startSession("sessionId1", {});

    expect(mediaSessionManager.endSession("sessionId2")).toBe(false);
  });

  test("endSession - with multiple sessions present, should not affect other sessions", () => {
    const mediaSessionManager = new MediaSessionManager();
    mediaSessionManager.startSession("sessionId1", {});
    mediaSessionManager.startSession("sessionId2", {});
    mediaSessionManager.startSession("sessionId3", {});

    mediaSessionManager.endSession("sessionId2");

    expect(mediaSessionManager.getSession("sessionId1")).toBeDefined();
    expect(mediaSessionManager.getSession("sessionId2")).toBe(null);
    expect(mediaSessionManager.getSession("sessionId3")).toBeDefined();
  });

  test("endAllSessions - should end all active sessions", () => {
    const mediaSessionManager = new MediaSessionManager();
    mediaSessionManager.startSession("sessionId1", {});
    mediaSessionManager.startSession("sessionId2", {});
    mediaSessionManager.startSession("sessionId3", {});

    mediaSessionManager.endAllSessions();

    expect(mediaSessionManager.getSession("sessionId1")).toBe(null);
    expect(mediaSessionManager.getSession("sessionId2")).toBe(null);
    expect(mediaSessionManager.getSession("sessionId3")).toBe(null);
  });

  test("getSession - should return session if it exists", () => {
    const mediaSessionManager = new MediaSessionManager();
    mediaSessionManager.startSession("sessionId", {});
    expect(mediaSessionManager.getSession("sessionId")).toBeDefined();
  });

  test("getSession - should return undefined if session does not exist", () => {
    const mediaSessionManager = new MediaSessionManager();
    expect(mediaSessionManager.getSession("sessionId")).toBe(null);
  });

  test("deleteSession - should delete session if it exists", () => {
    const mediaSessionManager = new MediaSessionManager();
    mediaSessionManager.startSession("sessionId", {});
    mediaSessionManager.deleteSession("sessionId");
    expect(mediaSessionManager.getSession("sessionId")).toBe(null);
  });

  test("deleteSession - should not crash if session does not exist", () => {
    const mediaSessionManager = new MediaSessionManager();
    mediaSessionManager.deleteSession("sessionId");
    expect(mediaSessionManager.getSession("sessionId")).toBe(null);
  });

  test("isSessionActive - should return true if session is active", () => {
    const mediaSessionManager = new MediaSessionManager();
    mediaSessionManager.startSession("sessionId", {});
    expect(mediaSessionManager.isSessionActive("sessionId")).toBe(true);
  });

  test("isSessionActive - should return false if session is not active", () => {
    const mediaSessionManager = new MediaSessionManager();
    expect(mediaSessionManager.isSessionActive("sessionId")).toBe(false);
  });

  // TODO: Add tests for methods like notifySessionUpdate, notifyErrorResponse etc.
  // TODO: update tests to add check for proper methods being called for MediaSession
});
