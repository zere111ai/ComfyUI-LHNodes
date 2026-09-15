# MiniMax H3 Director Timeline v3

`MiniMax H3 Director Timeline v3` combines a real Ref2VA media timeline with the v2 shot/directing compiler. It delegates conditioning to ComfyUI's built-in `MiniMaxH3ReferenceToVideo` implementation instead of duplicating model logic.

## Connect it

Direct mode:

1. Upload media in **Source Media**.
2. Connect the H3 `CLIP`, video `VAE`, and audio `VAE` to the Director.
3. Use its `positive` and `latent` outputs for sampling.

Compiler-only mode remains compatible: leave those three model inputs empty and route `compiled_prompt` and `length` to the official H3 node.

Prompt tags are 1-based, but ComfyUI autogrow socket names are 0-based:

- `<Picture 1>` uses `ref_image_0`.
- `<Video 1>` uses `ref_video_0`.
- A soundtrack paired with Video 1 uses `ref_video_audio_0`.
- The first standalone audio uses `ref_audio_0`.

## Director surfaces

- **Simple / Director**: switches between a compact prompt-builder and the full directing workspace without creating a second node or a second data format. Both modes edit the same plan, so a simple draft can be refined later in Director mode.
- **Simple mode**: keeps Source Media, Basic Setup, Characters and Subjects, and sequential Shot cards on one page. It covers story/format, scene, visual style, reusable subject definitions, action/performance, optional camera/sound/transition direction, and external per-Shot overrides.
- **Narration helper**: writes a structured off-screen narration event for the Shot. Its source may be a referenced visual character, a voice/audio reference, or a custom extra narrator. Language, exact words, and optional start/end times remain editable; the compiler assigns stable `Sx` IDs, applies an audio-reference voice when selected, and keeps visible subjects' lips closed during narration.
- **Source Media**: actual uploads, enlarged card previews, full-size image/video/audio playback, audio waveform, and independent source crop. Video supports picture only (`V`), embedded audio only (`A`), or both (`V+A`), with optional replacement soundtrack.
- **Timeline**: Shot blocks are draggable, resizable, non-overlapping, and reorderable. A reference mentioned by the current Shot's effective `@alias` appears as a locked per-Shot block; a manually dragged reference remains a planning aid until an effective prompt field mentions its alias. These ranges are prompt direction, not source crop or hard masks.
- **References**: authoritative prompt-tag and cable order. Visual references have their own relationship and retention controls. Audio assets separately choose signal reuse versus feature reference, one or more audio roles, an audio retention marker, and an optional target-speaker binding.
- **Director settings in each Shot**: the former Global Direction editor now fills the lower-right Shot inspector area. The earliest Shot is the Shot 1 master; later Shots inherit it unless switched to a custom override.
- **R2V Guide**: local usage notes and the recommended graph wiring.
- **中 / EN**: switches the Director interface language and saves the choice in the workflow. The panel expands to its active tab instead of using an internal scrollbar.

Shot blocks can specify framing, lens, camera, composition, subjects, a unified action/performance/dialogue description, an optional structured narration event, ambience, music, SFX, transition, and continuity handoff. Only references mentioned by an effective `@alias` are sent to H3; unused uploaded assets remain available in the Director but are excluded from conditioning.

On-screen dialogue belongs directly in **Action, performance and dialogue**, beside the action and expression it accompanies. Use H3 syntax such as `@Character (S1) turns, smiles, and says, <d>[Chinese] 你好。</d>`. Dialogue timing is written naturally in the same description, for example `At 00:02.000, ...`. The compiler recognizes `<d>[Language] ...</d>` as intentional speech and therefore does not append a contradictory no-speech instruction. Explicit inline `<Subject N> (Sx)` assignments are also reused when binding voice-reference audio.

The optional **Performance emotion** preset provides the seven basic acting emotions—joy, sadness, anger, fear, surprise, disgust, and contempt—with facial-action cues and performance intent. Its generated text remains editable and is compiled beside the unified action/performance description.

Narration remains a separate structured panel because it needs off-screen voice and closed-lip behavior. Its language dropdown provides stable support for Arabic, Chinese, English, French, German, Italian, Japanese, Korean, Portuguese, Russian, and Spanish, while **Other / custom language** keeps additional languages editable. Narration has optional absolute output-timeline **Start** and **End** values; leaving either empty inherits the Shot range. Values outside the Shot are clamped with a warning, and invalid ranges fall back to the full Shot.

A shot without inline `<d>` dialogue, structured narration, or legacy structured dialogue explicitly forbids newly generated dialogue, narration, muttering, babble, singing, and other human vocalization. Vocal material already contained in a directly reused soundtrack remains allowed. Existing workflows containing the former structured Dialogue panel continue to compile without losing their settings, but new editing is centered on the unified prompt field.

In the Shot inspector, typing `@` in a text field opens the current named Picture/Video/Audio reference list; use the mouse or arrow keys plus Enter to insert an alias. Shot type, lens, depth of field, camera movement, camera angle, composition, lighting, motion pace, and transition provide H3-oriented presets while keeping an editable custom value beside every preset.

The lens presets include **Auto / no fixed focal length** for variable-lens moves such as Dolly Zoom, plus fisheye, 200mm, and 400mm options. **Custom lens** clears and focuses the editable field for any special optical description.

