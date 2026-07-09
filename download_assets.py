import os
import urllib.request
import json

players_to_download = {
    "matt_turner": "https://upload.wikimedia.org/wikipedia/commons/5/52/Matt_Turner_2021_%28cropped%29.jpg",
    "sergino_dest": "https://upload.wikimedia.org/wikipedia/commons/c/cb/Sergi%C3%B1o_Dest_2022_%28cropped%29.jpg",
    "antonee_robinson": "https://upload.wikimedia.org/wikipedia/commons/d/da/Antonee_Robinson_2022_%28cropped%29.jpg",
    "tyler_adams": "https://upload.wikimedia.org/wikipedia/commons/2/2a/Tyler_Adams_2022_%28cropped%29.jpg",
    "weston_mckennie": "https://upload.wikimedia.org/wikipedia/commons/b/be/Weston_McKennie_2022_%28cropped%29.jpg",
    "christian_pulisic": "https://upload.wikimedia.org/wikipedia/commons/e/e9/Christian_Pulisic_2023_%28cropped%29.jpg",
    "brenden_aaronson": "https://upload.wikimedia.org/wikipedia/commons/4/41/Brenden_Aaronson_2022_%28cropped%29.jpg",
    "folarin_balogun": "https://upload.wikimedia.org/wikipedia/commons/c/cc/Folarin_Balogun_USMNT_2023.jpg",
    "luis_malagon": "https://upload.wikimedia.org/wikipedia/commons/a/ae/Luis_Malag%C3%B3n_2023.jpg",
    "cesar_montes": "https://upload.wikimedia.org/wikipedia/commons/1/1a/C%C3%A9sar_Montes_2022_%28cropped%29.jpg",
    "edson_alvarez": "https://upload.wikimedia.org/wikipedia/commons/c/c9/Edson_%C3%81lvarez_2023_%28cropped%29.jpg",
    "uriel_antuna": "https://upload.wikimedia.org/wikipedia/commons/c/c3/Uriel_Antuna_2022_%28cropped%29.jpg",
    "santiago_gimenez": "https://upload.wikimedia.org/wikipedia/commons/3/30/Santiago_Gim%C3%A9nez_2023_%28cropped%29.jpg",
    "hirving_lozano": "https://upload.wikimedia.org/wikipedia/commons/d/de/Hirving_Lozano_2018.jpg"
}

sponsors_to_download = {
    "cocacola": "https://upload.wikimedia.org/wikipedia/commons/c/ce/Coca-Cola_logo.svg",
    "adidas": "https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg",
    "visa": "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_2021.svg",
    "hyundai": "https://upload.wikimedia.org/wikipedia/commons/2/26/Hyundai_Motor_Company_logo.svg"
}

def download_file(url, filepath):
    print(f"Downloading {url} to {filepath}...")
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            with open(filepath, 'wb') as f:
                f.write(response.read())
        print("Success!")
    except Exception as e:
        print(f"Failed to download {url}: {e}")
        # If failure, copy standard fallback if available or create a small empty text file
        if not os.path.exists(filepath):
            with open(filepath, 'wb') as f:
                f.write(b"")

if __name__ == "__main__":
    players_dir = "frontend/public/players"
    sponsors_dir = "frontend/public/sponsors"
    
    os.makedirs(players_dir, exist_ok=True)
    os.makedirs(sponsors_dir, exist_ok=True)
    
    for name, url in players_to_download.items():
        download_file(url, os.path.join(players_dir, f"{name}.jpg"))
        
    for name, url in sponsors_to_download.items():
        ext = "svg" if url.endswith(".svg") else "png"
        download_file(url, os.path.join(sponsors_dir, f"{name}.{ext}"))
        
    print("Done downloading assets!")
