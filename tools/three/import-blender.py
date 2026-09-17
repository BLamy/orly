"""Import the gallery's exported frames and save editable Blender snapshots."""
import bpy, pathlib, json
base=pathlib.Path(__file__).resolve().parents[2]/'artifacts'/'three'
checks=[]
for name in ['alex-net','convolution','neural-network','math-primitives']:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(base/(name+'.glb')))
    meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
    assert meshes, 'No imported geometry: '+name
    bpy.ops.wm.save_as_mainfile(filepath=str(base/(name+'.blend')))
    checks.append({'model':name,'meshObjects':len(meshes),'vertices':sum(len(o.data.vertices) for o in meshes)})
(base/'blender-import.json').write_text(json.dumps(checks,indent=2))
print(json.dumps(checks,indent=2))
