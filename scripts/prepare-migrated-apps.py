"""Materialize the pinned public app sources into a MASATO LAB Pages staging directory."""
import argparse
from pathlib import Path
import shutil
import subprocess
import tempfile

SOURCES = (
    ("fighter-jet", "PERSONAL-JET", "e1cdc86455ea39c104fb5b828a3420972c0b5c72", "dist"),
    ("dub-riddim", "DUB-RIDDIM", "ee4088c08173fa2b80c9fcc1e1fda03180d8a522", "."),
    ("double-qr", "DOUBLE-QR", "f03ebd65ee600328809173af750d77f7707208b8", "dist"),
)

def prepare(root):
    for slug, repo, revision, directory in SOURCES:
        dest = root / "apps" / slug
        with tempfile.TemporaryDirectory() as temp:
            source = Path(temp)
            subprocess.run(["git", "init", "-q", temp], check=True)
            subprocess.run(["git", "-C", temp, "fetch", "--quiet", "--depth=1",
                            f"https://github.com/Masato-Nasu/{repo}.git", revision], check=True)
            subprocess.run(["git", "-C", temp, "checkout", "--quiet", "--detach", revision], check=True)
            shutil.copytree(source / directory, dest, dirs_exist_ok=True,
                            ignore=shutil.ignore_patterns(".git", "README.md") if directory == "." else None)
    index = root / "apps/dub-riddim/index.html"
    index.write_text(index.read_text().replace("intent://dub-siren.sunny-seed-0354.chatgpt.site/",
                     "intent://masato-lab.pages.dev/apps/dub-riddim/"))
    worker = root / "apps/double-qr/sw.js"
    worker.write_text(worker.read_text().replace("./index.html", "./")
                      .replace("double-qr-pwa-353bfb08c8e7", "double-qr-pwa-353bfb08c8e7-pages1"))
    (root / "apps/double-qr/_headers").unlink()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("staging_directory", type=Path)
    prepare(parser.parse_args().staging_directory)
