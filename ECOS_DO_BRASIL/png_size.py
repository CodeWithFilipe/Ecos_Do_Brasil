import struct
import os

def get_png_size(filepath):
    try:
        with open(filepath, 'rb') as f:
            f.read(16)
            width, height = struct.unpack('>LL', f.read(8))
            return width, height
    except Exception as e:
        return None

base = r"f:\downloads\PAC\PAC\ECOS_DO_BRASIL\assets\player"
for name in ["idle_down.png", "idle_up.png", "idle_left.png", "idle_right.png"]:
    path = os.path.join(base, name)
    size = get_png_size(path)
    print(f"{name}: {size}")
