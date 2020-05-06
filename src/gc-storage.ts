import { Storage } from '@google-cloud/storage';

export type GoogleCloudStorageOptions = {
    gcKeyFileName: string;
    gcBucketName: string;
}

export type GoogleCloudStorage = {
    uploadFiles(files: { fileName: string; path: string }[]): Promise<void>;
}

export default function googleCloudStorage(options: GoogleCloudStorageOptions): GoogleCloudStorage {
    const storage = new Storage({ keyFilename: options.gcKeyFileName });

    function getDestinationFromFileName(fileName: string): string {
        const [ fileNameWithoutExtension ] = fileName.split('.');
        const fileParts = fileNameWithoutExtension.split('-');
        return fileParts.slice(0, fileParts.length - 5).join('-');
    }

    async function uploadFile(fileName: string, filePath: string): Promise<void> {
        console.log(`uploading file ${fileName} ... 📤`);
        const destination = getDestinationFromFileName(fileName);
        await storage.bucket(options.gcBucketName).upload(filePath, { destination });
        console.log(`file ${fileName} uploaded 📤`.green);
    }

    async function uploadFiles(files: { fileName: string; path: string }[]): Promise<void> {
        await Promise.all(files.map(file => uploadFile(file.fileName, file.path)));
    }

    return {
        uploadFiles
    };
}

