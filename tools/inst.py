import sys,struct
sys.path.insert(0,'/tmp/claude-0/tools')
from aepdump import parse
d=open(sys.argv[1],'rb').read(); root=parse(d,0,len(d)); want=sys.argv[2]
def show(n,ind=0,depth=0):
    for c in n:
        if c[1] is not None and isinstance(c[2],list):
            print(' '*ind+'LIST',c[1].decode('latin1')); 
            if depth<6: show(c[2],ind+2,depth+1)
        elif c[0]==b'tdmn': print(' '*ind+'tdmn',c[2].split(b'\0')[0].decode('latin1'))
        elif c[0] in (b'cdat',b'tdb4',b'pard'): print(' '*ind+c[0].decode(),len(c[2]),c[2][:48].hex())
        else: print(' '*ind+c[0].decode('latin1'),len(c[2]), c[2][:24].hex())
k=0
def walk(n):
    global k
    for i,c in enumerate(n):
        if c[1]==b'sspc' and isinstance(c[2],list):
            names=[x[2].split(b'\0')[0].decode('latin1') for x in c[2] if x[0]==b'fnam' or x[0]==b'tdmn']
            if any(want in s for s in names) or any(x[0]==b'tdmn' and want.encode() in x[2] for x in c[2]):
                pass
        if c[0]==b'tdmn' and c[2].split(b'\0')[0].decode('latin1')==want and i+1<len(n):
            print('=== instance',k); k+=1; show([n[i+1]])
        if c[1] is not None and isinstance(c[2],list): walk(c[2])
walk(root)
