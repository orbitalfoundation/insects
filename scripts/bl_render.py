# Headless preview render of a geometry glb (no GPU): Workbench solid shading, auto-framed 3/4 view.
#   blender --background --python bl_render.py -- <in.glb> <out.png> [az_deg] [el_deg]
import bpy, sys, math
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
inp, out = argv[0], argv[1]
az = math.radians(float(argv[2]) if len(argv) > 2 else 45.0)
el = math.radians(float(argv[3]) if len(argv) > 3 else 20.0)

# clean slate
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=inp)

meshes = [o for o in bpy.data.objects if o.type == 'MESH']
# world-space bbox
lo = Vector((1e9, 1e9, 1e9)); hi = -lo.copy()
for o in meshes:
    for c in o.bound_box:
        w = o.matrix_world @ Vector(c)
        lo = Vector((min(lo[i], w[i]) for i in range(3)))
        hi = Vector((max(hi[i], w[i]) for i in range(3)))
center = (lo + hi) * 0.5
radius = max((hi - lo).length * 0.5, 1e-4)

# camera orbiting the center
cam_data = bpy.data.cameras.new('Cam'); cam = bpy.data.objects.new('Cam', cam_data)
bpy.context.scene.collection.objects.link(cam)
dist = radius * 3.0
dirv = Vector((math.cos(el) * math.cos(az), math.cos(el) * math.sin(az), math.sin(el)))
cam.location = center + dirv * dist
# aim at center
look = (center - cam.location).normalized()
cam.rotation_euler = look.to_track_quat('-Z', 'Y').to_euler()
cam_data.lens = 60
cam_data.clip_start = dist * 0.01   # scale-relative so tiny models aren't near-clipped
cam_data.clip_end = dist * 100
bpy.context.scene.camera = cam

# workbench: solid shading, no GPU, single matcap-ish light
scene = bpy.context.scene
scene.render.engine = 'BLENDER_WORKBENCH'
shading = scene.display.shading
shading.light = 'STUDIO'
shading.color_type = 'SINGLE'
shading.single_color = (0.75, 0.72, 0.68)
shading.show_cavity = True
shading.cavity_type = 'BOTH'
scene.display.render_aa = 'FXAA'
scene.render.film_transparent = False
scene.world = bpy.data.worlds.new('W') if not scene.world else scene.world
scene.world.color = (0.12, 0.12, 0.14)
scene.render.resolution_x = 640
scene.render.resolution_y = 640
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = out
bpy.ops.render.render(write_still=True)
print(f"RENDERED {out}")
