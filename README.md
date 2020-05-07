![connectif-2-gc-storage](./doc/images/connectif-2-gc-storage-logo.png)

# connectif-2-gc-storage

[![Actions Status](https://github.com/francescorivola/connectif-2-gc-storage/workflows/Node%20CI/badge.svg)](https://github.com/francescorivola/connectif-2-gc-storage/actions)
[![CodeFactor](https://www.codefactor.io/repository/github/francescorivola/connectif-2-gc-storage/badge)](https://www.codefactor.io/repository/github/francescorivola/connectif-2-gc-storage)
[![codecov](https://codecov.io/gh/francescorivola/connectif-2-gc-storage/branch/master/graph/badge.svg)](https://codecov.io/gh/francescorivola/connectif-2-gc-storage)
[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=francescorivola/connectif-2-gc-storage)](https://dependabot.com)

A CLI that makes extremely easy automate export data from the [Connectif Marketing Automation Platform](https://www.connectif.ai) and upload it to [Google Cloud Storage](https://cloud.google.com/storage).

## Installation

Install the [NodeJs](https://nodejs.org) runtime.

Now, from your favourite shell, install the CLI by typing the following command:

```
$ npm install -g connectif-2-gc-storage
```

## Prerequisites

Before run the CLI we must ensure we have all the credentials in place in order to access the Connectif API and the Google Cloud Platform:

- **Connectif Api Key**: get a Connectif Api Key with permission to write and read exports following the instructions that can be found here: https://api-docs.connectif.cloud/connectif-api/guides/authentication.
- **Google Cloud Credentials**: get a credential file from the Google Cloud Console with permission to write into your Google Cloud Storage account (see instruction here https://cloud.google.com/docs/authentication/getting-started).

## Usage

The usage documentation can be found running the tool with the help flag:

```
$ connectif-2-gc-storage --help
```

Output:

```
Usage: connectif-2-gc-storage [options] [command]

CLI to automate Connectif data export uploading to Google Cloud Storage

Options:
  -V, --version                output the version number
  -h, --help                   display help for command

Commands:
  export-activities [options]  export contacts activities.
  export-contacts [options]    export contacts.
  help [command]               display help for command
```

Help flag can also be used to get documentation of each command. i.e.:

```
$ connectif-2-gc-storage export-activities --help
```

Output:

```
Usage: connectif-2-gc-storage export-activities [options]

export contacts activities.

Options:
  -k, --gcKeyFileName <path>      Path to a .json, .pem, or .p12 Google Cloud key file (required).
  -b, --gcBucketName <name>       Google Cloud Storage bucket name (required).
  -a, --connectifApiKey <apiKey>  Connectif Api Key. export:read and export:write scopes are required (required).
  -f, --fromDate <fromDate>       filter activities export created after a given date (required).
  -t, --toDate <toDate>           filter activities export created before a given date (required).
  -s, --segmentId <segmentId>     filter the activities export of contacts in a given segment.
  -h, --help                      display help for command
```

## License

MIT

