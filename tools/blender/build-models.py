"""Blender-authored review models. Run: blender -b -t 2 --python tools/blender/build-models.py
Source dimensions and computed examples come from the existing ten Storybook scenes.
Models are explanatory cutaways, not fabrication plans or measured robot rollouts.
"""
import bpy, math, json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
DATA=json.loads((ROOT/'tools/blender/scene-data.json').read_text())
OUT=ROOT/'apps/bookshelf/src/viz/blender/assets'
BLEND=ROOT/'artifacts/blender'
OUT.mkdir(parents=True,exist_ok=True); BLEND.mkdir(parents=True,exist_ok=True)

def mat(name,color,alpha=1,metal=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,alpha);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,alpha);bs.inputs['Roughness'].default_value=.55;bs.inputs['Metallic'].default_value=metal;bs.inputs['Alpha'].default_value=alpha
 if alpha<1:m.surface_render_method='DITHERED'
 return m

def reset():
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 for m in list(bpy.data.materials):bpy.data.materials.remove(m)
 global wood,lightwood,cyan,purple,gold,green,red,steel,glass,dark
 wood=mat('Cedar',(.43,.20,.08));lightwood=mat('End grain',(.7,.42,.19));cyan=mat('Cyan',(.03,.65,.95));purple=mat('Violet',(.51,.30,.9));gold=mat('Amber',(.98,.57,.08));green=mat('Mint',(.04,.8,.49));red=mat('Coral',(.95,.12,.22));steel=mat('Steel',(.40,.48,.59),metal=.7);glass=mat('Cutaway',(.22,.6,.8),.18);dark=mat('Frame',(.035,.055,.10))

def group(name,loc=(0,0,0),motion=None):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=loc
 if motion:o['motion']=json.dumps(motion)
 return o

def finish(o,name,m,parent=None):
 o.name=name;o.data.materials.append(m)
 if parent:o.parent=parent
 return o

def box(name,loc,size,m,parent=None,bevel=.025):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=size
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  mod=o.modifiers.new('Soft manufactured edges','BEVEL');mod.width=min(bevel,min(size)/5);mod.segments=2
  bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
 return finish(o,name,m,parent)

def ball(name,p,r,m,parent=None):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,radius=r,location=p);o=finish(bpy.context.object,name,m,parent)
 for f in o.data.polygons:f.use_smooth=True
 return o

def rod(name,a,b,r,m,parent=None):
 a,b=Vector(a),Vector(b);d=b-a
 bpy.ops.mesh.primitive_cylinder_add(vertices=10,radius=r,depth=d.length,location=(a+b)/2)
 o=bpy.context.object;o.rotation_euler=d.to_track_quat('Z','Y').to_euler();return finish(o,name,m,parent)

def mesh(name,verts,faces,m,parent=None):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);return finish(o,name,m,parent)

def motion(key,kind='slide',**kw):return dict(key=key,kind=kind,**kw)
def save(name):
 bpy.ops.wm.save_as_mainfile(filepath=str(BLEND/f'{name}.blend'))
 bpy.ops.export_scene.gltf(filepath=str(OUT/f'{name}.glb'),export_format='GLB',export_extras=True,export_animations=False)
 print('BUILT',name)

def shed():
 reset();box('Floor',(0,0,0),(8,8,.25),lightwood)
 # Wall pivots at their bottom edges; source scene uses 8 ft sides, 7 ft eaves.
 for name,loc,rot,key in [('Back',(0,-4,.13),0,'backA'),('Left',(-4,0,.13),math.pi/2,'sideA'),('Right',(4,0,.13),-math.pi/2,'sideA'),('Front',(0,4,.13),math.pi,'frontA')]:
  orient=group(name+' orientation',loc);orient.rotation_euler.z=rot
  g=group(name+' hinge',motion=motion(key,'hinge',axis='x',start=math.pi/2,end=0));g.parent=orient
  for z in [.1,6.9]:box(name+' plate',(0,0,z),(8,.29,.15),wood,g)
  for i,x in enumerate([-3.9,-2,0,2,3.9]):
   if name=='Front' and x==2:continue
   box(name+' stud '+str(i),(x,0,3.5),(.13,.29,6.7),lightwood,g)
  # Open front exposes framing; other walls retain ghosted sheathing.
  if name!='Front':box(name+' sheathing',(0,.18,3.5),(8,.05,7),glass,g)
  else:
   box('Door header',(2,0,6.1),(2.6,.29,.25),wood,g)
   for x in [.7,3.3]:box('Door jamb',(x,0,3),(.13,.29,6),lightwood,g)
 for i,y in enumerate([-4,-2,0,2,4]):
  g=group('Truss '+str(i),motion=motion('trussU',index=i,count=5,distance=3))
  for a,b in [((-4,y,7),(0,y,8.657)),((0,y,8.657),(4,y,7)),((-4,y,7),(4,y,7))]:rod('Truss beam',a,b,.09,wood,g)
 for side in [-1,1]:
  g=group('Roof '+str(side),motion=motion('sheathU',distance=3))
  mesh('Roof cutaway',[(0,-4.3,8.72),(side*4.3,-4.3,6.94),(side*4.3,4.3,6.94),(0,4.3,8.72)],[(0,1,2,3)],steel,g)
 save('shed')