Visual references have separate **Subject / target**, **Subject description / visible content**, and **Reference instruction** fields. The Subject value groups assets into one reusable `<Subject N>`; the description states what is visibly reusable, while the instruction controls preservation or transfer. Giving an image and a video the same Subject combines their appearance and motion contributions into one `subject_definitions` entry.

The Timeline workspace keeps Shot/camera/sound controls in a full-height left column. The right side stacks Source Media, the direction timeline, and the selected Shot prompt fields. Selecting a reference opens its details in the lower-right area without replacing the active Shot settings on the left. On narrower nodes the regions collapse into one column. Left-side settings can be saved to and loaded from local reusable templates without replacing prompt text. **Preview compiled prompt** calls the same backend compiler used by `compiled_prompt` and displays the exact six-section prompt, frame count, and validation status before queueing.

The toolbar includes a persistent 10–18 px interface font-size selector. Narration and Director settings start collapsed to keep the prompt area compact; expanding either section is remembered while the node remains open.

The toolbar also shows the authoritative **Output duration**. This value defines H3 `length`; the backend clamps Shot ranges to it and never silently replaces it with stale Shot data. Adding or editing Shots may deliberately update the visible duration control in the UI, while loading an existing workflow preserves its saved output duration.

The left Shot controls are grouped into Camera, Sound, and Transition modules. Each module has an **Auto design** switch that ignores its stored manual values and delegates that section to the model. In manual Sound mode, blank Ambience, Music, or Sound Effects fields compile as silence for that individual layer. Per-Shot visible-text/Logo direction has been removed from these controls.

Each Shot can switch **Shot prompt source** from Director fields to **External prompt override**. Override mode replaces that Shot's automatically generated detailed-description body, including its automatic narration, speech restrictions, and sound cues. Named `@aliases` are still converted to native H3 reference/subject tags, while global sections, transition boundary, current Shot number, and reference definitions remain compiler-owned. A leading pasted `[Shot]` or `[Shot N]` label is removed and rebuilt from the current timeline. An empty enabled override falls back to Director fields and reports a warning.

Shot 1 owns the master format, scene, visual style, identity, camera, ambience, music, continuity, visible-text, and avoid rules. Later Shots display those values read-only in **Inherit Shot 1** mode; switching a Shot to **Custom override** stores only its local changes. Director settings have their own browser-local save/load/delete templates. Loading a Director template into Shot 1 updates every inheriting Shot, while loading one into a later Shot automatically makes that Shot custom.

## Included starting points

Simple mode:

- Single-character performance
- Two-person dialogue
- Silent action
- Environment showcase
- Product showcase
- Three-shot short

Director mode:

- Character + voice performance
- Identity + motion transfer
- Product advertisement
- Video edit / subject replacement

Applying a preset replaces the current Director plan after confirmation.

## H3 Ref2VA behavior represented by the node

- References can mix images, videos, paired video soundtracks, and standalone audio.
- Practical limits are 9 pictures, 3 videos, 3 audio references, and 12 files total.
- Reference videos are strongest in the roughly 2-15 second range, with about 15 seconds total reference video recommended.
- H3 can interpret identity, wardrobe, product/object detail, scene, style, composition, motion, camera, edit source, voice, music, SFX, and visible text relationships through natural-language direction.
- Source crop is applied by the Director when decoding media. Video is resampled to 24 fps. Reference tensors remain global context during sampling, so output timeline ranges remain prompt direction rather than hard masks.
- Prompts compile into the six Ref2VA sections: `subject_definitions`, `summary`, `retention_analysis`, `detailed_description`, `overall_soundscape`, and `non_diegetic_music`.

## Audio prompt model

- `<Audio N>` numbering is independent from `<Video N>`. Only standalone audio, an audio-only video, or an explicitly enabled/replaced synchronized video track receives an audio label.
- **Audio reuse** means all or part of the source signal is copied. Its valid markers are `fully_copy` and `partially_copy`.
- **Audio reference** means the source signal is not copied. It can guide voice timbre, delivery, dialogue or lyric content, music style, beat/rhythm, sound-effect texture, or continuity; its valid markers are `reference` and `weak_reference`.
- One audio asset may select several roles. The compiler combines them into one natural `<Audio N>` definition.
- A voice reference can bind to a visual subject. The compiler assigns `(S1)`, `(S2)`, and later IDs from the order of actual target-video dialogue and narration events, then reuses that ID in the audio definition. Audio never creates or renumbers a speaker ID by itself.
- Dialogue and lyrics appear only inside `<d>` in `detailed_description`. `overall_soundscape` contains ambience and physical sounds; `non_diegetic_music` contains audience-only music and outputs `N/A` when absent.

## Outputs

- `compiled_prompt`: connect to the official H3 prompt input.
- `timeline_json`: normalized reusable v3 plan, including source crops and the resolved H3 frame count.
- `reference_report`: exact tag-to-socket wiring and counts.
- `warning_report`: limits, invalid ranges, gaps, overlaps, pairing problems, unresolved aliases, and frame-grid snapping.
- `length`: H3-compatible output frame count.
- `positive`, `latent`: native H3 conditioning outputs when all three model inputs are connected.

Existing v1/v2 plans are migrated in memory. Their references and shots are preserved, and new fields receive safe defaults.
