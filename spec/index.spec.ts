import * as fs from "fs";

import { FileTreeWalker } from "../src/index";

describe("when root directory contains one file", () => {
    test("then FileTreeWalker finds this file and returns data", (done) => {
        // given
        const fileTreeWalker: FileTreeWalker = new FileTreeWalker();
        mockFsReaddir(() => ["file.txt"]);
        mockFsStat(() => ({ isDirectory: () => false, isFile: () => true }));
        mockFsReadFile(() => "content");

        // when, then
        fileTreeWalker
            .onFile(
                (filePath: string, filename: string, fileExtension: string, content: string) => {
                    expect(filePath).toBe("path\\file.txt");
                    expect(filename).toBe("file");
                    expect(fileExtension).toBe(".txt");
                    expect(content).toBe("content");
                }
            )
            .walk("path")
            .then(done);
    });
});

describe("when only certain file type is allowed", () => {
    test("then FileTreeWalker finds files with allowed file type and returns data", (done) => {
        // given
        const fileTreeWalker: FileTreeWalker = new FileTreeWalker();
        mockFsReaddir(() => ["file.txt", "file.ts"]);
        mockFsStat(() => ({ isDirectory: () => false, isFile: () => true }));
        mockFsReadFile(() => "content");

        // when, then
        fileTreeWalker
            .setAllowedFileTypes(["ts"])
            .onFile(
                (filePath: string, filename: string, fileExtension: string, content: string) => {
                    expect(filePath).toBe("path\\file.ts");
                    expect(filename).toBe("file");
                    expect(fileExtension).toBe(".ts");
                    expect(content).toBe("content");
                }
            )
            .walk("path")
            .then(done);
    });
});

describe("when some file path is not allowed", () => {
    test("then FileTreeWalker finds allowed files and returns data", (done) => {
        // given
        const fileTreeWalker: FileTreeWalker = new FileTreeWalker();
        mockFsReaddir(() => ["file.txt", "file2.txt"]);
        mockFsStat(() => ({ isDirectory: () => false, isFile: () => true }));
        mockFsReadFile(() => "content");

        // when, then
        fileTreeWalker
            .setExcludedFiles(["path\\file.txt"])
            .onFile(
                (filePath: string, filename: string, fileExtension: string, content: string) => {
                    expect(filePath).toBe("path\\file2.txt");
                    expect(filename).toBe("file2");
                    expect(fileExtension).toBe(".txt");
                    expect(content).toBe("content");
                }
            )
            .walk("path")
            .then(done);
    });
});

describe("when root directory contains subdirectory", () => {
    test("then FileTreeWalker finds subdirectory and returns data", (done) => {
        // given
        const fileTreeWalker: FileTreeWalker = new FileTreeWalker();
        mockFsReaddir((path) => {
            if (path === "path") {
                return ["subdir"];
            }
            return [];
        });
        mockFsStat(() => ({ isDirectory: () => true, isFile: () => false }));
        mockFsReadFile(() => "content");

        // when, then
        fileTreeWalker
            .onDirectory((directoryPath: string, directoryName: string) => {
                expect(directoryPath).toBe("path\\subdir");
                expect(directoryName).toBe("subdir");
            })
            .walk("path")
            .then(done);
    });
});

describe("when root directory contains multiple subdirectories", () => {
    test("then FileTreeWalker finds all subdirectories and returns data", (done) => {
        // given
        const fileTreeWalker: FileTreeWalker = new FileTreeWalker();
        mockFsReaddir((path) => {
            if (path === "path") {
                return ["subdir"];
            } else if (path === "path\\subdir") {
                return ["subdir2"];
            }
            return [];
        });
        mockFsStat(() => ({ isDirectory: () => true, isFile: () => false }));
        let foundSubdir2: boolean = false;

        // when
        fileTreeWalker
            .onDirectory((directoryPath: string) => {
                if (directoryPath === "path\\subdir\\subdir2") {
                    foundSubdir2 = true;
                }
            })
            .walk("path")
            .then(() => {
                // then
                expect(foundSubdir2).toBeTruthy();
                done();
            });
    });
});

function mockFsReaddir(getReturnValue: (directoryPath: string) => string[]): void {
    spyOn(fs.promises, "readdir").and.callFake((directoryPath) =>
        Promise.resolve(getReturnValue(directoryPath))
    );
}

function mockFsStat(getReturnValue: () => object): void {
    spyOn(fs.promises, "stat").and.callFake(() => Promise.resolve(getReturnValue()));
}

function mockFsReadFile(getReturnValue: () => string) {
    spyOn(fs.promises, "readFile").and.callFake(() => Promise.resolve(getReturnValue()));
}
