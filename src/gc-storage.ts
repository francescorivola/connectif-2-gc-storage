import { Storage } from '@google-cloud/storage';

export type GoogleCloudStorageOptions = {
    gcKeyFileName: string;
    gcBucketName: string;
    gcFolderName?: string;
}

export type GoogleCloudStorage = {
    uploadFiles(files: { fileName: string; path: string }[]): Promise<void>;
}

const uuidRegExp = new RegExp('-[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}');

export default function googleCloudStorage(options: GoogleCloudStorageOptions): GoogleCloudStorage {
    const storage = new Storage({ keyFilename: options.gcKeyFileName });

    function getDestinationFromFileName(fileName: string): string {
        const [ fileNamePart ] = fileName.split('.');
        return `${fileNamePart.replace(uuidRegExp, '')}/${fileName}`;
    }

    function getDestination(fileName: string): string {
        return options.gcFolderName ?
            `${options.gcFolderName}/${fileName}` :
            getDestinationFromFileName(fileName);
    }

    async function uploadFile(fileName: string, filePath: string): Promise<void> {
        console.log(`uploading file ${fileName} ... 📤`);
        const destination = getDestination(fileName);
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

