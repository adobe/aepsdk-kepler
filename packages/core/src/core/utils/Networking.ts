import { Log } from "./Log";

export const version = "1.0.0";

const defulatHeader = {
    "Content-Type": "application/json",
    "accept": "application/json",
    "Accept-Language": "en-US",
};

export enum HttpMethod {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
}

export interface NetworkRequest {
    readonly url: string;
    readonly method: HttpMethod;
    readonly headers?: Record<string, string>;
    readonly body?: string;
    readonly connectTimeout: number;
    readonly readTimeout: number;
}

export interface HttpConnection {
    readonly responseCode: number;
    readonly headers?: Record<string, string>;
    readonly body?: any;
    // TODO: getResponsePropertyValue() "last-modified", or "ETag"
}

export function asyncRequest(request: NetworkRequest): Promise<HttpConnection> {
    const mergedHeader = request.headers ? { ...defulatHeader, ...request.headers } : defulatHeader;
    return new Promise((resolve, reject) => {
        // send request through fetch
        Log.debug(`[Networking] Sending request to ${request.url}, boyd: ${request.body}`);
        fetch(request.url, {
            method: request.method,
            headers: mergedHeader,
            body: request.body,
        }).then((response) => {
            if (!response.ok) {
                Log.error(`Request failed with error ${response.status}`);
                reject(new Error(`Request failed with error ${response.status}`));
                return;
            }
            return response.json()
        }).then((data) => {
            // console.log(data);
            resolve({
                responseCode: 200,
                headers: {},
                body: data as any,
            });
        }).catch((error) => {
            reject(new Error(`Request failed with error ${error}`));
        });
    });
}
