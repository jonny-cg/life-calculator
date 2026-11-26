"""앱 아이콘 생성 스크립트
resources/app-icon-source.png (정사각형 원본) → 웹 아이콘 + 안드로이드 아이콘(일반/원형/적응형)
사용: python3 scripts/make-icons.py   (Pillow, numpy 필요)
"""
from collections import deque
from PIL import Image, ImageDraw, ImageFilter
import numpy as np, os

ROOT = os.path.join(os.path.dirname(__file__), '..')
src = Image.open(os.path.join(ROOT, 'resources/app-icon-source.png')).convert('RGB')
# 적응형 아이콘(안드로이드 8+ 홈 화면) 안 그림 크기 비율: 0.75 = 이전보다 약 25% 작게 (꽉 차 보이지 않도록)
OBJ_SCALE = 0.75
W = src.size[0]
a = np.asarray(src).astype(np.float32)

def mask_img(img, size, shape, r=0.225):
    im = img.resize((size, size), Image.LANCZOS).convert('RGBA')
    m = Image.new('L', (size * 4, size * 4), 0)
    d = ImageDraw.Draw(m)
    if shape == 'circle': d.ellipse([0, 0, size * 4 - 1, size * 4 - 1], fill=255)
    else: d.rounded_rectangle([0, 0, size * 4 - 1, size * 4 - 1], radius=int(size * 4 * r), fill=255)
    im.putalpha(m.resize((size, size), Image.LANCZOS))
    return im

out = os.path.join(ROOT, 'resources/android')
os.makedirs(out, exist_ok=True)

# 적응형 아이콘: 흰색 그림(전경)과 그라데이션 배경 분리
bright = a.mean(axis=2); sat = a.max(axis=2) - a.min(axis=2)
nonwhite = (bright < 215) | (sat > 60)
h, w = nonwhite.shape
bg = np.zeros((h, w), bool); q = deque()
for x in range(w):
    for y in (0, h - 1):
        if nonwhite[y, x] and not bg[y, x]: bg[y, x] = True; q.append((y, x))
for y in range(h):
    for x in (0, w - 1):
        if nonwhite[y, x] and not bg[y, x]: bg[y, x] = True; q.append((y, x))
while q:
    y, x = q.popleft()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < h and 0 <= nx < w and not bg[ny, nx] and nonwhite[ny, nx]:
            bg[ny, nx] = True; q.append((ny, nx))
alpha = Image.fromarray(((~bg) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
fg = src.convert('RGBA'); fg.putalpha(alpha)
fg = fg.crop(alpha.point(lambda v: 255 if v > 128 else 0).getbbox())
TL, TR, BL, BR = a[5, 5], a[5, W - 6], a[W - 6, 5], a[W - 6, W - 6]
def grad(n):
    t = np.linspace(0, 1, n); X, Y = np.meshgrid(t, t)
    g = (TL * ((1 - X) * (1 - Y))[..., None] + TR * (X * (1 - Y))[..., None] + BL * ((1 - X) * Y)[..., None] + BR * (X * Y)[..., None])
    return Image.fromarray(g.clip(0, 255).astype(np.uint8))
for k, n in {'mdpi': 108, 'hdpi': 162, 'xhdpi': 216, 'xxhdpi': 324, 'xxxhdpi': 432}.items():
    grad(n).save(f'{out}/ic_launcher_background-{k}.png')
    c = Image.new('RGBA', (n, n), (0, 0, 0, 0))
    fw = int(n * 0.56 * OBJ_SCALE); fh = int(fg.size[1] * fw / fg.size[0])
    c.alpha_composite(fg.resize((fw, fh), Image.LANCZOS), ((n - fw) // 2, (n - fh) // 2 + int(n * 0.01)))
    c.save(f'{out}/ic_launcher_foreground-{k}.png')

# 일반(사각·원형)·웹 아이콘: 원본 이미지 그대로 (그림이 이미 여백을 두고 있음)
# 웹 / 윈도우
for s in (512, 192, 48):
    mask_img(src, s, 'round').save(os.path.join(ROOT, f'www/icons/icon-{s}.png'), optimize=True)
src.resize((1024, 1024), Image.LANCZOS).save(os.path.join(ROOT, 'www/icons/icon-1024.png'), optimize=True)

# 안드로이드 일반 아이콘
out = os.path.join(ROOT, 'resources/android')
os.makedirs(out, exist_ok=True)
for k, s in {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}.items():
    mask_img(src, s, 'round', 0.2).save(f'{out}/ic_launcher-{k}.png')
    mask_img(src, s, 'circle').save(f'{out}/ic_launcher_round-{k}.png')

print('icons done')
