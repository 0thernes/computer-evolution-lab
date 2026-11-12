"""Halve a Radiance .hdr (RGBE, new-style RLE) with a 2x2 box filter in linear float; writes flat (uncompressed) RGBE.
usage: python3 tools/hdr_half.py in.hdr out.hdr"""
import sys, numpy as np
def read(p):
    b = open(p, 'rb').read(); i = b.index(b'\n\n') + 2; j = b.index(b'\n', i); res = b[i:j].split(); H, W = int(res[1]), int(res[3]); d = memoryview(b)[j + 1:]; k = 0
    img = np.zeros((H, W, 4), np.uint8)
    for y in range(H):
        if d[k] == 2 and d[k + 1] == 2:
            k += 4
            for c in range(4):
                x = 0
                while x < W:
                    n = d[k]; k += 1
                    if n > 128: n -= 128; img[y, x:x + n, c] = d[k]; k += 1
                    else: img[y, x:x + n, c] = np.frombuffer(d[k:k + n], np.uint8); k += n
                    x += n
        else: img[y] = np.frombuffer(d[k:k + W * 4], np.uint8).reshape(W, 4); k += W * 4
    e = img[..., 3].astype(np.float64); f = np.where(e > 0, np.ldexp(1.0, (e - 136).astype(int)), 0); return img[..., :3] * f[..., None]
def write(p, rgb):
    H, W, _ = rgb.shape; m = rgb.max(-1); e = np.where(m > 1e-32, np.floor(np.log2(np.maximum(m, 1e-32))) + 1, 0); sc = np.where(m > 1e-32, 256.0 / np.exp2(e), 0)
    out = np.zeros((H, W, 4), np.uint8); out[..., :3] = np.clip(rgb * sc[..., None], 0, 255).astype(np.uint8); out[..., 3] = np.where(m > 1e-32, e + 128, 0).astype(np.uint8)
    open(p, 'wb').write(b'#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n' + f'-Y {H} +X {W}\n'.encode() + out.tobytes())
x = read(sys.argv[1]); H, W = x.shape[0] // 2 * 2, x.shape[1] // 2 * 2; x = x[:H, :W].reshape(H // 2, 2, W // 2, 2, 3).mean((1, 3)); write(sys.argv[2], x); print(sys.argv[2], x.shape, x.max())
