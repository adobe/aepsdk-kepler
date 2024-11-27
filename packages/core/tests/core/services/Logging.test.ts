/*
Copyright 2024 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/
import { LogLevel, DefaultLogging } from "../../../src/core/services/Logging";
describe("test Logging service", () => {
  let loggingService: DefaultLogging;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    loggingService = new DefaultLogging();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  test("test log level", () => {
    const defaultLogLevel = loggingService.getLogLevel();
    expect(defaultLogLevel).toEqual(LogLevel.ERROR);

    loggingService.setLogLevel(LogLevel.WARNING);
    expect(loggingService.getLogLevel()).toEqual(LogLevel.WARNING);

    loggingService.setLogLevel(LogLevel.DEBUG);
    expect(loggingService.getLogLevel()).toEqual(LogLevel.DEBUG);

    loggingService.setLogLevel(LogLevel.ERROR);
    expect(loggingService.getLogLevel()).toEqual(LogLevel.ERROR);

    loggingService.setLogLevel(LogLevel.VERBOSE);
    expect(loggingService.getLogLevel()).toEqual(LogLevel.VERBOSE);
  });

  test("test VERBOSE logs", () => {
    loggingService.setLogLevel(LogLevel.VERBOSE);
    loggingService.verbose("ext", "tag", "message");
    expect(consoleLogSpy).toBeCalledWith("[ext][tag]message");

    consoleLogSpy.mockReset();

    loggingService.setLogLevel(LogLevel.DEBUG);
    loggingService.verbose("ext", "tag", "message");
    loggingService.setLogLevel(LogLevel.ERROR);
    loggingService.verbose("ext", "tag", "message");
    loggingService.setLogLevel(LogLevel.WARNING);
    loggingService.verbose("ext", "tag", "message");
    expect(consoleLogSpy).not.toBeCalled();
  });

  test("test DEBUG logs", () => {
    loggingService.setLogLevel(LogLevel.DEBUG);
    loggingService.debug("ext", "tag", "message");
    expect(consoleLogSpy).toBeCalledWith("[ext][tag]message");

    consoleLogSpy.mockReset();

    loggingService.setLogLevel(LogLevel.VERBOSE);
    loggingService.debug("ext", "tag", "message");
    expect(consoleLogSpy).toBeCalledWith("[ext][tag]message");

    consoleLogSpy.mockReset();

    loggingService.setLogLevel(LogLevel.ERROR);
    loggingService.debug("ext", "tag", "message");
    loggingService.setLogLevel(LogLevel.WARNING);
    loggingService.debug("ext", "tag", "message");
    expect(consoleLogSpy).not.toBeCalled();
  });

  test("test WARNING logs", () => {
    loggingService.setLogLevel(LogLevel.VERBOSE);
    loggingService.warning("ext", "tag", "message");
    expect(consoleLogSpy).toBeCalledWith("[ext][tag]message");

    consoleLogSpy.mockReset();

    loggingService.setLogLevel(LogLevel.DEBUG);
    loggingService.warning("ext", "tag", "message");
    expect(consoleLogSpy).toBeCalledWith("[ext][tag]message");

    consoleLogSpy.mockReset();

    loggingService.setLogLevel(LogLevel.WARNING);
    loggingService.warning("ext", "tag", "message");
    expect(consoleLogSpy).toBeCalledWith("[ext][tag]message");

    consoleLogSpy.mockReset();

    loggingService.setLogLevel(LogLevel.ERROR);
    loggingService.warning("ext", "tag", "message");
    expect(consoleLogSpy).not.toBeCalled();
  });

  test("test ERROR logs", () => {
    loggingService.setLogLevel(LogLevel.VERBOSE);
    loggingService.error("ext", "tag", "message");
    expect(consoleLogSpy).toBeCalledWith("[ext][tag]message");

    consoleLogSpy.mockReset();

    loggingService.setLogLevel(LogLevel.DEBUG);
    loggingService.error("ext", "tag", "message");
    expect(consoleLogSpy).toBeCalledWith("[ext][tag]message");

    consoleLogSpy.mockReset();

    loggingService.setLogLevel(LogLevel.WARNING);
    loggingService.error("ext", "tag", "message");
    expect(consoleLogSpy).toBeCalledWith("[ext][tag]message");

    consoleLogSpy.mockReset();

    loggingService.setLogLevel(LogLevel.ERROR);
    loggingService.error("ext", "tag", "message");
    expect(consoleLogSpy).toBeCalledWith("[ext][tag]message");
  });
});
