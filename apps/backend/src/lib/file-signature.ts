import path from 'path';

export function hasValidFileSignature(buffer: Buffer, filename: string): boolean {
    const extension = path.extname(filename).slice(1).toLowerCase();
    const ascii = (start: number, end: number) => buffer.subarray(start, end).toString('ascii');

    if (extension === 'pdf') return ascii(0, 5) === '%PDF-';
    if (extension === 'jpg' || extension === 'jpeg') {
        return buffer.length >= 3
            && buffer[0] === 0xff
            && buffer[1] === 0xd8
            && buffer[2] === 0xff;
    }
    if (extension === 'png') {
        return buffer.length >= 8
            && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    }
    if (extension === 'webp') return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP';
    if (extension === 'webm') {
        return buffer.length >= 4
            && buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    }
    if (extension === 'heic' || extension === 'heif') {
        const brand = ascii(8, 12);
        return ascii(4, 8) === 'ftyp'
            && ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'].includes(brand);
    }
    if (extension === 'mp4' || extension === 'mov') return ascii(4, 8) === 'ftyp';
    return false;
}