def bench():
 reset()
 # A spatial version of the existing course diagram; original course sequence retained.
 courses=[[(0,0,0,4,.35),(-1.8,0,-.85,.35,1.7),(1.8,0,-.85,.35,1.7)],[(0,0,0,.35,.35)],[(0,0,0,4,.35)],[(-1.8,0,-.6,.35,1.2)],[(0,0,0,.35,.35)],[(0,0,0,4,.35)],[(1.8,0,-.6,.35,1.2)],[(0,0,0,4,.35)]]
 for i,parts in enumerate(courses):
  g=group('Course '+str(i),motion=motion('layerU',index=i,count=1,distance=1.4))
  for j,(x,y,z,w,h) in enumerate(parts):box('Course timber '+str(j),(x,i*.14-.5,z+1.6),(w,.125,h),lightwood if i%2 else wood,g,.012)
 save('bench')

def table():
 reset()
 # Enlarged button/apron detail, matching the source's fastening explanation.
 box('Apron',(0,0,.5),(4,.32,1.3),wood)
 # Actual slot geometry uses two rails instead of painting a slot on solid stock.
 bpy.data.objects.remove(bpy.data.objects['Apron'],do_unlink=True)
 box('Apron lower',(0,0,.28),(4,.32,.86),wood)
 box('Apron upper',(0,0,1.02),(4,.32,.25),wood)
 g=group('Button and top',motion=motion('moveU','translate',axis='x',amount=.38))
 top=group('Top',motion=motion('buttonU',distance=.8));top.parent=g
 box('Top cutaway',(0,-.25,1.4),(4.6,2.3,.25),glass,top)
 button=group('Rabbeted button',(0,-.55,.93),motion=motion('buttonU',distance=.6));button.parent=g
 box('Button body',(0,0,0),(.6,.8,.32),lightwood,button)
 box('Tongue',(0,.45,-.08),(.6,.3,.16),gold,button)
 rod('Screw',(0,-.65,.79),(0,-.65,1.43),.045,steel,g)
 save('table')

def bar():
 reset()
 # Geometry follows the existing top footprint: 47 + 5 + 5 + 4 + 4 = 65 inches.
 s=.1
 for x in [-2.35,0,2.35]:box('Front stringer',(x,0,2),( .25,.5,4),wood)
 for z in [.4,1.25,2.1,2.95,3.8]:box('Front slat',(0,-.28,z),(4.7,.10,.6),lightwood)
 for x in [-2.6,2.6]:
  for y in [.15,2.1]:box('Wing stringer',(x,y,2),(.5,.2,4),wood)
  for z in [.4,1.25,2.1,2.95,3.8]:box('Wing slat',(x,1.1,z),(.12,2.4,.6),lightwood)
 box('Transparent shelf',(0,-.175,4.15),(6.5,1.75,.18),glass)
 for x in [-2.6,2.6]:box('Wing top',(x,1.4,4.15),(.95,1.75,.18),glass)
 for x,m,key in [(0,green,'goodU'),(1.15,red,'badU')]:
  g=group('Screw '+key,motion=motion(key,distance=.8));rod('Fastener',(x,0,4.45),(x,0,3.5),.035,m,g);ball('Target',(x,0,3.55),.10,m,g)
 save('bar')

def gripper(name,loc,m,parent=None):
 g=group(name,loc);g.parent=parent
 box('Palm',(0,0,0),(.48,.36,.20),m,g)
 for x in [-.2,.2]:box('Finger',(x,.24,-.16),(.09,.46,.15),steel,g)
 box('Fiducial',(0,-.10,.26),(.25,.25,.25),lightwood,g)
 for x in [-.08,.08]:box('Marker',(x,-.231,.26),(.06,.006,.06),dark,g,0)
 return g

def hifi():
 reset();box('Head camera rig',(0,0,2.9),(1,.4,.28),dark)
 for x in [-.32,.32]:ball('Lens',(x,.26,2.9),.13,cyan)
 for name,p,m in [('Left',(-1.35,1.25,.6),purple),('Right',(1.35,1.25,.8),gold)]:
  gripper(name+' gripper',p,m)
  rod(name+' observation',(0,.3,2.9),(p[0],p[1],p[2]+.26),.016,m)
  for axis,delta,c in [('x',(.65,0,0),red),('y',(0,.65,0),green),('z',(0,0,.65),cyan)]:rod(name+axis,p,tuple(p[i]+delta[i] for i in range(3)),.018,c)
 rod('Relative transform',(-1.35,1.25,.6),(1.35,1.25,.8),.025,green)
 for x in [-2.4,2.4]:rod('View boundary',(0,.25,2.9),(x,2.1,0),.01,cyan)
 save('hifi')

