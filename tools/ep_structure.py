"""Anonymised Essential Properties structure of an .aep: no names, texts or values.
Usage: python ep_structure.py project.aep > out.txt
Prints, per composition: its item id, its layers' ids and types, each control's CTyp / CCId /
CLId / JSON path (After Effects match names and indices only), and for each precomp layer with
overrides: the OvG2 count and the chunk sequence of its override group (match names, chunk types,
tdsb). Each override group also lists, for every OvG2 UUID, the number of the source composition's
control with that UUID (0: none), and whether the precomp layer's source has controls at all."""
import struct, sys, json

def parse(b, off, end):
    out = []
    while off + 8 <= end:
        cid = b[off:off+4]; size = struct.unpack('>I', b[off+4:off+8])[0]; body = off + 8
        if cid == b'LIST':
            lt = b[body:body+4]
            out.append((cid, lt, parse(b, body+4, body+size) if lt != b'btdk' else None, b''))
        else:
            out.append((cid, None, None, b[body:body+size]))
        off = body + size + (size & 1)
    return out

def be32(d): return struct.unpack('>I', d[:4])[0] if len(d) >= 4 else None
def cstr(d): return d.split(b'\0')[0].decode('latin1')

def kids(n): return n[2] or []
def child(n, cid): return next((k for k in kids(n) if k[0] == cid), None)
def child_list(n, lt): return next((k for k in kids(n) if k[0] == b'LIST' and k[1] == lt), None)

def layer_info(l):
    ld = child(l, b'ldta'); d = ld[3] if ld else b''
    return {'id': be32(d), 'source_id': be32(d[40:44]) if len(d) >= 44 else None}

def controls(item):
    best = None
    for lt in (b'CIF3', b'CIF2', b'CIFO'):
        c = child_list(item, lt)
        if c and (best is None or len([k for k in kids(c) if k[1] == b'CCtl']) > len([k for k in kids(best) if k[1] == b'CCtl'])):
            best = c
    out = []
    if not best: return out
    for i, c in enumerate(k for k in kids(best) if k[1] == b'CCtl'):
        uu = child(c, b'Utf8')
        e = {'n': i + 1, 'uuid': cstr(uu[3]) if uu else None, 'CTyp': be32(child(c, b'CTyp')[3]) if child(c, b'CTyp') else None, 'chunks': [k[1].decode('latin1') if k[1] else k[0].decode('latin1') for k in kids(c)], 'props': []}
        for p in (k for k in kids(c) if k[1] == b'CPrp'):
            cc = child(p, b'CCId'); cl = child(p, b'CLId'); u = child(p, b'Utf8')
            path = None
            if u:
                try:
                    j = json.loads(u[3].decode('utf8'))
                    path = [(j[str(s)].get('matchName'), j[str(s)].get('index')) for s in range(len(j))]
                except Exception as ex:
                    path = 'unreadable: %s' % ex
            e['props'].append({'CCId': be32(cc[3]) if cc else None, 'CLId': be32(cl[3]) if cl else None, 'path': path})
        out.append(e)
    return out

def overrides(l):
    root = child_list(l, b'tdgp')
    if not root: return None
    ks = kids(root)
    for i, k in enumerate(ks):
        if k[0] == b'tdmn' and cstr(k[3]) == 'ADBE Layer Overrides':
            rest = ks[i+1:]
            ov = next((r for r in rest[:3] if r[1] == b'OvG2'), None)
            grp = next((r for r in rest[:3] if r[1] == b'tdgp'), None)
            if not ov or not grp: return None
            cps = [r for r in kids(ov) if r[1] == b'CPrp']
            n = len(cps)
            if n == 0: return None
            src = UUIDS.get(layer_info(l)['source_id'], [])
            order = []
            for r in cps:
                u = next((cstr(k[3]) for k in kids(r) if k[0] == b'Utf8'), None)
                order.append(src.index(u) + 1 if u in src else 0)
            seq = []
            for r in kids(grp):
                if r[0] == b'tdmn': seq.append('tdmn ' + cstr(r[3]))
                elif r[0] == b'LIST':
                    sb = child(r, b'tdsb') or (child(child_list(r, b'tdbs'), b'tdsb') if child_list(r, b'tdbs') else None)
                    seq.append('LIST %s%s' % (r[1].decode('latin1'), (' tdsb=%d' % be32(sb[3])) if sb else ''))
                else: seq.append(r[0].decode('latin1'))
            return {'OvG2_controls': n, 'OvG2_to_control_n': order, 'source_controls': len(src), 'entries': len([x for x in seq if x.startswith('tdmn ') and x != 'tdmn ADBE Group End']), 'group': seq}
    return None

b = open(sys.argv[1], 'rb').read()
top = parse(b, 12, 8 + struct.unpack('>I', b[4:8])[0])
UUIDS = {}
def collect(nodes):
    for n in nodes:
        if n[0] != b'LIST': continue
        if n[1] == b'Item':
            idta = child(n, b'idta')
            if idta: UUIDS[be32(idta[3][16:20])] = [c['uuid'] for c in controls(n)]
        collect(kids(n))
collect(top)
def walk(nodes):
    for n in nodes:
        if n[0] != b'LIST': continue
        if n[1] == b'Item':
            idta = child(n, b'idta')
            layers = [k for k in kids(n) if k[1] == b'Layr']
            if layers:
                iid = be32(idta[3][16:20]) if idta else None
                print('== comp item id', iid, 'layers', [layer_info(l) for l in layers])
                for c in controls(n):
                    c.pop('uuid', None); print('   control', json.dumps(c))
                for l in layers:
                    o = overrides(l)
                    if o: print('   layer', layer_info(l)['id'], 'overrides', json.dumps(o))
        walk(kids(n))
walk(top)
