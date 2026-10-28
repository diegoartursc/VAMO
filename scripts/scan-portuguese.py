# Lista palavras que nao estao no dicionario de ingles (macOS /usr/share/dict) em textos do app.
# Uso: python3 scripts/scan-portuguese.py apps/mobile/app apps/mobile/src packages/shared

import re,os,sys,collections
D=set(w.strip().lower() for w in open('/usr/share/dict/words'))
D|=set(w.strip().lower() for w in open('/usr/share/dict/web2a') for w in w.split())
EXTRA=set("""vamo app apps itinerary itineraries checkout email emails online signup login logout url urls pdf pdfs jpg png webp heic stripe google airbnb booking wifi sim usd aud eur gbp brl ok faq faqs ios android api id ids todo nyc covid uber lyft ui ux whatsapp instagram youtube tiktok facebook gmail paypal apple visa mastercard amex esim gb mb kb km kg lbs am pm vs etc avg max min info tbd profile signin dashboard checklist checklists hotel hotels wishlist favorites""".split())
D|=EXTRA
def known(w):
    if w in D: return True
    for suf in ('s','es','ed','d','ing','ly','er','ers','est','ies','ied',"'s","’s",'n\'t'):
        if w.endswith(suf):
            b=w[:-len(suf)]
            if b in D or b+'e' in D or (suf in('ies','ied') and b+'y' in D): return True
            if len(b)>2 and b[-1]==b[-2] and b[:-1] in D: return True
    return False
seen=collections.defaultdict(list)
roots=sys.argv[1:]
for root in roots:
  for dp,_,fs in os.walk(root):
    if 'node_modules' in dp or '/.' in dp: continue
    for f in fs:
      if not f.endswith(('.ts','.tsx')) or '.test.' in f or 'mockData' in f: continue
      p=os.path.join(dp,f)
      inc=False
      for i,l in enumerate(open(p,encoding='utf8'),1):
        st=l.strip()
        if inc:
            if '*/' in st: inc=False
            continue
        if st.startswith('/*') and '*/' not in st: inc=True; continue
        if st.startswith(('//','*','{/*','import ','export * from')) or 'console.' in l or 'require(' in l: continue
        l2=re.sub(r"(?<![:'\"`])//\s.*$","",l); l2=re.sub(r"/\*.*?\*/","",l2); l2=re.sub(r"\{/\*.*?\*/\}","",l2)
        for m in re.finditer(r"""'((?:[^'\\\n]|\\.)+)'|"((?:[^"\\\n]|\\.)+)"|`([^`\n]+)`|>([^<>{}\n]+)(?=<|\{|$)|\}([^<>{}\n;=()]+)(?=<|\{)""",l2):
          s=next(x for x in m.groups() if x)
          if re.match(r'^(https?:|/|\.|#|rgba?\(|@|[a-z]+:)',s.strip()): continue
          if ' ' not in s.strip() and re.match(r'^[A-Za-z0-9_\-./:]+$',s.strip()) and not re.match(r'^[A-ZÀ-Ú][a-zà-ÿ]+$',s.strip()): continue
          s2=re.sub(r'\$\{[^}]*\}',' ',s)
          for w in re.findall(r"[A-Za-zÀ-ÿ]+",s2):
            lw=w.lower()
            if len(lw)<3: continue
            if re.search(r'[a-z][A-Z]',w): continue  # camelCase
            if not known(lw):
              seen[lw].append(f"{p}:{i}")
for w,locs in sorted(seen.items(), key=lambda x:-len(x[1])):
    print(f"{w}\t{len(locs)}\t{locs[0]}")