def turbo():
 reset();positions=[]
 for i in range(12):
  # Same sinusoidal illustrative action values as the source. Positions are schematic, not robot kinematics.
  p=(-2.8+i*.51,math.sin((i+1)*.48)*.8,.8+math.sin((i+1)*.48+.9)*.5);positions.append(p)
  g=group('Pose '+str(i),motion=motion('vectorU',index=i,count=12,distance=.6));gripper('Gripper '+str(i),p,purple if i%2 else cyan,g)
  if i:rod('Path '+str(i),positions[i-1],p,.022,green)
 save('turbo')

def loss():
 reset();d=DATA['loss'];verts=[(b,a,z*.75) for b,a,z in d['vertices']];n=d['n'];faces=[]
 for j in range(n-1):
  for i in range(n-1):k=j*n+i;faces.append((k,k+1,k+n+1,k+n))
 o=mesh('Computed loss surface',verts,faces,cyan)
 # Face bands communicate elevation without baking light into the geometry.
 for i in range(15):o.data.materials.append(mat('Loss band '+str(i),(.04+i*.022,.30+i*.025,.60+i*.018)))
 for face in o.data.polygons:
  z=sum(verts[v][2] for v in face.vertices)/len(face.vertices);face.material_index=1+min(14,int(z*3))
 for lm,m in zip(d['landmarks'],[green,green,gold,purple]):
  b,a,z=lm['p'];ball(lm['name'],(b,a,z*.75+.06),.105,m)
 rod('Frequency axis',(-5.3,-2.8,0),(5.3,-2.8,0),.022,steel)
 rod('Amplitude axis',(-5.3,-2.8,0),(-5.3,2.8,0),.022,steel)
 save('loss')

def svm():
 reset()
 mesh('Separating plane',[(-1.6,-1.6,0),(1.6,-1.6,0),(1.6,1.6,0),(-1.6,1.6,0)],[(0,1,2,3)],glass)
 for i,p in enumerate(DATA['svm']['points']):
  # The xy coordinate is one term of the quadratic feature map, not the full six-dimensional map.
  g=group('Lifted point '+str(i),(p['x'],p['y'],0),motion=motion('liftU','translate',axis='y',amount=p['x']*p['y']))
  ball('XOR point',(0,0,0),.15,gold if p['c']==1 else cyan,g)
  rod('Projection '+str(i),(p['x'],p['y'],0),(p['x'],p['y'],p['x']*p['y']),.012,steel)
 rod('x axis',(-1.8,0,0),(1.8,0,0),.02,steel);rod('y axis',(0,-1.8,0),(0,1.8,0),.02,steel);rod('xy axis',(0,0,-1.5),(0,0,1.5),.02,purple)
 save('svm')

def hnsw():
 reset();d=DATA['hnsw'];cols=[cyan,purple,gold]
 def pos(i,L):p=d['points'][i];return ((p['x']-640)/150,(p['y']-340)/150,L*1.5)
 for L,ids in enumerate(d['layers']):
  for i in ids:
   ball(f'Node {L} {i}',pos(i,L),.065,cols[L])
   for j in d['neighbors'][L][str(i)]:
    if j>i:rod('Neighbor edge',pos(i,L),pos(j,L),.008,cols[L])
 for i,(a,b) in enumerate(zip(d['search']['path'],d['search']['path'][1:])):
  g=group('Search hop '+str(i),motion=motion('hopU',index=i,count=1,distance=0))
  rod('Search trace',pos(a['node'],a['layer']),pos(b['node'],b['layer']),.035,green,g)
 save('hnsw')

def vision():
 reset();d=DATA['vision'];cols=[cyan,green,gold]
 for j,row in enumerate(d['image']):
  for i,v in enumerate(row):box('Input pixel',(i*.24-1.32,j*.24-1.32,0),(.22,.22,.05),mat('Pixel',(.05+v*.75,)*3),bevel=0)
 for L,arr in enumerate(d['maps']):
  g=group('Feature map '+str(L),motion=motion('k'+str(L)+'U',distance=.8))
  for j,row in enumerate(arr):
   for i,v in enumerate(row):
    if v>.04:box('Activation',(i*.24-1.08,j*.24-1.08,1+L*.9),(.21,.21,.06+v*.16),cols[L],g,0)
 save('vision')

for fn in [shed,hifi,bench,loss,table,bar,svm,turbo,hnsw,vision]:fn()
