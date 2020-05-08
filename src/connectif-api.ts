
import fetch from 'node-fetch';
import cliProgress from 'cli-progress';
import wait from './wait';

const connectifApiBaseUrl = 'https://api.connectif.cloud';

export type ConnectifApi = {
    createExport(exportRequest: ExportRequest): Promise<string>;
    getExportFileUrl(exportId: string): Promise<string>;
}

export type ExportRequest = {
    exportType: 'contacts' | 'activities';
    delimiter: string;
    dateFormat: string;
    filters: {
        segmentId?: string;
        toDate?: string;
        fromDate?: string;
    };
}

export default function connectifApi(apiKey: string): ConnectifApi {

    async function getErrorMessageFromResponse(response): Promise<string> {
        const statusText = response.statusText;
        const contentType = response.headers.get('Content-Type');
        if (!contentType || !contentType.includes('application/json')) {
            return statusText;
        }
        const { detail, validationErrors } = await response.json();
        return `${statusText} - ${detail}${(validationErrors ?? []).map(v => `\n${v.path}: ${v.reason}`).join()}`;
    }

    async function createExport(exportRequest: ExportRequest): Promise<string> {
        const response = await fetch(`${connectifApiBaseUrl}/exports`, {
            method: 'POST',
            body: JSON.stringify(exportRequest),
            headers: {
                'Authorization': `apiKey ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`Error response while creating export: ${await getErrorMessageFromResponse(response)}`)
        }
        const { id } = await response.json();
        return id;
    }

    async function getExportFileUrlAndRetryUntilIsReady(exportId: string, progressBar?: cliProgress.SingleBar): Promise<string> {
        const response = await fetch(`${connectifApiBaseUrl}/exports/${exportId}`, {
            headers: {
                'Authorization': `apiKey ${apiKey}`
            }
        });
        if (!response.ok) {
            throw new Error(`Error response while checking progress export: ${await getErrorMessageFromResponse(response)}`)
        }
        const { status, fileUrl, total, progress } = await response.json();

        if (!progressBar && total > 0) {
            progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
            progressBar.start(total, 0);
        }
        progressBar?.setTotal(total);
        progressBar?.update(progress);

        if (status === 'finished') {
            progressBar?.stop();
            return fileUrl;
        }
        if (status === 'error') {
            progressBar?.stop();
            throw new Error('Export has finished with error status');
        }
        await wait(1000);
        return getExportFileUrlAndRetryUntilIsReady(exportId, progressBar);
    }

    function getExportFileUrl(exportId: string): Promise<string> {
        return getExportFileUrlAndRetryUntilIsReady(exportId);
    }

    return {
        createExport,
        getExportFileUrl
    };
}
