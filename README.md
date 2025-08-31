
# JSWriteFCS

JSWriteFCS is a JavaScript class for reading and writing FCS (Flow Cytometry Standard) files. It enables construction of valid FCS files from header, text, and data segments, and supports both browser and Node.js environments.

## 📦 Installation & Import

Ensure you have the `JSWriteFCS.js` and its dependency `fcs.js` (from [MorganConrad/fcs](https://github.com/MorganConrad/fcs)) in your project:

```js
const JSWriteFCS = require('./JSWriteFCS');
const FCS = require('./packages/fcs/fcs.js');
```

## 🧪 Example: Reading an FCS File

```js
const fcs = new FCS();
await fcs.readFile(file); // `file` is a user-selected FCS file

const writer = new JSWriteFCS();
writer.readFCS(fcs);

console.log(writer.header);  // FCS header information
console.log(writer.text);    // FCS text segment
console.log(writer.data);    // FCS data segment
```

## 💾 Example: Writing an FCS File

```js
const writer = new JSWriteFCS(
  headerObject,
  textObject,
  dataArray, // 2D array of numbers, e.g., [[1.0, 2.0], [3.0, 4.0]]
  {},        // analysis (optional)
  {}         // options (optional)
);

// Save as a downloadable file (browser environment)
await writer.writeFCS('sample.fcs');

// Or save to a specific folder (requires File System Access API)
await writer.writeFCS('sample.fcs', saveFolderHandle);
```

## 📘 Parameter Reference

| Parameter     | Type              | Description |
|---------------|-------------------|-------------|
| `header`      | `Object`          | FCS header info, e.g., version number |
| `text`        | `Object`          | Text segment with keys like `$BEGINSTEXT`, `$ENDSTEXT`, etc. |
| `data`        | `ArrayBuffer` or 2D array | Experimental data, typically float32 values |
| `analysis`    | `Object`          | Analysis segment (currently not saved) |
| `options`     | `Object`          | Optional configuration |

## 🌐 Browser Compatibility Notes

- If using in a browser, replace Node.js `Buffer` with `TextEncoder` and `Uint8Array`.
- If using `saveFolderHandle`, ensure the browser supports the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API).

## 📄 License

MIT License © 2025 Xiangming Cai
