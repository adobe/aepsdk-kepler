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

  verbose(extension: string, tag: string, message: string): void;
  debug(extension: string, tag: string, message: string): void;
  warning(extension: string, tag: string, message: string): void;
  error(extension: string, tag: string, message: string): void;
}

export class DefaultLogging implements Logging {
  private currentLogLevel: LogLevel = LogLevel.ERROR;

  getLogLevel(): LogLevel {
    return this.currentLogLevel;
  }

  setLogLevel(level: LogLevel): void {
    this.currentLogLevel = level;
  }

  verbose(extension: string, tag: string, message: string): void {
    if (this.currentLogLevel >= LogLevel.VERBOSE) {
      this.print(extension, tag, message);
    }
  }

  debug(extension: string, tag: string, message: string): void {
    if (this.currentLogLevel >= LogLevel.DEBUG) {
      this.print(extension, tag, message);
    }
  }

  warning(extension: string, tag: string, message: string): void {
    if (this.currentLogLevel >= LogLevel.WARNING) {
      this.print(extension, tag, message);
    }
  }

  error(extension: string, tag: string, message: string): void {
    if (this.currentLogLevel >= LogLevel.ERROR) {
      this.print(extension, tag, message);
    }
  }

  private print(extension: string, tag: string, message: string): void {
    console.log(`[${extension}][${tag}]${message}`);
  }
}

export const defaultLogging: Logging = new DefaultLogging();
