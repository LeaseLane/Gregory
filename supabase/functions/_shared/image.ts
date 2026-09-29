// Largeur × hauteur lues dans l'en-tête (JPEG, PNG, WebP), sans décoder
// l'image. null si le format n'est pas reconnu : la photo est alors écartée.
export function dimensionsImage(o: Uint8Array): { l: number; h: number } | null {
  if (o[0] === 0x89 && o[1] === 0x50 && o.length > 24) {
    const v = new DataView(o.buffer, o.byteOffset);
    return { l: v.getUint32(16), h: v.getUint32(20) };
  }
  if (o[0] === 0x52 && o[1] === 0x49 && o[8] === 0x57 && o.length > 30) {
    const v = new DataView(o.buffer, o.byteOffset), t = String.fromCharCode(o[12], o[13], o[14], o[15]);
    if (t === "VP8X") return { l: 1 + (o[24] | o[25] << 8 | o[26] << 16), h: 1 + (o[27] | o[28] << 8 | o[29] << 16) };
    if (t === "VP8 ") return { l: v.getUint16(26, true) & 0x3fff, h: v.getUint16(28, true) & 0x3fff };
    if (t === "VP8L") { const b = v.getUint32(21, true); return { l: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 }; }
    return null;
  }
  if (o[0] === 0xff && o[1] === 0xd8) {
    let i = 2;
    while (i + 9 < o.length) {
      if (o[i] !== 0xff) { i++; continue; }
      const m = o[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: o[i + 5] << 8 | o[i + 6], l: o[i + 7] << 8 | o[i + 8] };
      i += 2 + (o[i + 2] << 8 | o[i + 3]);
    }
  }
  return null;
}
