import 'colors';
import commander from 'commander';
import { deleteTmpDirSync, unzipToTmpDir, downloadFromUrlToTmpDir } from './fs';
import packageInfo from '../package.json';
import connectifApi, { ExportRequest } from './connectif-api';
import googleCloudStorage from './gc-storage';

function cleanup(): void {
    deleteTmpDirSync();
}

type ExportOptions = {
    connectifApiKey: string;
    gcKeyFileName: string;
    gcBucketName: string;
};

async function exportCommand(options: ExportOptions, exportRequest: ExportRequest): Promise<void> {
    try {
        const {
            createExport: createConnectifExport,
            getExportFileUrl
        } = connectifApi(options.connectifApiKey);

        const {
            uploadFiles: uploadFilesToGoogleCloudStorage
        } = googleCloudStorage({
            gcKeyFileName: options.gcKeyFileName,
            gcBucketName: options.gcBucketName
        });

        await createConnectifExport(exportRequest)
            .then(getExportFileUrl)
            .then(downloadFromUrlToTmpDir)
            .then(unzipToTmpDir)
            .then(uploadFilesToGoogleCloudStorage);
    } finally {
        cleanup();
    }
}

function getExportOptionsFromCmdObj(cmdObj): ExportOptions {
    const { connectifApiKey, gcKeyFileName, gcBucketName } = cmdObj.parent;
    return {
        connectifApiKey,
        gcBucketName,
        gcKeyFileName
    };
}

async function exportContacts(cmdObj): Promise<void> {
    const { segmentId } = cmdObj;
    const exportRequest: ExportRequest = {
        exportType: 'contacts',
        delimiter: ',',
        dateFormat: 'ISO',
        filters: {
            segmentId
        }
    };
    const options = getExportOptionsFromCmdObj(cmdObj);
    await exportCommand(options, exportRequest);
}

async function exportActivities(cmdObj): Promise<void> {
    const { dateTo, dateFrom, segmentId } = cmdObj;
    const exportRequest: ExportRequest = {
        exportType: 'activities',
        delimiter: ',',
        dateFormat: 'ISO',
        filters: {
            dateTo,
            dateFrom,
            segmentId
        }
    };
    const options = getExportOptionsFromCmdObj(cmdObj);
    await exportCommand(options, exportRequest);
}

export default function cli(): commander.Command {
    const program = new commander.Command();

    program
        .version(packageInfo.version)
        .name(packageInfo.name)
        .description(packageInfo.description)
        .requiredOption('-k, --gcKeyFileName <path>', 'Path to a .json, .pem, or .p12 Google Cloud key file.')
        .requiredOption('-b, --gcBucketName <name>', 'Google Cloud Storage bucket name.')
        .requiredOption('-a, --connectifApiKey <apiKey>', 'Connectif Api Key. export:read and export:write scopes are required.');

    program
        .command('export-activities')
        .requiredOption('-f, --dateFrom <dateFrom>', 'filter activities export created after a given date.')
        .requiredOption('-t, --dateTo <dateTo>', 'filter activities export created before a given date.')
        .option('-s, --segmentId <segmentId>', 'filter the activities export of contacts in a given segment.')
        .description('export contacts activities.')
        .action(exportActivities);

    program
        .command('export-contacts')
        .option('-s, --segmentId <segmentId>', 'filter the export by contacts in a given segment.')
        .description('export contacts.')
        .action(exportContacts);

    return program;
}
