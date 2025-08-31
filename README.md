# JSWriteFCS
The write fcs file function in javascript. 
📄 JSWriteFCS Usage Guide
Overview
JSWriteFCS is a JavaScript class for reading and writing FCS (Flow Cytometry Standard) files. It allows you to construct valid FCS files from header, text, and data segments, and supports both browser and Node.js environments.

📦 Installation & Import
Make sure you have the JSWriteFCS.js and its dependency fcs.js (from MorganConrad/fcs) in your project:


🧪 Example: Reading an FCS File

💾 Example: Writing an FCS File

📘 Parameter Reference
Parameter	Type	Description
header	Object	FCS header info, e.g., version number
text	Object	Text segment with keys like $BEGINSTEXT, $ENDSTEXT, etc.
data	ArrayBuffer or 2D array	Experimental data, typically float32 values
analysis	Object	Analysis segment (currently not saved)
options	Object	Optional configuration
🌐 Browser Compatibility Notes
If using in a browser, replace Node.js Buffer with TextEncoder and Uint8Array.
If using saveFolderHandle, ensure the browser supports the File System Access API.
📄 License
MIT License © 2025 Xiangming Cai
