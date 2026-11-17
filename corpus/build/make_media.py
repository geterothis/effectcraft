"""Generate procedural test media for the EffectCraft .aep corpus.

Output: ../media/  (PNG with alpha, JPG, layered PSD, PNG sequence,
H.264 MP4 with audio, ProRes 4444 MOV with alpha, WAV, MP3).
"""
import math
import os
import subprocess

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEDIA = os.path.join(ROOT, "media")
os.makedirs(MEDIA, exist_ok=True)
FONT = "C:/Windows/Fonts/arialbd.ttf"


def p(name):
    return os.path.join(MEDIA, name)


def font(size):
    return ImageFont.truetype(FONT, size)


def grid_png():
    """512x512 RGBA: color grid, alpha circle cutout, labels for orientation."""
    w = h = 512
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cols = [(230, 60, 60), (60, 200, 90), (60, 110, 230), (240, 200, 40)]
    for i in range(4):
        for j in range(4):
            c = cols[(i + j) % 4]
            d.rectangle([i * 128, j * 128, i * 128 + 127, j * 128 + 127], fill=c + (255,))
    d.ellipse([176, 176, 336, 336], fill=(0, 0, 0, 0))
    d.text((8, 8), "TL", font=font(40), fill=(255, 255, 255, 255))
    d.text((440, 460), "BR", font=font(40), fill=(0, 0, 0, 255))
    img.save(p("grid_rgba.png"))


def soft_alpha_png():
    """256x256 RGBA radial gradient alpha (premultiply/straight alpha check)."""
    n = 256
    y, x = np.mgrid[0:n, 0:n]
    r = np.sqrt((x - n / 2) ** 2 + (y - n / 2) ** 2) / (n / 2)
    a = np.clip(1 - r, 0, 1)
    rgb = np.zeros((n, n, 3))
    rgb[..., 0] = 255
    rgb[..., 1] = 140 * (x / n)
    rgb[..., 2] = 255 * (y / n)
    out = np.dstack([rgb, a * 255]).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(p("soft_alpha.png"))


def photo_jpg():
    """1280x720 JPG: smooth gradients + text, stands in for a photo plate."""
    w, h = 1280, 720
    y, x = np.mgrid[0:h, 0:w]
    r = 128 + 127 * np.sin(x / 90.0)
    g = 128 + 127 * np.sin(y / 70.0 + 1)
    b = 128 + 127 * np.sin((x + y) / 120.0 + 2)
    img = Image.fromarray(np.dstack([r, g, b]).astype(np.uint8), "RGB")
    d = ImageDraw.Draw(img)
    d.text((40, 40), "PLATE 1280x720 JPG", font=font(56), fill=(255, 255, 255))
    for k in range(0, w, 160):
        d.line([k, 0, k, h], fill=(0, 0, 0), width=2)
    img.save(p("plate_1280x720.jpg"), quality=92)


def matte_png():
    """1280x720 grayscale luma matte (for luma track matte tests)."""
    w, h = 1280, 720
    img = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(img)
    d.text((140, 240), "MATTE", font=font(260), fill=255)
    img.save(p("luma_matte.png"))


def layered_psd():
    """640x480 PSD, 3 pixel layers + transparent areas (import as comp / merged)."""
    from psd_tools import PSDImage
    from psd_tools.api.layers import PixelLayer

    w, h = 640, 480
    bg = Image.new("RGBA", (w, h), (30, 40, 80, 255))
    psd = PSDImage.new("RGBA", (w, h))
    psd.append(PixelLayer.frompil(bg, psd, "Background", 0, 0))
    star = Image.new("RGBA", (300, 300), (0, 0, 0, 0))
    ds = ImageDraw.Draw(star)
    pts = []
    for k in range(10):
        ang = math.pi / 2 + k * math.pi / 5
        rad = 140 if k % 2 == 0 else 60
        pts.append((150 + rad * math.cos(ang), 150 - rad * math.sin(ang)))
    ds.polygon(pts, fill=(250, 210, 40, 255))
    psd.append(PixelLayer.frompil(star, psd, "Star", 60, 90))
    label = Image.new("RGBA", (280, 100), (0, 0, 0, 0))
    dl = ImageDraw.Draw(label)
    dl.rounded_rectangle([0, 0, 279, 99], radius=24, fill=(220, 50, 90, 200))
    dl.text((30, 22), "PSD", font=font(56), fill=(255, 255, 255, 255))
    psd.append(PixelLayer.frompil(label, psd, "Label", 330, 330))
    # psd-tools does not write the merged composite: build it so "merged" importers see pixels
    comp = psd.composite(force=True).convert("RGBA")
    chans = [ch.tobytes() for ch in comp.split()]
    psd._record.image_data.set_data(chans, psd._record.header)
    psd.save(p("layered.psd"))


