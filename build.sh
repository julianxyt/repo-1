#!/bin/sh
# Assembles the app from build/ parts into:
#   app.html   - body-only page for publishing as a Claude Artifact
#   index.html - standalone document (open from disk, or host on any static site)
set -e
cd "$(dirname "$0")"
cat build/01-head.html build/02-style2.html build/03-markup.html \
    build/04-data.html build/05-birds.html build/06-app.html build/07-boot.html > app.html
# The parts carry <title>/<style>/<script> plus body markup, so split them properly:
python3 - <<'PY'
import io,re
# Offline support belongs to the self-hosted build only; the Artifact host serves
# its own origin and would reject this.
SW = ('\n<script>\n'
 "if('serviceWorker' in navigator && location.protocol.startsWith('http')){\n"
 "  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));\n"
 '}\n</script>')
part=io.open('app.html',encoding='utf-8').read()
head=[]
body=part
# pull the <title> and the two <style> blocks into <head>
m=re.search(r'<title>.*?</title>\n?',body,re.S)
if m: head.append(m.group(0)); body=body.replace(m.group(0),'',1)
for m in re.findall(r'<link rel="(?:preconnect|stylesheet)"[^>]*>\n?',body):
    head.append(m); body=body.replace(m,'',1)
for m in re.findall(r'<style>.*?</style>\n?',body,re.S):
    head.append(m); body=body.replace(m,'',1)
doc=('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
 '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
 '<meta name="theme-color" content="#171B15" media="(prefers-color-scheme: dark)">\n'
 '<meta name="theme-color" content="#F6F7F3" media="(prefers-color-scheme: light)">\n'
 '<meta name="description" content="A field checklist of the animals of Kruger National Park. Tick off what you see, attach your own photos, watch the count climb.">\n'
 '<meta name="mobile-web-app-capable" content="yes">\n'
 '<link rel="manifest" href="manifest.webmanifest">\n'
 '<link rel="icon" href="icon.svg" type="image/svg+xml">\n'
 '<link rel="apple-touch-icon" href="icon.svg">\n'
 '<style>html{color-scheme:light dark}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>\n'
 + ''.join(head) + '</head>\n<body>\n' + body.strip() + SW + '\n</body>\n</html>\n')
io.open('index.html','w',encoding='utf-8').write(doc)
print('index.html', len(doc), 'bytes')
PY
echo "app.html   $(wc -c < app.html) bytes"
