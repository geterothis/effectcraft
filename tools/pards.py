import sys,struct
sys.path.insert(0,'/tmp/claude-0/tools')
from aepdump import parse
d=open(sys.argv[1],'rb').read(); root=parse(d,0,len(d)); want=sys.argv[2]
def walk(nodes,ctx):
    for i,c in enumerate(nodes):
        if c[0]==b'tdmn': ctx=c[2].split(b'\0')[0].decode('latin1')
        if c[1]==b'parT' and ctx==want:
            k=0
            for x in c[2]:
                if x[0]==b'pard':
                    b=x[2]; t=struct.unpack('>I',b[12:16])[0]; nm=b[16:48].split(b'\0')[0].decode('latin1')
                    print(k,t,nm,b[48:140].hex()); k+=1
                elif x[0]==b'pdnm': print('   pdnm',x[2][8:].decode('utf8','replace'))
            return True
        if c[1] is not None and isinstance(c[2],list):
            if walk(c[2],ctx): return True
walk(root,'')
