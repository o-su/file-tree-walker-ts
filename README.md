# file-tree-walker-ts

File tree walker written in TypeScript.

## Installation

```bash
npm install --save file-tree-walker-ts
```

## Example Usage

```typescript
import { FileTreeWalker } from "file-tree-walker-ts";

new FileTreeWalker()
    .setAllowedFileTypes(["ts", "js"])
    .onDirectory((directoryPath: string, directoryName: string) => {
        console.log(directoryPath, directoryName);
    })
    .onFile((filePath: string, filename: string, fileExtension: string, content: string) => {
        console.log(filePath, filename, fileExtension, content);
    })
    .walk("path");
```
