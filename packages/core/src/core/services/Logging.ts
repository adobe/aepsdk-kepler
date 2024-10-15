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

export enum LogLevel {
  ERROR = 0,
  WARNING = 1,
  DEBUG = 2,
  VERBOSE = 3,
}
export interface Logging {
  setLogLevel(level: LogLevel): void;
  getLogLevel(): LogLevel;

  verbose(tag: string, message: string): void;
  debug(tag: string, message: string): void;
  warning(tag: string, message: string): void;
  error(tag: string, message: string): void;
}

export class DefaultLogging implements Logging {
  private logLevel: LogLevel = LogLevel.ERROR;

  getLogLevel(): LogLevel {
    return this.logLevel;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  verbose(tag: string, message: string): void {
    if (this.logLevel >= LogLevel.VERBOSE) {
      this.print(tag, message);
    }
  }

  debug(tag: string, message: string): void {
    if (this.logLevel >= LogLevel.DEBUG) {
      this.print(tag, message);
    }
  }

  warning(tag: string, message: string): void {
    if (this.logLevel >= LogLevel.WARNING) {
      this.print(tag, message);
    }
  }

  error(tag: string, message: string): void {
    if (this.logLevel >= LogLevel.ERROR) {
      this.print(tag, message);
    }
  }

  private print(tag: string, message: string): void {
    console.log(`[${tag}] ${message}`);
  }
}

export const defaultLogging: Logging = new DefaultLogging();
