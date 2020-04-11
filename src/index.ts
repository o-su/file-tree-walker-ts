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

    walk = (directoryPath: string): void => {
        fs.readdir(directoryPath, (error: NodeJS.ErrnoException | null, files: string[]) => {
            if (error) {
                throw new Error(error.toString());
            }

            files.forEach((filename: string) => this.handleFile(directoryPath, filename));
        });
    };

    private handleFile = (directoryPath: string, filename: string) => {
        const filePath: string = path.join(directoryPath, filename);
        const isExcludedFilename: boolean = this.excludedFiles.some((excludedFileName) =>
            filePath.includes(excludedFileName)
        );

        if (!isExcludedFilename) {
            const fileExtension: string = path.extname(filename);
            const fileNameWithoutExtension: string = path.basename(filename, fileExtension);

            this.readFileInfo(filePath, (stats: fs.Stats | fs.BigIntStats) => {
                if (stats.isDirectory()) {
                    this.onDirectoryHandler?.(filePath, filename);
                    this.walk(filePath);
                } else if (
                    stats.isFile() &&
                    this.isAllowedFileType(fileExtension) &&
                    this.onFileHandler
                ) {
                    this.readFile(filePath, (data: string | Buffer) => {
                        this.onFileHandler?.(
                            filePath,
                            fileNameWithoutExtension,
                            fileExtension,
                            data.toString()
                        );
                    });
                }
            });
        }
    };

    private isAllowedFileType = (fileType: string): boolean => {
        if (this.allowedFileTypes.length > 0) {
            return this.allowedFileTypes.some(
                (allowedFileType) => fileType.replace(".", "") === allowedFileType
            );
        }

        return true;
    };

    private readFile = (filePath: string, onSuccess: (data: string | Buffer) => void): void => {
        fs.readFile(
            filePath,
            this.fileEncoding,
            (error: NodeJS.ErrnoException | null, data: string | Buffer) => {
                if (error) {
                    throw new Error(error.toString());
                }

                onSuccess(data);
            }
        );
    };

    private readFileInfo = (
        filePath: string,
        onSuccess: (stats: fs.Stats | fs.BigIntStats) => void
    ): void => {
        fs.stat(
            filePath,
            (error: NodeJS.ErrnoException | null, stats: fs.Stats | fs.BigIntStats) => {
                if (error) {
                    throw new Error(error.toString());
                }

                onSuccess(stats);
            }
        );
    };
}
