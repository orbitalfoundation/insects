# Run headless per .blend:  blender --background <file>.blend --python bl_dump.py -- <outdir> <name>
# Dumps the armature bone hierarchy (name/parent/rest head+tail) to <name>.rig.json and exports
# a clean rigged glb to <name>.glb — the interchange the pack's FBX/DAE lacked.
import bpy, json, os, sys

argv = sys.argv[sys.argv.index('--') + 1:]
outdir, name = argv[0], argv[1]
os.makedirs(outdir, exist_ok=True)

arm = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
rig = {'armature': None, 'bones': []}
if arm:
    rig['armature'] = arm.name
    for b in arm.data.bones:
        rig['bones'].append({
            'name': b.name,
            'parent': b.parent.name if b.parent else None,
            'head': [round(x, 5) for x in b.head_local],
            'tail': [round(x, 5) for x in b.tail_local],
        })
# also note mesh objects + whether they're skinned to the armature
rig['meshes'] = []
for o in bpy.data.objects:
    if o.type == 'MESH':
        skinned = any(m.type == 'ARMATURE' for m in o.modifiers)
        rig['meshes'].append({'name': o.name, 'verts': len(o.data.vertices),
                              'vgroups': len(o.vertex_groups), 'skinned': skinned})

json.dump(rig, open(os.path.join(outdir, name + '.rig.json'), 'w'), indent=1)

try:
    bpy.ops.export_scene.gltf(filepath=os.path.join(outdir, name + '.glb'),
                              export_format='GLB', export_yup=True,
                              export_materials='NONE', export_animations=False)
    ok = 'glb-ok'
except Exception as e:
    ok = 'glb-FAIL: ' + str(e)[:60]
print(f"DUMPED {name}: armature={rig['armature']} bones={len(rig['bones'])} meshes={len(rig['meshes'])} {ok}")
