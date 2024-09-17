import { AEPSDK } from "../src";

describe('test public APIs', () => {

    beforeEach(() => { });

    afterEach(() => { });

    test('test start() with parameters ', () => {
        AEPSDK.start({
            config: {
                "edge.configId": "<YOUR_EDGE_DATASTREAM_ID>"
            },
            // extensionManagers: [],
            // tenants: ["a", "b", "c"]
        })
        // TODO: validate the API behavior

    });
    test('test start() without parameters ', () => {

        AEPSDK.start()
        // TODO: validate the API behavior

    });
});