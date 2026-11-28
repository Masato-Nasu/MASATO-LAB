"""Build the original GRAMMAR-STUDIO worker for the /apps/grammar-studio/ Pages route."""
import argparse
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

revision = "e617b4f1fdd0ada4c758e12d1c1ac2e6ad290c49"
base = "/apps/grammar-studio"
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("staging_directory", type=Path)
args = parser.parse_args()
with tempfile.TemporaryDirectory() as temp:
    src = Path(temp)
    subprocess.run(["git", "init", "-q", temp], check=True)
    subprocess.run(["git", "-C", temp, "fetch", "--quiet", "--depth=1",
                    "https://github.com/Masato-Nasu/GRAMMAR-STUDIO.git", revision], check=True)
    subprocess.run(["git", "-C", temp, "checkout", "--quiet", "--detach", revision], check=True)
    for name in ["app.js", "pwa.js", "sw.js", "manifest.webmanifest", "index.html"]:
        p = src / "public" / name
        # Only same-origin path literals change. Lesson text and prompts are untouched.
        p.write_text(re.sub(r"""(?<=["'])/(?=[\w"'])""", base + "/", p.read_text()))
    p = src / "worker.js"
    code = p.read_text().replace("async function tutor(request,url)", "async function tutor(request,url,model)")
    code = code.replace("model:'gpt-5.4-mini'", "model")
    code = code.replace("async fetch(request)", "async fetch(request,env)")
    code = code.replace("const url = new URL(request.url);", 
                        "const url = new URL(request.url);\n    url.pathname = url.pathname.slice(" + str(len(base)) + ") || '/';")
    code = code.replace("return tutor(request,url);", "return tutor(request,url,env.GRAMMAR_MODEL || 'gpt-5.4-mini');")
    p.write_text(code)
    subprocess.run(["node", "scripts/build.mjs"], cwd=src, check=True)
    output = args.staging_directory / "lib/grammar-worker.mjs"
    output.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(src / "dist/server/index.js", output)
