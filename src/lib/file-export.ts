/**
 * File Export Utilities
 * Handles downloading individual files and exporting entire projects
 */

import { ProjectFile } from '@/stores/projectStore';

// Download a single file
export function downloadFile(filename: string, content: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Get MIME type from file extension
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    ts: 'text/typescript',
    tsx: 'text/typescript',
    js: 'text/javascript',
    jsx: 'text/javascript',
    json: 'application/json',
    html: 'text/html',
    css: 'text/css',
    scss: 'text/scss',
    md: 'text/markdown',
    sql: 'application/sql',
    txt: 'text/plain',
  };
  return mimeTypes[ext || ''] || 'text/plain';
}

// Simple ZIP file creator without external dependencies
// Uses the ZIP format specification for uncompressed files
class SimpleZip {
  private files: { name: string; content: Uint8Array; date: Date }[] = [];

  addFile(name: string, content: string) {
    const encoder = new TextEncoder();
    this.files.push({
      name,
      content: encoder.encode(content),
      date: new Date(),
    });
  }

  private crc32(data: Uint8Array): number {
    let crc = 0xffffffff;
    const table = this.getCrc32Table();
    for (let i = 0; i < data.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  private getCrc32Table(): number[] {
    const table: number[] = [];
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[i] = c;
    }
    return table;
  }

  private dosDateTime(date: Date): { time: number; date: number } {
    return {
      time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
      date: ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
    };
  }

  generate(): Blob {
    const localHeaders: Uint8Array[] = [];
    const centralHeaders: Uint8Array[] = [];
    let offset = 0;

    for (const file of this.files) {
      const crc = this.crc32(file.content);
      const dt = this.dosDateTime(file.date);
      const nameBytes = new TextEncoder().encode(file.name);

      // Local file header
      const localHeader = new Uint8Array(30 + nameBytes.length + file.content.length);
      const localView = new DataView(localHeader.buffer);

      localView.setUint32(0, 0x04034b50, true); // Local file header signature
      localView.setUint16(4, 20, true); // Version needed
      localView.setUint16(6, 0, true); // General purpose bit flag
      localView.setUint16(8, 0, true); // Compression method (none)
      localView.setUint16(10, dt.time, true); // File time
      localView.setUint16(12, dt.date, true); // File date
      localView.setUint32(14, crc, true); // CRC-32
      localView.setUint32(18, file.content.length, true); // Compressed size
      localView.setUint32(22, file.content.length, true); // Uncompressed size
      localView.setUint16(26, nameBytes.length, true); // File name length
      localView.setUint16(28, 0, true); // Extra field length

      localHeader.set(nameBytes, 30);
      localHeader.set(file.content, 30 + nameBytes.length);
      localHeaders.push(localHeader);

      // Central directory header
      const centralHeader = new Uint8Array(46 + nameBytes.length);
      const centralView = new DataView(centralHeader.buffer);

      centralView.setUint32(0, 0x02014b50, true); // Central directory signature
      centralView.setUint16(4, 20, true); // Version made by
      centralView.setUint16(6, 20, true); // Version needed
      centralView.setUint16(8, 0, true); // General purpose bit flag
      centralView.setUint16(10, 0, true); // Compression method
      centralView.setUint16(12, dt.time, true); // File time
      centralView.setUint16(14, dt.date, true); // File date
      centralView.setUint32(16, crc, true); // CRC-32
      centralView.setUint32(20, file.content.length, true); // Compressed size
      centralView.setUint32(24, file.content.length, true); // Uncompressed size
      centralView.setUint16(28, nameBytes.length, true); // File name length
      centralView.setUint16(30, 0, true); // Extra field length
      centralView.setUint16(32, 0, true); // File comment length
      centralView.setUint16(34, 0, true); // Disk number start
      centralView.setUint16(36, 0, true); // Internal file attributes
      centralView.setUint32(38, 0, true); // External file attributes
      centralView.setUint32(42, offset, true); // Relative offset of local header

      centralHeader.set(nameBytes, 46);
      centralHeaders.push(centralHeader);

      offset += localHeader.length;
    }

    // End of central directory
    const centralDirSize = centralHeaders.reduce((sum, h) => sum + h.length, 0);
    const endRecord = new Uint8Array(22);
    const endView = new DataView(endRecord.buffer);

    endView.setUint32(0, 0x06054b50, true); // End of central directory signature
    endView.setUint16(4, 0, true); // Disk number
    endView.setUint16(6, 0, true); // Disk with central directory
    endView.setUint16(8, this.files.length, true); // Number of entries on disk
    endView.setUint16(10, this.files.length, true); // Total entries
    endView.setUint32(12, centralDirSize, true); // Central directory size
    endView.setUint32(16, offset, true); // Central directory offset
    endView.setUint16(20, 0, true); // Comment length

    // Combine all parts
    const totalSize = offset + centralDirSize + 22;
    const zipData = new Uint8Array(totalSize);
    let pos = 0;

    for (const header of localHeaders) {
      zipData.set(header, pos);
      pos += header.length;
    }
    for (const header of centralHeaders) {
      zipData.set(header, pos);
      pos += header.length;
    }
    zipData.set(endRecord, pos);

    return new Blob([zipData], { type: 'application/zip' });
  }
}

// Export entire project as ZIP
export function exportProjectAsZip(projectName: string, files: ProjectFile[]) {
  const zip = new SimpleZip();
  
  // Add all files to ZIP
  for (const file of files) {
    if (file.type === 'file' && file.content) {
      zip.addFile(file.path, file.content);
    }
  }
  
  // Generate and download
  const blob = zip.generate();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Copy all code to clipboard as formatted text
export function copyProjectToClipboard(files: ProjectFile[]): string {
  let output = '';
  
  for (const file of files) {
    if (file.type === 'file' && file.content) {
      output += `// ===== ${file.path} =====\n`;
      output += file.content;
      output += '\n\n';
    }
  }
  
  return output;
}
