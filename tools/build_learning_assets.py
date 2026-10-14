"""Run with Blender --background --python tools/build_learning_assets.py.
Creates original LADO box, door and guard assets with editable animation rigs.
"""
import bpy, math, os
from mathutils import Vector
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'environments/cpp/assets/3d')
os.makedirs(OUT,exist_ok=True)
new_scene=bpy.data.scenes.new('LADO Learning Rigs')
bpy.context.window.scene=new_scene
def material(name,color,metal=0,rough=.4):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 return m
blue=material('Powder coated blue',(.11,.36,.59),.18,.3)
inside=material('Dark interior',(.035,.065,.095),.1,.55)
metal=material('Brushed brass',(.65,.44,.15),.75,.25)
wood=material('Door painted teal',(.07,.23,.29),.1,.38)
frame=material('Door frame',(.22,.32,.37),.35,.3)
uniform=material('Guard navy',(.035,.09,.15),.05,.6)
skin=material('Guard skin',(.66,.4,.23),0,.6)
boots=material('Guard boots',(.016,.024,.034),.08,.35)
white=material('Eye whites',(.83,.86,.88),0,.25)
def empty(name,loc=(0,0,0),parent=None):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=loc;o.parent=parent;o.empty_display_type='PLAIN_AXES';return o
def cube(name,loc,size,mat,parent=None,bevel=.035):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0,0));o=bpy.context.object;o.name=name;o.dimensions=size
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 o.location=loc;o.parent=parent;o.data.materials.append(mat)
 if bevel:
  m=o.modifiers.new('Soft machined edges','BEVEL');m.width=bevel;m.segments=3
  n=o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
 return o
def sphere(name,loc,scale,mat,parent=None):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=10);o=bpy.context.object;o.name=name;o.location=loc;o.scale=scale;o.parent=parent;o.data.materials.append(mat)
 for p in o.data.polygons:p.use_smooth=True
 return o
def keyhinge(control,axis,angle,name):
 control.rotation_mode='XYZ'
 for f,v in [(1,0),(18,angle),(50,angle),(68,0)]:control.rotation_euler[axis]=v;control.keyframe_insert(data_path='rotation_euler',frame=f)
 control.animation_data.action.name=name
 control.rotation_euler[axis]=0
boxroot=empty('Box_Root')
cube('Floor',(0,0,.065),(2,1.5,.13),inside,boxroot)
cube('Front_Wall',(0,-.70,.64),(2,.10,1.15),blue,boxroot)
cube('Back_Wall',(0,.70,.64),(2,.10,1.15),blue,boxroot)
cube('Left_Wall',(-.95,0,.64),(.10,1.32,1.15),blue,boxroot)
cube('Right_Wall',(.95,0,.64),(.10,1.32,1.15),blue,boxroot)
# Four independent walls leave an actual open cavity, 1.8 x 1.3 x 1.08.
for x in [-.67,.67]:cube('Hinge_Barrel',(x,.73,1.20),(.26,.12,.12),metal,boxroot,.04)
hinge=empty('Lid_Hinge',(0,.75,1.22),boxroot)
cube('Lid_Solid',(0,-.75,.025),(2.05,1.55,.10),blue,hinge)
cube('Lid_Inner_Lining',(0,-.75,-.036),(1.83,1.33,.025),inside,hinge,.015)
cube('Latch',(0,-1.50,-.055),(.25,.07,.17),metal,hinge,.02)
keyhinge(hinge,0,-1.95,'Box_Open_Hold_Close')
boxroot['opening_bounds']='x +/-0.9, y +/-0.65, top z=1.22; interior floor z=.13'
boxroot['rig']='Lid_Hinge rotates on local X; 0 closed, -1.95 open'
# Door and frame, with a hinge on the left jamb.
doorroot=empty('Door_Root')
for x in [-.62,.62]:cube('Door_Jamb',(x,0,1.2),(.13,.28,2.4),frame,doorroot)
cube('Door_Lintel',(0,0,2.43),(1.38,.28,.14),frame,doorroot)
doorhinge=empty('Door_Hinge',(-.54,0,.08),doorroot)
cube('Door_Panel',(.54,0,1.10),(1.08,.12,2.20),wood,doorhinge,.028)
for z in [.62,1.62]:cube('Raised_Panel',(.54,-.075,z),(.78,.025,.72),wood,doorhinge,.025)
sphere('Door_Knob',(.96,-.14,1.10),(.055,.055,.055),metal,doorhinge)
keyhinge(doorhinge,2,math.radians(105),'Door_Open_Hold_Close')
# Guard: an editable articulated object rig, with pivots at shoulders and hips.
guardroot=empty('Guard_Root')
hip=empty('Guard_Hips',(0,0,.84),guardroot)
cube('Guard_Torso',(0,0,.35),(.47,.28,.57),uniform,hip,.09)
cube('Guard_Belt',(0,-.005,.08),(.49,.3,.08),boots,hip,.02)
sphere('Guard_Head',(0,0,.82),(.18,.16,.23),skin,hip)
cube('Guard_Cap',(0,0,1.00),(.39,.32,.12),uniform,hip,.055)
cube('Guard_Cap_Visor',(0,-.17,.97),(.37,.16,.035),boots,hip,.025)
cube('Guard_Cap_Badge',(0,-.167,1.01),(.065,.014,.06),metal,hip,.015)
for x in [-.065,.065]:
 sphere('Guard_Eye',(x,-.146,.85),(.029,.018,.025),white,hip)
 sphere('Guard_Pupil',(x,-.160,.85),(.012,.006,.014),boots,hip)
