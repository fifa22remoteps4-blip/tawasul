import re
s=open('/home/claude/tawasul/index.html',encoding='utf-8').read()
starts=[m.end() for m in re.finditer(r'<script>',s)]
a=starts[-1]; b=s.find('</script>',a)
app=open('/home/claude/w/app_new.js',encoding='utf-8').read()
out=s[:a]+app+s[b:]
css='.parthead{font-size:24px;font-weight:800;margin:22px 4px 6px;padding:6px 14px;border-inline-start:6px solid var(--acc);color:var(--ink,inherit)}\n'
i=out.find('</style>'); out=out[:i]+css+out[i:]
open('/home/claude/w/index.html','w',encoding='utf-8').write(out)
print(len(out))
