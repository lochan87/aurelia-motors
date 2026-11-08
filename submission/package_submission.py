"""
Packaging script for Aurelia Motors submission archive.
Packages all required source code, tests, migrations, Docker configs,
assets, documentation, and technical design documents into
submission/aurelia-motors-submission.zip.
"""
import os
import zipfile
import shutil
import tempfile
import subprocess

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZIP_PATH = os.path.join(REPO_ROOT, "submission", "aurelia-motors-submission.zip")

EXCLUDE_DIRS = {"node_modules", ".git", "dist", ".gemini", ".turbo", "__pycache__", "coverage", ".vite", "pdf_pages"}
EXCLUDE_FILES = {".env", "aurelia-motors-submission.zip"}
EXCLUDE_EXTS = {".log", ".tmp", ".zip"}

def create_submission_zip():
    print(f"Creating submission zip from {REPO_ROOT}...")
    files_to_zip = []
    for root, dirs, files in os.walk(REPO_ROOT):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".git")]
        for f in files:
            if f in EXCLUDE_FILES or any(f.endswith(ext) for ext in EXCLUDE_EXTS):
                continue
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, REPO_ROOT).replace("\\", "/")
            if rel_path.startswith("./"):
                rel_path = rel_path[2:]
            files_to_zip.append((full_path, rel_path))

    # Sort files for deterministic zip structure
    files_to_zip.sort(key=lambda x: x[1])

    # Ensure target directory exists
    os.makedirs(os.path.dirname(ZIP_PATH), exist_ok=True)

    with zipfile.ZipFile(ZIP_PATH, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for full_path, rel_path in files_to_zip:
            # Enforce strict exclusions
            parts = rel_path.split("/")
            assert "node_modules" not in parts, f"Illegal node_modules: {rel_path}"
            assert ".git" not in parts, f"Illegal .git: {rel_path}"
            assert "dist" not in parts, f"Illegal dist: {rel_path}"
            assert rel_path != ".env", f"Illegal .env: {rel_path}"

            zf.write(full_path, arcname=rel_path)

    zip_size = os.path.getsize(ZIP_PATH)
    print(f"Submission archive created: {ZIP_PATH}")
    print(f"File count: {len(files_to_zip)}")
    print(f"Archive size: {zip_size:,} bytes ({zip_size / (1024*1024):.2f} MB)")
    assert zip_size < 25 * 1024 * 1024, f"Zip size exceeds 25 MB: {zip_size} bytes"

    # Verify integrity with testzip
    with zipfile.ZipFile(ZIP_PATH, "r") as zf:
        bad_file = zf.testzip()
        if bad_file:
            raise RuntimeError(f"Corrupt file in zip: {bad_file}")
        print("Zip integrity test passed (testzip OK)")

if __name__ == "__main__":
    create_submission_zip()

