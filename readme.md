# connectif-2-gc-storage

A CLI that makes extremely easy export data from the awesome [Connectif Marketing Automation Platform](https://www.connectif.ai) and upload it to [Google Cloud Storage](https://cloud.google.com/storage). From there you can perform further analysis using, for instance, [Google Data Studio](https://datastudio.google.com/).

## Installation

Install [NodeJs](https://nodejs.org) then, from your favourite shell, install the CLI by typing the following command:

```
npm install -g connectif-2-gc-storage
```

## Prerequisites

Before run the CLI we must ensure we have all the credentials in place in order to access to the Connectif API and the Google Cloud Platform:

- Get a Connectif Api Key with permission to write and read exports following the instructions that can be found here: https://api-docs.connectif.cloud/connectif-api/guides/authentication
- Get a json credential file from Google Cloud with permission to write into your Google Cloud Storage account (see instruction here https://cloud.google.com/docs/authentication/getting-started)

