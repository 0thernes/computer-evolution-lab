# Build the PBR texture sets used by js/kit.js from CC0 ambientCG zips (+ the CC0 Poly Haven HDRI).
# Output: assets/tex/<res>/<set>_{n,r,c}.jpg. Roughness maps are re-centred (mean ~0.75) so the material's own roughness stays meaningful.
import zipfile, io, os, sys, shutil
from PIL import Image, ImageOps
import numpy as np
SRC = os.environ.get('CEL_ASSET_SRC', '/workspace/assets-src'); OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'tex')
SETS = {  # name: (ambientCG id, keep colour map?)
  'brushed': ('Metal009', False), 'steel': ('Metal038', False), 'plastic': ('Plastic010', False), 'abs': ('Plastic013A', False),
  'wood': ('Wood094', True), 'concrete': ('Concrete034', True)}
for res, px, q in (('1k', 1024, 74), ('2k', 2048, 84)):
    d = os.path.join(OUT, res); os.makedirs(d, exist_ok=True)
    for name, (aid, col) in SETS.items():
        z = zipfile.ZipFile(f'{SRC}/{aid}_{"2K" if res == "2k" else "1K"}.zip')
        get = lambda suf: Image.open(io.BytesIO(z.read(next(n for n in z.namelist() if n.endswith(suf)))))
        n = get('_NormalGL.jpg').convert('RGB').resize((px, px), Image.LANCZOS); n.save(f'{d}/{name}_n.jpg', quality=q)
        r = np.asarray(get('_Roughness.jpg').convert('L').resize((px, px), Image.LANCZOS), dtype=np.float32) / 255
        r = np.clip(0.75 + (r - r.mean()) * (0.6 / max(r.std() * 4, 0.2)), 0.2, 1) * 255
        Image.fromarray(r.astype(np.uint8)).save(f'{d}/{name}_r.jpg', quality=q)
        if col: get('_Color.jpg').convert('RGB').resize((px, px), Image.LANCZOS).save(f'{d}/{name}_c.jpg', quality=q)
    print(res, sum(os.path.getsize(os.path.join(d, f)) for f in os.listdir(d)) // 1024, 'KB')
hd = os.path.join(OUT, '..', 'hdri'); os.makedirs(hd, exist_ok=True)
shutil.copy(f'{SRC}/studio_small_09_1k.hdr', f'{hd}/studio_1k.hdr'); shutil.copy(f'{SRC}/studio_small_09_2k.hdr', f'{hd}/studio_2k.hdr')
