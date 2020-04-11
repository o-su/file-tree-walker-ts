export type OnFileHandler = (
    filePath: string,
    filename: string,
    fileExtension: string,
    content: string
) => void;

export type OnDirectoryHandler = (directoryPath: string, directoryName: string) => void;