def png_sequence():
    """24-frame PNG sequence 320x320, rotating bar + frame number."""
    seq = os.path.join(MEDIA, "seq")
    os.makedirs(seq, exist_ok=True)
    for f in range(24):
        img = Image.new("RGBA", (320, 320), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        ang = f / 24 * 2 * math.pi
        cx, cy = 160, 160
        dx, dy = 130 * math.cos(ang), 130 * math.sin(ang)
        d.line([cx - dx, cy - dy, cx + dx, cy + dy], fill=(80, 220, 255, 255), width=24)
        d.text((120, 130), "%02d" % f, font=font(60), fill=(255, 255, 255, 255))
        img.save(os.path.join(seq, "spin_%04d.png" % f))


def ffmpeg(*args):
    cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error"] + list(args)
    subprocess.run(cmd, check=True)


def videos_and_audio():
    # H.264 MP4 with AAC audio, 1280x720 30fps 4s: testsrc2 + 440Hz tone
    ffmpeg("-f", "lavfi", "-i", "testsrc2=size=1280x720:rate=30:duration=4",
           "-f", "lavfi", "-i", "sine=frequency=440:duration=4:sample_rate=48000",
           "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
           "-c:a", "aac", "-b:a", "192k", "-shortest", p("testsrc_720p30_h264_aac.mp4"))
    # 25fps clip for frame-rate interpretation tests
    ffmpeg("-f", "lavfi", "-i", "testsrc=size=640x360:rate=25:duration=3",
           "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", p("testsrc_360p25_h264.mp4"))
    # ProRes 4444 with 16-bit alpha (8-bit alpha renders broken in AE)
    ffmpeg("-f", "lavfi", "-i",
           "color=c=black@0.0:size=640x360:rate=30:duration=3,format=rgba,"
           "geq=r='255*(X/W)':g='128':b='255*(1-X/W)':a='255*gt(sin(2*PI*(X/W+T/3)),0)',format=yuva444p10le",
           "-c:v", "prores_ks", "-profile:v", "4444", "-pix_fmt", "yuva444p10le",
           "-alpha_bits", "16", p("wipe_alpha_prores4444.mov"))
    # Audio: stereo WAV chord, MP3 sweep
    ffmpeg("-f", "lavfi", "-i", "sine=frequency=330:duration=5:sample_rate=48000",
           "-f", "lavfi", "-i", "sine=frequency=495:duration=5:sample_rate=48000",
           "-filter_complex", "[0][1]amerge=inputs=2,volume=0.5", "-c:a", "pcm_s16le",
           p("chord_stereo_48k.wav"))
    ffmpeg("-f", "lavfi", "-i",
           "aevalsrc='0.4*sin(2*PI*(200+300*t)*t)':s=44100:d=4",
           "-c:a", "libmp3lame", "-b:a", "192k", p("sweep_44k.mp3"))


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        globals()[sys.argv[1]]()
        sys.exit(0)
    grid_png()
    soft_alpha_png()
    photo_jpg()
    matte_png()
    layered_psd()
    png_sequence()
    videos_and_audio()
    for root, _, files in os.walk(MEDIA):
        for f in sorted(files):
            fp = os.path.join(root, f)
            print(os.path.relpath(fp, MEDIA), os.path.getsize(fp))
