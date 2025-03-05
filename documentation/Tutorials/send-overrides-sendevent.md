# Sending Datastream overrides using sendEvent API

Datastream overrides let you define additional configuration settings for your datastreams, allowing you to trigger different datastream behaviors on a per event basis.

## Prerequisites

* [Getting Started](../getting-started.md)
* [`sendEvent` API Reference](../api-reference.md#sendevent)
* [`sendEventWithResponse` API Reference](../api-reference.md#sendeventwithresponse)

## Datastream ID override

After configuring the datastream overrides, you can now send these overrides to the Edge Network through Adobe Kepler SDK. Sending the overrides using the `sendEvent` or `sendEventWithResponse` API is the final step of activating the datastream configuration overrides.

The following examples demonstrate what a datastream ID override looks like:

```typescript
data = {
      xdm: {
        eventType: "page.view",
        sampleXDMKey: "value"
      },
      data: {
        Customkey: "value",
      },
      query: {
        queryKey: 'queryVal',
      },
      config:{
        datastreamIdOverride:"<YOUR_DATASTREAM_ID>"
      }
    }
AEPSDK.sendEvent(data)
```

## Datastream configuration override

The following examples demonstrate what a datastream configuration override could look like:

```typescript
data = {
      xdm: {
        eventType: "page.view",
        sampleXDMKey: "value"
      },
      data: {
        Customkey: "value",
      },
      query: {
        queryKey: 'queryVal',
      },
      config:{
        datastreamConfigOverride:{
          com_adobe_experience_platform: {
                datasets: {
                    event: {
                        datasetId: "<YOUR_DATASET_ID>"
                    }
                }
          }
        }
      }
    }
AEPSDK.sendEvent(data)
```

## Payload example

The following example shows a sample payload after overriding the datastream configurations:

```json
{
  "meta": {
    "configOverrides": {
      "com_adobe_experience_platform": {
        "datasets": {
          "event": {
            "datasetId": "SampleProfileDatasetIdOverride"
          }
        }
      },
      "com_adobe_analytics": {
        "reportSuites": [
        "MyFirstOverrideReportSuite",
        "MySecondOverrideReportSuite",
        "MyThirdOverrideReportSuite"
        ]
      },
      "com_adobe_identity": {
        "idSyncContainerId": "1234567"
      },
      "com_adobe_target": {
        "propertyToken": "63a46bbc-26cb-7cc3-def0-9ae1b51b6c62"
      }
    },
    "state": {  }
  },
  "events": [  ]
}
```