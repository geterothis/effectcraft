# Preserve Underlying Transparency lab (AE 26.5, aerender frame 0, PNG RGB+alpha)

Comp preserve_transparency 640x360. Bottom: BG solid, full frame, Opacity 30 % (deviation from the request: a 100 % opaque full-frame BG would make every underlying pixel opaque, so Preserve Transparency would have no visible effect). Above it, per column, a white ellipse under_<name> at 60 % opacity, then the test layer: pt_solid, pt_shape, pt_text, pt_precomp (precomp pt_precomp_src), pt_3d (3D solid, Y rotation 20) with Preserve Underlying Transparency ON, and off_solid with it OFF.
