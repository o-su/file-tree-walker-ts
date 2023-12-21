import * as path from "path";
import * as fs from "fs";

import { OnFileHandler, OnDirectoryHandler } from "./types";

export * from "./types";

export class FileTreeWalker {
    private onFileHandler: OnFileHandler | undefined;
    private onDirectoryHandler: OnDirectoryHandler | undefined;
    private fileEncoding: string = "utf8";
    private excludedFiles: string[] = [];
    private allowedFileTypes: string[] = [];

    onFile = (onFileHandler: OnFileHandler): this => {
        this.onFileHandler = onFileHandler;

        return this;
    };

    onDirectory = (onDirectoryHandler: OnDirectoryHandler): this => {
        this.onDirectoryHandler = onDirectoryHandler;

        return this;
    };

    setFileEncoding = (fileEncoding: string): this => {
        this.fileEncoding = fileEncoding;

        return this;
    };

    setExcludedFiles = (excludedFiles: string[]): this => {
        this.excludedFiles = excludedFiles;

        return this;
    };

    setAllowedFileTypes = (allowedFileTypes: string[]): this => {
        this.allowedFileTypes = allowedFileTypes;

        return this;
    };

    walk = async (directoryPath: string): Promise<void> => {
        const files: string[] = await fs.promises.readdir(directoryPath, { withFileTypes: false });

        await Promise.all(
            files.map(async (filename: string) => this.processFile(directoryPath, filename)),
        );
    };

    private processFile = async (directoryPath: string, filename: string): Promise<void> => {
        const filePath: string = path.join(directoryPath, filename);
        const isExcludedFilename: boolean = this.excludedFiles.some((excludedFileName) =>
            filePath.includes(excludedFileName),
        );

        if (!isExcludedFilename) {
            this.processAllowedFile(filePath, filename);
        }
    };

    private processAllowedFile = async (filePath: string, filename: string): Promise<void> => {
        const fileExtension: string = path.extname(filename);
        const fileNameWithoutExtension: string = path.basename(filename, fileExtension);
        const stats = await this.readFileInfo(filePath);

        if (stats.isDirectory()) {
            this.onDirectoryHandler?.(filePath, filename);
            await this.walk(filePath);
        } else if (stats.isFile() && this.isAllowedFileType(fileExtension) && this.onFileHandler) {
            const data: string | Buffer = await this.readFile(filePath);

            this.onFileHandler?.(
                filePath,
                fileNameWithoutExtension,
                fileExtension,
                data.toString(),
            );
        }
    };

    private isAllowedFileType = (fileType: string): boolean => {
        if (this.allowedFileTypes.length > 0) {
            return this.allowedFileTypes.some(
                (allowedFileType) => fileType.replace(".", "") === allowedFileType,
            );
        }

        return true;
    };

    private readFile = async (filePath: string): Promise<string | Buffer> =>
        fs.promises.readFile(filePath, { encoding: this.fileEncoding as BufferEncoding });

    private readFileInfo = (filePath: string): Promise<fs.Stats | fs.BigIntStats> =>
        fs.promises.stat(filePath);
}
