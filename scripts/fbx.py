# Minimal binary-FBX reader — no Blender, no SDK. Parses the FBX node tree and extracts the
# skeleton (LimbNode bones: names, hierarchy, local transforms). The seed of an FBX→our-format
# converter; for now it answers "what's the rig and how consistent is it across the pack".
import struct, zlib, sys

def parse(path):
    d = open(path, 'rb').read()
    if not d.startswith(b'Kaydara FBX Binary'):
        raise ValueError('not a binary FBX')
    version = struct.unpack('<I', d[23:27])[0]
    is64 = version >= 7500
    HDR = 24 if is64 else 12
    NULLREC = 25 if is64 else 13

    def read_prop(p):
        t = chr(d[p]); p += 1
        if t == 'Y': return p + 2, struct.unpack('<h', d[p:p+2])[0]
        if t == 'C': return p + 1, bool(d[p])
        if t == 'I': return p + 4, struct.unpack('<i', d[p:p+4])[0]
        if t == 'F': return p + 4, struct.unpack('<f', d[p:p+4])[0]
        if t == 'D': return p + 8, struct.unpack('<d', d[p:p+8])[0]
        if t == 'L': return p + 8, struct.unpack('<q', d[p:p+8])[0]
        if t in ('S', 'R'):
            ln = struct.unpack('<I', d[p:p+4])[0]; p += 4
            v = d[p:p+ln]; p += ln
            return p, (v.decode('utf-8', 'replace') if t == 'S' else v)
        if t in 'fdlib':
            length, enc, clen = struct.unpack('<III', d[p:p+12]); p += 12
            raw = d[p:p+clen]; p += clen
            if enc == 1: raw = zlib.decompress(raw)
            fmt = {'f': 'f', 'd': 'd', 'l': 'q', 'i': 'i', 'b': 'b'}[t]
            return p, list(struct.unpack('<%d%s' % (length, fmt), raw))
        raise ValueError('bad prop type %r at %d' % (t, p - 1))

    def read_node(p):
        if is64:
            end, nprops, _ = struct.unpack('<QQQ', d[p:p+24])
        else:
            end, nprops, _ = struct.unpack('<III', d[p:p+12])
        p += HDR
        namelen = d[p]; p += 1
        name = d[p:p+namelen].decode('utf-8', 'replace'); p += namelen
        if end == 0:
            return None, p
        props = []
        for _ in range(nprops):
            p, v = read_prop(p)
            props.append(v)
        children = []
        while p < end - NULLREC + 1 and p < end:
            if d[p:p+NULLREC] == b'\x00' * NULLREC:
                p += NULLREC; break
            child, p = read_node(p)
            if child: children.append(child)
        return {'name': name, 'props': props, 'children': children}, end

    # top-level records
    p = 27; roots = []
    while p < len(d) - NULLREC:
        node, np = read_node(p)
        if node is None: break
        roots.append(node); p = np
    return {'version': version, 'roots': roots}

def skeleton(path):
    fbx = parse(path)
    objects = next((r for r in fbx['roots'] if r['name'] == 'Objects'), None)
    conns = next((r for r in fbx['roots'] if r['name'] == 'Connections'), None)
    bones = {}   # id -> {name, type}
    for o in (objects['children'] if objects else []):
        if o['name'] == 'Model' and len(o['props']) >= 3:
            oid, nm, sub = o['props'][0], o['props'][1], o['props'][2]
            name = nm.split('::')[-1] if isinstance(nm, str) else str(nm)
            if sub in ('LimbNode', 'Limb', 'Root', 'Null'):
                bones[oid] = {'name': name, 'type': sub}
    parent = {}
    for c in (conns['children'] if conns else []):
        if c['name'] == 'C' and len(c['props']) >= 3 and c['props'][0] == 'OO':
            child, par = c['props'][1], c['props'][2]
            if child in bones: parent[child] = par
    return bones, parent

def geometry(path):
    """All meshes in an FBX → (positions[flat x,y,z], triangle indices). Fan-triangulated."""
    fbx = parse(path)
    objects = next((r for r in fbx['roots'] if r['name'] == 'Objects'), None)
    verts, tris = [], []
    for geo in [c for c in objects['children'] if c['name'] == 'Geometry']:
        vnode = next((c for c in geo['children'] if c['name'] == 'Vertices'), None)
        inode = next((c for c in geo['children'] if c['name'] == 'PolygonVertexIndex'), None)
        if not vnode or not inode: continue
        base = len(verts) // 3
        verts.extend(float(x) for x in vnode['props'][0])
        poly = []
        for i in inode['props'][0]:
            if i < 0:
                poly.append(~i)
                for k in range(1, len(poly) - 1):
                    tris.extend([base + poly[0], base + poly[k], base + poly[k + 1]])
                poly = []
            else:
                poly.append(i)
    return verts, tris

def write_glb(verts, tris, out):
    import json
    vb = struct.pack('<%df' % len(verts), *verts)
    ib = struct.pack('<%dI' % len(tris), *tris)
    while len(vb) % 4: vb += b'\x00'
    xs, ys, zs = verts[0::3], verts[1::3], verts[2::3]
    gltf = {
        'asset': {'version': '2.0'},
        'buffers': [{'byteLength': len(vb) + len(ib)}],
        'bufferViews': [
            {'buffer': 0, 'byteOffset': 0, 'byteLength': len(vb), 'target': 34962},
            {'buffer': 0, 'byteOffset': len(vb), 'byteLength': len(ib), 'target': 34963}],
        'accessors': [
            {'bufferView': 0, 'componentType': 5126, 'count': len(verts) // 3, 'type': 'VEC3',
             'min': [min(xs), min(ys), min(zs)], 'max': [max(xs), max(ys), max(zs)]},
            {'bufferView': 1, 'componentType': 5125, 'count': len(tris), 'type': 'SCALAR'}],
        'meshes': [{'primitives': [{'attributes': {'POSITION': 0}, 'indices': 1}]}],
        'nodes': [{'mesh': 0}], 'scenes': [{'nodes': [0]}], 'scene': 0,
    }
    jb = json.dumps(gltf).encode('utf-8')
    while len(jb) % 4: jb += b' '
    bin_ = vb + ib
    glb = b'glTF' + struct.pack('<II', 2, 12 + 8 + len(jb) + 8 + len(bin_))
    glb += struct.pack('<I', len(jb)) + b'JSON' + jb
    glb += struct.pack('<I', len(bin_)) + b'BIN\x00' + bin_
    open(out, 'wb').write(glb)

if __name__ == '__main__':
    if len(sys.argv) >= 4 and sys.argv[1] == 'convert':
        v, t = geometry(sys.argv[2]); write_glb(v, t, sys.argv[3])
        print(f"  {sys.argv[3]}: {len(v)//3} verts, {len(t)//3} tris")
    else:
        bones, parent = skeleton(sys.argv[1])
        print('bones:', len(bones))
        for bid, b in list(bones.items())[:40]:
            print(f"  {b['type']:<9} {b['name']}")
