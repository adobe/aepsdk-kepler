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
import { retry } from "../../../../src/core/utils/retry";
import { HttpConnection } from "../../../../src/core/utils/networking";

describe("test retry utils", () => {
  it("should return correct (string) result without retries", async () => {
    const result: string = await retry<string>()
      .waitAndRetry(2)
      .execute(() => {
        return Promise.resolve("success");
      });
    expect(result).toBe("success");
  });

  it("should return correct (number) result without retries", async () => {
    const result: number = await retry<number>()
      .waitAndRetry(2)
      .execute(() => {
        return Promise.resolve(123);
      });
    expect(result).toBe(123);
  });

  it("should return correct (HttpConnection) result without retries", async () => {
    const result: HttpConnection = await retry<HttpConnection>()
      .waitAndRetry(2)
      .execute(() => {
        return Promise.resolve({
          responseCode: 200,
          headers: {
            "Content-Type": "application/json",
          },
          bodyAsText: '{"key": "value"}',
        });
      });
    expect(result).toEqual({
      responseCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      bodyAsText: '{"key": "value"}',
    });
  });

  it("should retry on specific result and eventually succeed", async () => {
    let attempt = 0;
    const result: string = await retry<string>()
      .waitAndRetry(3, 2)
      .retryOnResult((res) => res === "retry")
      .execute(() => {
        attempt++;
        return Promise.resolve(attempt < 3 ? "retry" : "success");
      });
    expect(result).toBe("success");
    expect(attempt).toBe(3);
  });

  it("should retry on error and eventually succeed", async () => {
    let attempt = 0;
    const result: string = await retry<string>()
      .waitAndRetry(100, 10)
      .retryOnError((error) => {
        if (error instanceof CustomError) {
          return error.TYPE === "CustomError";
        }
        return false;
      })
      .execute(() => {
        attempt++;
        if (attempt < 3) {
          return Promise.reject(new CustomError("retry"));
        }
        return Promise.resolve("success");
      });
    expect(result).toBe("success");
    expect(attempt).toBe(3);
  });

  it("should stop retrying after max retries are reached", async () => {
    let attempt = 0;
    await retry<string>()
      .waitAndRetry(2, 10)
      .retryOnError((error) => {
        if (error) {
          return true;
        }
        return false;
      })
      .execute(() => {
        attempt++;
        throw new Error("retry");
      })
      .then(() => {
        expect(false).toBe(true);
      })
      .catch((e) => {
        expect((e as Error).message).toBe("retry");
      })
      .then(() => {
        expect(attempt).toBe(3); // initial attempt + 2 retries
      });
  });

  it("should reject for unknown error", async () => {
    let attempt = 0;
    let errorCheck = 0;
    await retry<string>()
      .waitAndRetry(5, 10)
      .retryOnError((error) => {
        errorCheck++;
        if ((error as Error).message === "retry") {
          return true;
        }
        return false;
      })
      .execute(() => {
        attempt++;
        if (attempt < 2) {
          throw new Error("retry");
        } else {
          throw new CustomError("CustomError");
        }
      })
      .then(() => {
        expect(false).toBe(true);
      })
      .catch((e) => {
        expect((e as Error).message).toBe("CustomError");
      })
      .then(() => {
        expect(attempt).toBe(2);
        expect(errorCheck).toBe(2);
      });
  });
});

class CustomError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomError";
  }
  readonly TYPE = "CustomError";
}