cube('Guard_Badge',(-.115,-.15,.45),(.08,.025,.11),metal,hip,.025)
joints={}
for side,x in [('L',-.15),('R',.15)]:
 joint=empty('Leg_'+side,(x,0,.02),hip);joints['Leg_'+side]=joint
 cube('Guard_Trouser_'+side,(0,0,-.29),(.18,.23,.53),uniform,joint,.045)
 cube('Guard_Boot_'+side,(0,-.06,-.60),(.20,.35,.17),boots,joint,.055)
for side,x in [('L',-.29),('R',.29)]:
 joint=empty('Arm_'+side,(x,0,.56),hip);joints['Arm_'+side]=joint
 cube('Guard_Sleeve_'+side,(0,0,-.13),(.15,.22,.26),uniform,joint,.05)
 elbow=empty('Elbow_'+side,(0,0,-.26),joint)
 cube('Guard_Forearm_'+side,(0,0,-.10),(.13,.18,.20),uniform,elbow,.045)
 sphere('Guard_Hand_'+side,(0,-.01,-.24),(.085,.10,.10),skin,elbow)
for name,joint in joints.items():
 phase=1 if name.endswith('L') else -1
 if name.startswith('Arm'):phase=-phase
 for f,v in [(1,0),(7,.42*phase),(13,0),(19,-.42*phase),(25,0)]:joint.rotation_euler.x=v;joint.keyframe_insert(data_path='rotation_euler',frame=f)
 joint.animation_data.action.name='Guard_Walk_'+name
 for fc in getattr(joint.animation_data.action,'fcurves',[]):
  for k in fc.keyframe_points:k.interpolation='LINEAR'
# Also include a named armature for pose editing and documenting joint locations.
bpy.ops.object.armature_add(location=(0,0,0));arm=bpy.context.object;arm.name='Guard_Pose_Rig';arm.parent=guardroot
bpy.ops.object.mode_set(mode='EDIT');bone=arm.data.edit_bones[0];bone.name='Root';bone.head=(0,0,0);bone.tail=(0,0,.84)
for name,joint in joints.items():
 b=arm.data.edit_bones.new(name);p=Vector(joint.location)+Vector(hip.location);b.head=p;b.tail=p+Vector((0,0,-.35));b.parent=bone
bpy.ops.object.mode_set(mode='OBJECT');arm.show_in_front=True;arm.hide_render=True
# A mesh token is generated at runtime for arbitrary typed text; physical bounds are explicit.
scene=bpy.context.scene;scene.frame_start=1;scene.frame_end=68;scene.render.fps=24;scene.frame_set(1)
roots=[boxroot,doorroot,guardroot]
def children(root):
 return [root]+[descendant for child in root.children for descendant in children(child)]
for root,filename in [(boxroot,'variable-box.glb'),(doorroot,'branch-door.glb'),(guardroot,'branch-guard.glb')]:
 bpy.ops.object.select_all(action='DESELECT')
 for obj in children(root):obj.select_set(True)
 bpy.context.view_layer.objects.active=root
 bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,filename),export_format='GLB',use_selection=True,export_animations=True,export_force_sampling=True,export_apply=True)
# Lay out the editable collection for opening in Blender.
boxroot.location.x=-3;doorroot.location.x=0;guardroot.location.x=3
bpy.ops.object.select_all(action='DESELECT');boxroot.select_set(True);bpy.context.view_layer.objects.active=boxroot
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'learning-rigs.blend'))
print('LADO_ASSETS_READY',OUT)
