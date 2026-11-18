import sys, struct
def parse(d, a, b):
    out=[]
    while a+8<=b:
        cid=d[a:a+4]; n=struct.unpack('>I',d[a+4:a+8])[0]; s=a+8; e=min(s+n,b)
        if cid in (b'LIST',b'RIFX'):
            t=d[s:s+4]
            if t==b'btdk': out.append((cid,t,d[s+4:e]))
            else: out.append((cid,t,parse(d,s+4,e)))
        else: out.append((cid,None,d[s:e]))
        a=e+(n&1)
    return out
def name(c): return c[2].split(b'\0')[0].decode('latin1')
def show(nodes, ind=0, want=None, lim=96):
    for c in nodes:
        if c[1] is not None and isinstance(c[2],list):
            print(' '*ind+f"LIST {c[1].decode('latin1')}"); show(c[2],ind+2,want,lim)
        else:
            if c[0]==b'tdmn': print(' '*ind+'tdmn '+name(c))
            else: print(' '*ind+f"{c[0].decode('latin1')} {len(c[2])} {c[2][:lim].hex()}")
def find_after(nodes, mn):
    res=[]
    for i,c in enumerate(nodes):
        if c[0]==b'tdmn' and name(c)==mn and i+1<len(nodes): res.append(nodes[i+1])
        if c[1] is not None and isinstance(c[2],list): res+=find_after(c[2],mn)
    return res
if __name__=='__main__':
    d=open(sys.argv[1],'rb').read(); root=parse(d,0,len(d))
    for i,n in enumerate(find_after(root, sys.argv[2])):
        print('==',i); show([n], 0, lim=int(sys.argv[3]) if len(sys.argv)>3 else 96)
