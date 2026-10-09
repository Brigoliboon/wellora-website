# KITGALLERY_TESTCASE.md

- [ ] G1: Hero center shows 3 kit boxes (stool+urine, blood, saliva) with the centered one bigger than the sides.
- [ ] G2: Clicking a side box centers it with a smooth slide + scale animation (no arrows).
- [ ] G3: Clicking the centered stool+urine box plays its exit, then the 3 contents enter together.
- [ ] G4: Clicking the opened contents packs back to the gallery view.
- [ ] G5: Centered box is bigger; side boxes are smaller but keep full opacity.
- [ ] G6: Layout holds on mobile (3-across, no overflow) and desktop.
- [ ] G7: Title above the gallery shows the centered kit's label and updates on switch.
- [ ] G8: Kit data (boxes + contents) comes from `constants/kits.ts`, not inline in the component.
- [ ] G9: Clickable tracker dots sit between images and title; active dot is elongated, click jumps to that kit.
