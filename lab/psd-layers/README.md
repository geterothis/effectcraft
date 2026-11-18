# Lab job: one layer of a Photoshop file (AE sample)

ONE headless After Effects 2026 instance, sequential, light load.

The EffectCraft .aep exporter drops footage that shows one layer of a layered PSD ("one layer of a
layered file is not exported"); FM_v_245 has two such items. `layers_200x100.psd` is generated here
(3 layers: "Background fill" 200x100, "Blue box" at left 20 top 10 60x50, "Green bar" at left 100
top 40 90x15; written from the public PSD spec, opens in Pillow).

Please run `psd_layers.jsx` in a new empty project with the PSD next to it. It imports the PSD as
merged footage, as a composition with cropped layers and as a composition with document-size
layers, then saves `psd_layers.aep` and `psd_layers.json` next to the script. If an import mode
opens a dialog or fails, note it in the JSON (the script catches errors) and keep the rest.
Commit both files here on test-corpus.
