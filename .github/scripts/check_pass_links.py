#!/usr/bin/env python3
"""Google Play payments guard.

Starts from every page the app (or the Play listing) can open, follows the site's
own links, and fails if any page reached that way links to /pass/.
Pages under /pass/ may link back to the rest of the site; the reverse is forbidden.
Standard library only. Run from the repo root: python3 .github/scripts/check_pass_links.py
"""
import os
import re
import sys
from html.parser import HTMLParser
from urllib.parse import urlparse

# Opened by the app (Settings) or linked from the Play listing / Play Console.
ENTRY_POINTS = ["/", "/fr/", "/ar/", "/privacy/", "/fr/privacy/", "/ar/privacy/",
                "/delete-account/", "/fr/delete-account/", "/ar/delete-account/"]
SITE_HOSTS = {"proudoo.app", "www.proudoo.app"}
ROOT = os.getcwd()


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hrefs = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in ("href", "action", "formaction") and value:
                self.hrefs.append(value)


def site_path(href):
    """Return the site path for an internal link, or None for external/mailto/anchors."""
    u = urlparse(href.strip())
    if u.scheme in ("mailto", "tel", "javascript", "data"):
        return None
    if u.netloc and u.netloc.lower() not in SITE_HOSTS:
        return None
    if not u.netloc and not u.path:
        return None  # pure #anchor or ?query
    path = u.path or "/"
    if not path.startswith("/"):
        return None  # relative links are not used on this site; flagged below
    return path


def is_pass(path):
    return path == "/pass" or path.startswith("/pass/")


def file_for(path):
    target = os.path.join(ROOT, path.lstrip("/"))
    if path.endswith("/") or os.path.isdir(target):
        target = os.path.join(target, "index.html")
    return target if target.endswith(".html") and os.path.isfile(target) else None


def main():
    errors, seen, queue = [], set(), list(ENTRY_POINTS)
    while queue:
        page = queue.pop(0)
        if page in seen:
            continue
        seen.add(page)
        f = file_for(page)
        if f is None:
            if page in ENTRY_POINTS:
                print(f"note: entry point {page} does not exist yet, skipped")
            continue
        parser = Links()
        with open(f, encoding="utf-8") as fh:
            text = fh.read()
        parser.feed(text)
        # Catch /pass/ hidden in scripts or plain-text URLs too.
        if re.search(r"proudoo\.app/pass\b", text, re.I):
            errors.append(f"{page}: mentions the URL proudoo.app/pass")
        for href in parser.hrefs:
            u = urlparse(href.strip())
            if not u.scheme and not u.netloc and u.path and not u.path.startswith("/"):
                errors.append(f"{page}: relative link {href!r} (use a root-relative /path)")
                continue
            path = site_path(href)
            if path is None:
                continue
            if is_pass(path):
                errors.append(f"{page}: links to {href}")
            elif path not in seen:
                queue.append(path)
    print("Pages reachable from the app:", ", ".join(sorted(p for p in seen if file_for(p))))
    if errors:
        print("\nGoogle Play payments policy: these pages must not lead to /pass/.", file=sys.stderr)
        for e in errors:
            print("  - " + e, file=sys.stderr)
        sys.exit(1)
    print("OK: no page reachable from the app links to /pass/.")


if __name__ == "__main__":
    main()
