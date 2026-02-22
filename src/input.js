const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const clipboardy = require('clipboardy');

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

function isImageFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

function readFileInput(filePath) {
  const resolved = path.resolve(filePath);

  if (!fs.existsSync(resolved)) {
    throw new Error(`File not found: ${filePath}`);
  }

  if (isImageFile(resolved)) {
    const data = fs.readFileSync(resolved);
    const base64 = data.toString('base64');
    const mimeType = mime.lookup(resolved) || 'image/png';
    return {
      type: 'image',
      name: path.basename(resolved),
      mimeType,
      base64,
    };
  }

  const content = fs.readFileSync(resolved, 'utf-8');
  return {
    type: 'text',
    name: path.basename(resolved),
    content,
  };
}

function readClipboard() {
  const content = clipboardy.readSync();
  if (!content || content.trim().length === 0) {
    throw new Error('Clipboard is empty');
  }
  return {
    type: 'text',
    name: 'clipboard',
    content,
  };
}

function collectInputs(files, options) {
  const inputs = [];

  if (options.clipboard) {
    inputs.push(readClipboard());
  }

  for (const file of files) {
    inputs.push(readFileInput(file));
  }

  if (inputs.length === 0) {
    throw new Error('No input provided. Pass files or use --clipboard.');
  }

  return inputs;
}

module.exports = { collectInputs };
