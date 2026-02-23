const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
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

function readClipboardImage() {
  const tmpFile = path.join(os.tmpdir(), `fastcase-clip-${Date.now()}.png`);
  const platform = os.platform();

  try {
    if (platform === 'win32') {
      // Windows: PowerShell로 클립보드 이미지 저장
      const psScript = `
        Add-Type -AssemblyName System.Windows.Forms
        $img = [System.Windows.Forms.Clipboard]::GetImage()
        if ($img -eq $null) { exit 1 }
        $img.Save('${tmpFile.replace(/\\/g, '\\\\')}')
      `;
      execSync(`powershell -Command "${psScript}"`, { stdio: 'pipe' });
    } else if (platform === 'darwin') {
      // macOS: osascript로 클립보드 이미지 저장
      execSync(
        `osascript -e 'set theFile to POSIX file "${tmpFile}"' -e 'try' -e 'set theImage to the clipboard as «class PNGf»' -e 'set fp to open for access theFile with write permission' -e 'write theImage to fp' -e 'close access fp' -e 'on error' -e 'return "no image"' -e 'end try'`,
        { stdio: 'pipe' }
      );
    } else {
      // Linux: xclip
      execSync(`xclip -selection clipboard -t image/png -o > "${tmpFile}"`, {
        stdio: 'pipe',
        shell: true,
      });
    }

    if (!fs.existsSync(tmpFile) || fs.statSync(tmpFile).size === 0) {
      return null;
    }

    const data = fs.readFileSync(tmpFile);
    const base64 = data.toString('base64');

    // 임시 파일 삭제
    try { fs.unlinkSync(tmpFile); } catch (e) { /* ignore */ }

    return {
      type: 'image',
      name: 'clipboard-image.png',
      mimeType: 'image/png',
      base64,
    };
  } catch (e) {
    // 임시 파일 정리
    try { fs.unlinkSync(tmpFile); } catch (e2) { /* ignore */ }
    return null;
  }
}

function readClipboard() {
  // 1. 먼저 이미지 시도
  const image = readClipboardImage();
  if (image) {
    return image;
  }

  // 2. 이미지 없으면 텍스트 시도
  try {
    const content = clipboardy.readSync();
    if (content && content.trim().length > 0) {
      return {
        type: 'text',
        name: 'clipboard',
        content,
      };
    }
  } catch (e) {
    // ignore
  }

  throw new Error('Clipboard is empty. Copy text or capture a screenshot first.');
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
