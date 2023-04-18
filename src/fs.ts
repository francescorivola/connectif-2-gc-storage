import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';
import fetch from 'node-fetch';
import { promisify } from 'util';
import stream from 'stream';
import { randomUUID } from 'crypto';

const streamPipeline = promisify(stream.pipeline);
const tmpDir = `./tmp-${randomUUID()}`;

export function getTmpDirFilePathSync(file: string): string {
    return path.join(tmpDir, file);
}

export function deleteTmpDirSync(): void {
    if (!fs.existsSync(tmpDir)) {
        return;
    }
    const files = fs.readdirSync(tmpDir);
    files.map(getTmpDirFilePathSync).forEach(fs.unlinkSync);
    fs.rmdirSync(tmpDir);
}

export async function unzipToTmpDir(zipFilePath: string): Promise<{ fileName: string; path: string }[]> {
    console.log('unzipping export ... ⏳');
    const files: { fileName: string; path: string }[] = [];
    await fs.createReadStream(zipFilePath)
        .pipe(unzipper.Parse())
        .on('entry', function onEntry(entry): void {
            const fileName = entry.path;
            const path = getTmpDirFilePathSync(fileName);
            files.push({
                fileName,
                path
            });
            console.log(`unzipping export ${fileName} ...`);
            entry.pipe(fs.createWriteStream(path));
    }).promise();
    console.log('export unzipped successfully'.green);
    return files;
}

function createTmpDir(): void {
    fs.mkdirSync(tmpDir);
}

export async function downloadFromUrlToTmpDir(uri: string): Promise<string> {
    const response = await fetch(uri)
	if (!response.ok) {
        throw new Error(`Error response while downloading export ${uri}: ${response.statusText}`);
    }
    createTmpDir();
    const zipFilePath = getTmpDirFilePathSync(`export-${randomUUID()}.zip`);
    await streamPipeline(response.body, fs.createWriteStream(zipFilePath));
    return zipFilePath;
}