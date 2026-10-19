import pathlib, re
t = pathlib.Path('ohm-law-simulation.html').read_text(encoding='utf-8')
m = re.search(r'<script>(.*)</script>', t, re.S)
pathlib.Path('check_tmp4.js').write_text(m.group(1), encoding='utf-8')
print('extracted', len(m.group(1)))
