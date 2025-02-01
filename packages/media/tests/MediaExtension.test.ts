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

import { MediaExtension } from "../src/MediaExtension";
import { ExtensionContainer } from "@adobe/kepler-aepcore/dist/core/extension";
import { ServiceLookup } from "@adobe/kepler-aepcore/dist/core/services";
import { Event, EventType, EventSource } from "@adobe/kepler-aepcore/dist/core/eventhub";
import { MediaSessionManager } from "../src/MediaSessionManager";
import { EventData } from "@adobe/kepler-aepcore/dist/core/eventhub";
import { Log } from "@adobe/kepler-aepcore/dist/core/utils/Log";
import { MediaHit } from "../src/MediaHit";
import { MediaConstants } from "../src/MediaConstants";

jest.mock("../src/MediaSessionManager");
jest.mock("@adobe/kepler-aepcore/dist/core/utils/Log");

describe("MediaExtension tests", () => {
  let mediaExtension: MediaExtension;
  let mockContainer: jest.Mocked<ExtensionContainer>;
  let mockServiceLookup: jest.Mocked<ServiceLookup>;
  let mockDispatchFn: jest.Mock;

  beforeEach(() => {
    mediaExtension = new MediaExtension();
    mockContainer = {
      dispatch: jest.fn(),
      registerEventListener: jest.fn(),
    } as unknown as jest.Mocked<ExtensionContainer>;

    mockServiceLookup = {} as jest.Mocked<ServiceLookup>;

    mockDispatchFn = jest.fn();
    (MediaSessionManager as jest.Mock).mockImplementation(() => ({
      startSession: jest.fn(),
      process: jest.fn(),
      notifyBackendSessionId: jest.fn(),
      notifyErrorResponse: jest.fn(),
    }));
  });

  test("MediaExtension should be defined", () => {
    expect(mediaExtension).toBeDefined();
    expect(mediaExtension.name).toBe("com.adobe.edge.media");
    expect(mediaExtension.version).toBe("1.0.0-beta.1");
  });

  test("onRegister should initialize MediaExtension", async () => {
    await mediaExtension.onRegister(mockContainer, mockServiceLookup);

    expect(mediaExtension.isActive()).toBe(true);
    expect(mediaExtension["container"]).toBe(mockContainer);
    expect(mediaExtension["serviceLookup"]).toBe(mockServiceLookup);
    expect(mediaExtension["dispatchFn"]).toBeDefined();
    expect(MediaSessionManager).toHaveBeenCalledWith(mediaExtension["dispatchFn"]);
    expect(mockContainer.registerEventListener).toHaveBeenCalledTimes(4);
  });

  test("dispatchEvent should call container.dispatch when active", async () => {
    await mediaExtension.onRegister(mockContainer, mockServiceLookup);

    const event = Event.builder("Test event", EventType.MEDIA, EventSource.REQUEST_CONTENT).build();
    mediaExtension.dispatchEvent(event);

    expect(mockContainer.dispatch).toHaveBeenCalledWith(event);
  });

  test("dispatchEvent should not call container.dispatch when inactive", () => {
    mediaExtension.onUnregister();

    const event = Event.builder("Test event", EventType.MEDIA, EventSource.REQUEST_CONTENT).build();
    mediaExtension.dispatchEvent(event);

    expect(mockContainer.dispatch).not.toHaveBeenCalled();
  });

  test("createMediaSession should call startSession on MediaSessionManager", () => {
    mediaExtension["mediaSessionManager"] = new MediaSessionManager(mockDispatchFn);

    const eventData = EventData.buildFrom({
      sessionId: "testSessionId",
      xdm: { eventType: MediaConstants.EventType.SESSION_START, key: "value", key1: 1 },
    });
    const event = Event.builder(
      "createMediaSession",
      EventType.MEDIA,
      EventSource.REQUEST_CONTENT,
      eventData
    ).build();
    mediaExtension["createMediaSession"](event);

    // parent id of the media hit should be the event uuid
    // timestamp of the media hit should be the event timestamp
    const expectedSessionStartHit = new MediaHit(
      "testSessionId",
      event.uuid,
      MediaConstants.EventType.SESSION_START,
      event.timestamp,
      {
        xdm: { eventType: "media.sessionStart", key: "value", key1: 1 },
      }
    );

    expect(mediaExtension["mediaSessionManager"]!.startSession).toHaveBeenCalledWith(
      expectedSessionStartHit
    );
  });

  test("createMediaSession should log error if event data is missing", () => {
    const logErrorSpy = jest.spyOn(Log, "error").mockImplementation();
    const event = Event.builder(
      "createMediaSession",
      EventType.MEDIA,
      EventSource.REQUEST_CONTENT
    ).build();

    mediaExtension["createMediaSession"](event);

    expect(logErrorSpy).toHaveBeenCalledWith(
      "com.adobe.edge.media",
      "MediaExtension",
      expect.stringContaining("Invalid event data or type")
    );
    logErrorSpy.mockRestore();
  });

  test("sendMediaEvent should call process on MediaSessionManager", () => {
    mediaExtension["mediaSessionManager"] = new MediaSessionManager(mockDispatchFn);

    const eventData = EventData.buildFrom({
      sessionId: "testSessionId",
      xdm: {
        eventType: MediaConstants.EventType.PLAY,
        key: "value",
        key1: 1,
      },
    });
    const event = Event.builder(
      "sendMediaEvent",
      EventType.MEDIA,
      EventSource.REQUEST_CONTENT,
      eventData
    ).build();

    const expectedPlayHit = new MediaHit(
      "testSessionId",
      event.uuid,
      "media.play",
      event.timestamp,
      {
        xdm: { eventType: MediaConstants.EventType.PLAY, key: "value", key1: 1 },
      }
    );

    mediaExtension["sendMediaEvent"](event);

    expect(mediaExtension["mediaSessionManager"]!.process).toHaveBeenCalledWith(expectedPlayHit);
  });

  test("sendMediaEvent should log error if event data is missing", () => {
    const logErrorSpy = jest.spyOn(Log, "error").mockImplementation();
    const event = Event.builder(
      "sendMediaEvent",
      EventType.MEDIA,
      EventSource.REQUEST_CONTENT,
      null
    ).build();

    mediaExtension["sendMediaEvent"](event);

    expect(logErrorSpy).toHaveBeenCalledWith(
      "com.adobe.edge.media",
      "MediaExtension",
      expect.stringContaining("Invalid event data or type")
    );
    logErrorSpy.mockRestore();
  });

  test("notifyBackendSessionId should call notifyBackendSessionId on MediaSessionManager", () => {
    mediaExtension["mediaSessionManager"] = new MediaSessionManager(mockDispatchFn);

    const eventData = EventData.buildFrom({ payload: [{ sessionId: "testSessionId" }] });
    const event = Event.builder(
      "session Id response",
      EventType.EDGE,
      EventSource.REQUEST_CONTENT,
      eventData
    )
      .setParentId("testRequestId")
      .build();

    mediaExtension["notifyBackendSessionId"](event);

    expect(mediaExtension["mediaSessionManager"]!.notifyBackendSessionId).toHaveBeenCalledWith(
      "testRequestId",
      "testSessionId"
    );
  });

  test("notifyErrorResponse should call notifyErrorResponse on MediaSessionManager", () => {
    mediaExtension["mediaSessionManager"] = new MediaSessionManager(mockDispatchFn);

    const errorData = EventData.buildFrom({ error: "testError" });
    const event = Event.builder(
      "Edge error response",
      EventType.EDGE,
      EventSource.ERROR_RESPONSE_CONTENT,
      errorData
    )
      .setParentId("testRequestId")
      .build();

    mediaExtension["notifyErrorResponse"](event);

    expect(mediaExtension["mediaSessionManager"]!.notifyErrorResponse).toHaveBeenCalledWith(
      "testRequestId",
      { error: "testError" }
    );
  });

  test("onUnregister should deactivate the extension", () => {
    mediaExtension.onUnregister();
    expect(mediaExtension.isActive()).toBe(false);
  });
});
