# Learning animation rigs

Open `learning-rigs.blend` and select the **LADO Learning Rigs** scene.

- `Box_Root`: hollow box with a separate floor and four walls. `Lid_Hinge` pivots at the rear edge.
- `Guard_Root`: articulated hips, legs, shoulders and elbows. Runtime hand IK follows the actual `Door_Knob` mesh while the door swings.
- `Door_Root`: frame, panel and handle; `Door_Hinge` opens the panel independently of the frame.

The GLB files are the exported runtime assets. `tools/build_learning_assets.py` rebuilds the editable scene and exports them from Blender. Three.js is vendored under `environments/cpp/vendor/three` with its MIT license.

Number tiles are generated dynamically for typed values. Each is a solid 3D tile: it travels above the opening, descends into the cavity, and remains inside. The walls occlude it; the lid closes after landing. The external `stored:` label reads the box's value.
