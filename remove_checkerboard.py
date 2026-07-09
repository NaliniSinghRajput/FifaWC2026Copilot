import os
from PIL import Image

image_mappings = {
    "media__1783503951657.png": "adidas.png",
    "media__1783503951671.png": "cocacola.png",
    "media__1783503951680.jpg": "hyundai.png",
    "media__1783503951707.jpg": "visa.png"
}

source_dir = "C:/Users/KIIT/.gemini/antigravity/brain/f36122dd-90f2-41ad-aec7-e8e0730ab0d6"
target_dir = "frontend/public/sponsors"

def process_image(src_name, dest_name):
    src_path = os.path.join(source_dir, src_name)
    dest_path = os.path.join(target_dir, dest_name)
    
    if not os.path.exists(src_path):
        print(f"Source file not found: {src_path}")
        return
        
    print(f"Processing {src_path} -> {dest_path}")
    img = Image.open(src_path).convert("RGBA")
    pixels = img.load()
    
    # We clear pixels that are very light (representing the checkerboard background)
    width, height = img.size
    for x in range(width):
        for y in range(height):
            r, g, b, a = pixels[x, y]
            # Checkerboard background threshold
            if r > 190 and g > 190 and b > 190:
                pixels[x, y] = (255, 255, 255, 0)
                
    img.save(dest_path, "PNG")
    print(f"Saved transparent image to {dest_path}")

if __name__ == "__main__":
    os.makedirs(target_dir, exist_ok=True)
    for src, dest in image_mappings.items():
        process_image(src, dest)
    print("All sponsor images processed successfully!")
