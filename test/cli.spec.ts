import cli from "../src/cli";
import nock from "nock";
import { Storage } from "@google-cloud/storage";
import { getTmpDirFilePathSync } from "../src/fs";

jest.mock("@google-cloud/storage");

const uploadMock = jest.fn(() => Promise.resolve());
const bucketMock = jest.fn(() => ({
  upload: uploadMock,
}));

describe("cli", () => {
  const apiKey = "7wR6hGjym5ZkcEL8iEz4CW:6qBfXMcGiIRWoa7olZ3ycd"; // this is a fake apiKey

  beforeEach(() => {
    (Storage as unknown as jest.Mock).mockImplementation(() => ({
      bucket: bucketMock,
    }));
  });

  afterEach(() => {
    nock.cleanAll();
    jest.clearAllMocks();
  });

  it("should throw an error if apiKey is unauthorized", async () => {
    expect.assertions(2);
    const scope = nock("https://api.connectif.cloud", {
      reqheaders: {
        "Content-Type": "application/json",
        Authorization: `apiKey ${apiKey}`,
      },
    })
      .post("/exports", {
        exportType: "contacts",
        delimiter: ",",
        dateFormat: "ISO",
        filters: {
          segmentId: "643e76bfc1d60cb6ca7832fb",
        },
      })
      .reply(401);

    try {
      await cli().parseAsync([
        "node",
        "index.js",
        "export-contacts",
        "-a",
        apiKey,
        "-k",
        "./key.json",
        "-b",
        "bucketName",
        "-s",
        "643e76bfc1d60cb6ca7832fb",
      ]);
    } catch (error) {
      expect((error as Error).message).toBe(
        "Error response while creating export: Unauthorized"
      );
      expect(scope.isDone()).toBe(true);
    }
  });

  it("should throw an error if create request is invalid", async () => {
    expect.assertions(2);
    const scope = nock("https://api.connectif.cloud", {
      reqheaders: {
        "Content-Type": "application/json",
        Authorization: `apiKey ${apiKey}`,
      },
    })
      .post("/exports", {
        exportType: "contacts",
        delimiter: ",",
        dateFormat: "ISO",
        filters: {
          segmentId: "notAnObjectId",
        },
      })
      .reply(422, {
        detail: "One or more validation error occurred.",
        status: 422,
        title: "Unprocessable entity",
        validationErrors: [
          {
            name: "segmentId",
            path: "/filters/segmentId",
            reason: "Value is not valid",
          },
        ],
      });

    try {
      await cli().parseAsync([
        "node",
        "index.js",
        "export-contacts",
        "-a",
        apiKey,
        "-k",
        "./key.json",
        "-b",
        "bucketName",
        "-s",
        "notAnObjectId",
      ]);
    } catch (error) {
      expect((error as Error).message).toBe(
        "Error response while creating export: Unprocessable Entity - One or more validation error occurred.\n/filters/segmentId: Value is not valid"
      );
      expect(scope.isDone()).toBe(true);
    }
  });

  it("should throw an error if create request fail", async () => {
    expect.assertions(2);
    const scope = nock("https://api.connectif.cloud", {
      reqheaders: {
        "Content-Type": "application/json",
        Authorization: `apiKey ${apiKey}`,
      },
    })
      .post("/exports", {
        exportType: "data-explorer",
        delimiter: ",",
        dateFormat: "ISO",
        filters: {
          fromDate: "2022-10-05T14:48:00.000Z",
          toDate: "2022-10-15T14:48:00.000Z",
          dataExplorerReportId: "643e76bfc1d60cb6ca7832fb",
        },
      })
      .reply(500, {
        detail: "Ops, unhandled error here.",
        status: 500,
        title: "Internal Server Error",
      });

    try {
      await cli().parseAsync([
        "node",
        "index.js",
        "export-data-explorer",
        "-a",
        apiKey,
        "-k",
        "./key.json",
        "-b",
        "bucketName",
        "-f",
        "2022-10-05T14:48:00.000Z",
        "-t",
        "2022-10-15T14:48:00.000Z",
        "-r",
        "643e76bfc1d60cb6ca7832fb",
      ]);
    } catch (error) {
      expect((error as Error).message).toBe(
        "Error response while creating export: Internal Server Error - Ops, unhandled error here."
      );
      expect(scope.isDone()).toBe(true);
    }
  });

  it("should throw an error if get export result fail", async () => {
    expect.assertions(3);
    const exportId = "643e7882e31c1dfdfea998eb";
    const scopeCreate = nock("https://api.connectif.cloud", {
      reqheaders: {
        "Content-Type": "application/json",
        Authorization: `apiKey ${apiKey}`,
      },
    })
      .post("/exports", {
        exportType: "activities",
        delimiter: ",",
        dateFormat: "ISO",
        filters: {
          fromDate: "2020-05-01",
          toDate: "2020-05-02",
        },
      })
      .reply(201, { id: exportId });

    const scopeGet = nock("https://api.connectif.cloud", {
      reqheaders: {
        Authorization: `apiKey ${apiKey}`,
      },
    })
      .get(`/exports/${exportId}`)
      .once()
      .reply(
        500,
        { detail: "an expected error happened" },
        { "Content-Type": "application/json" }
      );

    try {
      await cli().parseAsync([
        "node",
        "index.js",
        "export-activities",
        "-a",
        apiKey,
        "-k",
        "./key.json",
        "-b",
        "bucketName",
        "-f",
        "2020-05-01",
        "-t",
        "2020-05-02",
      ]);
    } catch (error) {
      expect((error as Error).message).toBe(
        "Error response while checking progress export: Internal Server Error - an expected error happened"
      );
      expect(scopeCreate.isDone()).toBe(true);
      expect(scopeGet.isDone()).toBe(true);
    }
  });

  it("should throw an error if get export return export status error", async () => {
    expect.assertions(3);
    const exportId = "643e7882e31c1dfdfea998eb";
    const scopeCreate = nock("https://api.connectif.cloud", {
      reqheaders: {
        "Content-Type": "application/json",
        Authorization: `apiKey ${apiKey}`,
      },
    })
      .post("/exports", {
        exportType: "activities",
        delimiter: ",",
        dateFormat: "ISO",
        filters: {
          fromDate: "2020-05-01",
          toDate: "2020-05-02",
        },
      })
      .reply(201, { id: exportId });

    const scopeGet = nock("https://api.connectif.cloud", {
      reqheaders: {
        Authorization: `apiKey ${apiKey}`,
      },
    })
      .get(`/exports/${exportId}`)
      .once()
      .reply(200, { status: "error" }, { "Content-Type": "application/json" });

    try {
      await cli().parseAsync([
        "node",
        "index.js",
        "export-activities",
        "-a",
        apiKey,
        "-k",
        "./key.json",
        "-b",
        "bucketName",
        "-f",
        "2020-05-01",
        "-t",
        "2020-05-02",
      ]);
    } catch (error) {
      expect((error as Error).message).toBe(
        "Export has finished with error status"
      );
      expect(scopeCreate.isDone()).toBe(true);
      expect(scopeGet.isDone()).toBe(true);
    }
  });

  it("should throw an error if download export result from url fail", async () => {
    expect.assertions(4);
    const exportId = "643e7882e31c1dfdfea998eb";
    const scopeCreate = nock("https://api.connectif.cloud", {
      reqheaders: {
        "Content-Type": "application/json",
        Authorization: `apiKey ${apiKey}`,
      },
    })
      .post("/exports", {
        exportType: "activities",
        delimiter: ",",
        dateFormat: "ISO",
        filters: {
          fromDate: "2020-05-01",
          toDate: "2020-05-02",
        },
      })
      .reply(201, { id: exportId });

    const scopeGet = nock("https://api.connectif.cloud", {
      reqheaders: {
        Authorization: `apiKey ${apiKey}`,
      },
    })
      .get(`/exports/${exportId}`)
      .once()
      .reply(200, {
        status: "inProgress",
        total: 0,
        progress: 0,
        fileUrl: "https://export.com/myexportfile.zip",
      })
      .get(`/exports/${exportId}`)
      .once()
      .reply(200, {
        status: "inProgress",
        total: 1000,
        progress: 500,
        fileUrl: "https://export.com/myexportfile.zip",
      })
      .get(`/exports/${exportId}`)
      .once()
      .reply(200, {
        status: "finished",
        total: 1000,
        progress: 1000,
        fileUrl: "https://export.com/myexportfile.zip",
      });

    const scopeDownload = nock("https://export.com")
      .get("/myexportfile.zip")
      .reply(404);

    try {
      await cli().parseAsync([
        "node",
        "index.js",
        "export-activities",
        "-a",
        apiKey,
        "-k",
        "./key.json",
        "-b",
        "bucketName",
        "-f",
        "2020-05-01",
        "-t",
        "2020-05-02",
      ]);
    } catch (error) {
      expect((error as Error).message).toBe(
        "Error response while downloading export https://export.com/myexportfile.zip: Not Found"
      );
      expect(scopeCreate.isDone()).toBe(true);
      expect(scopeGet.isDone()).toBe(true);
      expect(scopeDownload.isDone()).toBe(true);
    }
  });

  it("should export from Connectif, then unzip and upload csv files to Google Cloud Storage", async () => {
    const exportId = "643e7882e31c1dfdfea998eb";
    const scopeCreate = nock("https://api.connectif.cloud", {
      reqheaders: {
        "Content-Type": "application/json",
        Authorization: `apiKey ${apiKey}`,
      },
    })
      .post("/exports", {
        exportType: "activities",
        delimiter: ",",
        dateFormat: "ISO",
        filters: {
          fromDate: "2022-10-05T14:48:00.000Z",
          toDate: "2022-10-15T14:48:00.000Z",
          segmentId: "643e76bfc1d60cb6ca7832fb",
        },
      })
      .reply(201, { id: exportId });

    const scopeGet = nock("https://api.connectif.cloud", {
      reqheaders: {
        Authorization: `apiKey ${apiKey}`,
      },
    })
      .get(`/exports/${exportId}`)
      .once()
      .reply(200, { status: "inProgress" })
      .get(`/exports/${exportId}`)
      .reply(200, {
        status: "finished",
        total: 100,
        progress: 100,
        fileUrl: "https://export.com/myexportfile.zip",
      });

    const fixtureZip =
      "export-activities-18615f52-43dd-4448-85ed-9107273303cc.zip";
    const scopeDownload = nock("https://export.com")
      .get("/myexportfile.zip")
      .replyWithFile(200, __dirname + "/fixtures/" + fixtureZip, {
        "Content-Type": "application/zip",
      });

    await cli().parseAsync([
      "node",
      "index.js",
      "export-activities",
      "-a",
      apiKey,
      "-k",
      "./key.json",
      "-b",
      "bucketName",
      "-f",
      "2022-10-05T14:48:00.000Z",
      "-t",
      "2022-10-15T14:48:00.000Z",
      "-s",
      "643e76bfc1d60cb6ca7832fb",
    ]);

    expect(scopeCreate.isDone()).toBe(true);
    expect(scopeGet.isDone()).toBe(true);
    expect(scopeDownload.isDone()).toBe(true);
    expect(bucketMock).toHaveBeenNthCalledWith(2, "bucketName");
    expect(uploadMock).toHaveBeenCalledWith(
      getTmpDirFilePathSync(
        "export-activities-18615f52-43dd-4448-85ed-9107273303cc.csv"
      ),
      {
        destination:
          "export-activities/export-activities-18615f52-43dd-4448-85ed-9107273303cc.csv",
      }
    );
    expect(uploadMock).toHaveBeenCalledWith(
      getTmpDirFilePathSync(
        "export-activities-18615f52-43dd-4448-85ed-9107273303cc-products.csv"
      ),
      {
        destination:
          "export-activities-products/export-activities-18615f52-43dd-4448-85ed-9107273303cc-products.csv",
      }
    );
  });
});
