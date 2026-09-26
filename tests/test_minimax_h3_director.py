import json
import pathlib
import sys
import unittest
from types import ModuleType, SimpleNamespace
from unittest.mock import Mock, patch
from fractions import Fraction

import av
import numpy as np


sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

import lh_minimax_h3_director as director


def image_ref(index, name, **values):
    ref = {
        "id": f"ref_{index}",
        "name": name,
        "type": "image",
        "subject": name,
        "purpose": "identity",
        "mode": "preserve",
        "fidelity": "strict",
        "start": 0,
        "end": 10,
        "enabled": True,
        "sourcePath": f"{name}.png",
    }
    ref.update(values)
    return ref


def shot(index, start, end, action, **values):
    item = {"id": f"shot_{index}", "title": f"Shot {index}", "start": start, "end": end, "action": action}
    item.update(values)
    return item


class DirectorCompilerTests(unittest.TestCase):
    def test_camera_details_compile_and_select_references(self):
        result = self.compile(5, [image_ref(1, "A"), image_ref(2, "Unused")], [
            shot(1, 0, 5, "Waits.", focusTarget="@A", cameraTarget="@A",
                 shotRelation="two-shot", focusMode="continuous focus tracking",
                 cameraSpeed="slow camera movement", transitionOut="fade out")])
        self.assertEqual(len(json.loads(result[1])["references"]), 1)
        for text in ("Focus on", "The camera follows", "two-shot", "slow camera movement", "At the end of this shot: fade out"):
            self.assertIn(text, result[0])
        self.assertNotIn("@A", result[0])

    def test_camera_auto_ignores_detail_reference(self):
        result = self.compile(5, [image_ref(1, "A")], [
            shot(1, 0, 5, "An empty room.", cameraAuto=True, focusTarget="@A",
                 cameraSpeed="fast camera movement", transitionAuto=True, transitionOut="fade out")])
        self.assertEqual(json.loads(result[1])["references"], [])
        self.assertNotIn("fast camera movement", result[0])
        self.assertNotIn("At the end of this shot: fade out", result[0])

    def test_override_ignores_new_controls(self):
        result = self.compile(5, [image_ref(1, "A")], [
            shot(1, 0, 5, "", focusTarget="@A", transitionOut="fade out",
                 promptOverrideEnabled=True, promptOverride="A river flows.")])
        self.assertEqual(json.loads(result[1])["references"], [])
        self.assertNotIn("At the end of this shot", result[0])

    def test_t8_bridge_uses_director_media_at_each_resolution(self):
        native = Mock()
        native.execute.return_value = SimpleNamespace(result=("positive", "latent", None, "", "", ""))
        registry = ModuleType("nodes")
        registry.NODE_CLASS_MAPPINGS = {"MiniMaxH3AudioConditioningT8": native}
        compiled = self.compile(10, [image_ref(1, "A"), image_ref(2, "Unused")], [shot(1, 0, 10, "@A waits.")])
        media = ({"ref_image_0": object()}, {}, {}, {})
        with patch.dict(sys.modules, {"nodes": registry}), patch.object(director, "_load_director_media", return_value=media) as loader:
            bridge = director.LHMiniMaxH3DirectorT8Conditioning()
            for width, height in ((1280, 736), (1920, 1088)):
                output = bridge.encode("clip", "video_vae", "audio_vae", compiled[0], compiled[1], width, height)
                self.assertEqual(output, ("positive", "latent"))
                values = native.execute.call_args.kwargs
                self.assertEqual((values["width"], values["height"]), (width, height))
                self.assertEqual(values["length"], compiled[4])
                self.assertIs(values["ref_images"], media[0])
                self.assertEqual([ref["name"] for ref in loader.call_args.args[0]], ["A"])
                self.assertEqual(values["audio_mode"], "native")

    def test_chinese_text_next_to_alias(self):
        result = self.compile(5, [image_ref(1, "Alice")], [shot(1, 0, 5, "@Alice走进房间。")])
        self.assertEqual(len(json.loads(result[1])["references"]), 1)
        self.assertNotIn("@Alice", result[0])

    def test_plain_dialogue_does_not_receive_speech_ban(self):
        for action in ('@A says: Hello.', '@A轻声说：“你好。”'):
            result = self.compile(5, [image_ref(1, "A")], [shot(1, 0, 5, action)])
            self.assertNotIn("Speech is forbidden", result[0])
        silent = self.compile(5, [image_ref(1, "A")], [shot(1, 0, 5, "@A walks.")])
        self.assertIn("Speech is forbidden", silent[0])

    def test_global_style_alias_is_resolved_in_final_prompt(self):
        result = self.compile(5, [image_ref(1, "A")], [shot(1, 0, 5, "@A waits.")],
                              {"visualStyle": "A portrait of @A"})
        self.assertNotIn("@A", result[0])

    def test_reordered_custom_shot_keeps_direction(self):
        result = self.compile(5, [image_ref(1, "A"), image_ref(2, "B")], [
            shot(1, 2, 5, "waits."),
            shot(2, 0, 2, "waits.", directionMode="custom", directionOverrides={"scene": "@B"}),
        ], {"scene": "@A"})
        shots = json.loads(result[1])["shots"]
        self.assertEqual(shots[0]["directionOverrides"]["scene"], "@B")
        self.assertEqual(shots[0]["activeReferenceIds"], ["ref_2"])
        self.assertEqual(shots[1]["activeReferenceIds"], ["ref_1"])

    def test_empty_music_does_not_emit_global_music(self):
        result = self.compile(5, [], [shot(1, 0, 2, "waits."),
            shot(2, 2, 5, "waits.", directionMode="custom", directionOverrides={"musicRules": "N/A"})],
            {"musicRules": "Jazz throughout."})
        self.assertNotIn("Jazz throughout", result[0])
        self.assertIn("Shot 2: no music", result[0])

    def test_packed_stereo_audio_preserves_channels_and_crop(self):
        samples = np.arange(960, dtype=np.int16).reshape(1, -1)
        frame = av.AudioFrame.from_ndarray(samples, format="s16", layout="stereo")
        frame.sample_rate = 48000
        frame.pts = 0
        frame.time_base = Fraction(1, 48000)
        container = Mock()
        container.streams = [SimpleNamespace(type="audio", rate=48000)]
        container.decode.return_value = [frame]
        with patch.object(av, "open", return_value=container), patch.object(director, "_resolve_input_path", return_value="test.mov"):
            result = director._load_embedded_audio("test.mov", 0.002, 0.006)
        self.assertEqual(tuple(result["waveform"].shape), (1, 2, 192))
        self.assertAlmostEqual(result["waveform"][0, 0, 0].item(), 192 / 32768)
        self.assertAlmostEqual(result["waveform"][0, 1, 0].item(), 193 / 32768)
        container.close.assert_called_once()

    def test_native_conditioning_uses_named_arguments(self):
        native = ModuleType("comfy_extras.nodes_minimax_h3")
        execute = Mock(return_value=SimpleNamespace(result=("positive", "latent")))
        native.MiniMaxH3ReferenceToVideo = SimpleNamespace(execute=execute)
        clip, vae, audio_vae = object(), object(), object()
        media = ({"ref_image_1": object()}, {}, {}, {})
        data = {"references": [image_ref(1, "A")], "shots": [shot(1, 0, 5, "@A waits.")]}
        with patch.dict(sys.modules, {native.__name__: native}), patch.object(
            director, "_load_director_media", return_value=media
        ):
            result = director.LHMiniMaxH3DirectorTimeline().compile(
                5, "", data, width=1344, height=768, ref_image_size="max",
                clip=clip, vae=vae, audio_vae=audio_vae,
            )
        execute.assert_called_once_with(
            clip=clip, vae=vae, audio_vae=audio_vae, prompt=result[0],
            width=1344, height=768, length=result[4], ref_image_size="max",
            ref_images=media[0], ref_videos=media[1],
            ref_video_audios=media[2], ref_audios=media[3],
        )
        self.assertEqual(result[-2:], ("positive", "latent"))

    def compile(self, duration, references, shots, global_data=None):
        return director.compile_director("", duration, {
            "references": references,
            "shots": shots,
            "global": global_data or {},
        })

    def test_shot_reference_scope_follows_effective_aliases(self):
        result = self.compile(10, [image_ref(1, "A"), image_ref(2, "B")], [
            shot(1, 0, 5, "@A walks alone."),
            shot(2, 5, 10, "@B walks alone.", transition="cut"),
        ])
        timeline = json.loads(result[1])
        self.assertEqual(timeline["shots"][0]["activeReferenceIds"], ["ref_1"])
        self.assertEqual(timeline["shots"][1]["activeReferenceIds"], ["ref_2"])
        self.assertIn("<Subject 1> (appears in [Shot 1])", result[0])
        self.assertIn("<Subject 2> (appears in [Shot 2])", result[0])

    def test_unmentioned_reference_is_not_sent_to_h3(self):
        result = self.compile(5, [image_ref(1, "Used"), image_ref(2, "Unused")], [
            shot(1, 0, 5, "@Used walks alone."),
        ])
        timeline = json.loads(result[1])
        self.assertEqual([ref["name"] for ref in timeline["references"]], ["Used"])
        self.assertIn("Excluded because no effective prompt field mentions their @alias: @Unused.", result[2])

    def test_deleted_shot_detaches_legacy_reference_bar(self):
        ref = image_ref(1, "A", timelinePinned=True, timelineShotId="deleted_shot")
        result = self.compile(5, [ref], [shot(1, 0, 5, "@A waits.")])
        timeline_ref = json.loads(result[1])["references"][0]
        self.assertFalse(timeline_ref["timelinePinned"])
        self.assertIn("detached from a deleted Shot", result[3])

    def test_picture_only_video_ignores_stale_external_audio(self):
        video = {
            "id": "video_1", "name": "clip", "type": "video", "subject": "actor", "purpose": "motion",
            "mode": "preserve", "fidelity": "balanced", "mediaMode": "video", "sourcePath": "clip.mp4",
            "attachedAudioPath": "old.wav", "start": 0, "end": 5, "duration": 5, "enabled": True,
        }
        result = self.compile(5, [video], [shot(1, 0, 5, "@clip moves.")])
        ref = json.loads(result[1])["references"][0]
        self.assertNotIn("audioTag", ref)
        self.assertNotIn("ref_video_audio_", result[2])

    def test_transitions_use_natural_cut_without_scenetrans(self):
        result = self.compile(10, [image_ref(1, "A")], [
            shot(1, 0, 5, "@A waits.", transition="cut"),
            shot(2, 5, 10, "@A leaves.", transition="cut"),
        ])
        self.assertNotIn("<scenetrans>", result[0])
        self.assertNotIn("Transition: cut", result[0])
        self.assertIn("[Shot 2] At 00:05.000, the shot cuts to Shot 2", result[0])

    def test_duration_input_is_authoritative(self):
        result = self.compile(5, [image_ref(1, "A")], [shot(1, 0, 10, "@A waits.")])
        timeline = json.loads(result[1])
        self.assertEqual(timeline["duration"], 5)
        self.assertEqual(timeline["shots"][0]["end"], 5)

    def test_duplicate_explicit_speaker_ids_are_reassigned(self):
        result = self.compile(5, [image_ref(1, "A"), image_ref(2, "B")], [
            shot(1, 0, 5, "@A (S1) says, <d>[English] A.</d> @B (S1) says, <d>[English] B.</d>"),
        ])
        self.assertIn("<Subject 1> (S1)", result[0])
        self.assertIn("<Subject 2> (S2)", result[0])
        self.assertIn("assigned to multiple subjects", result[3])

    def test_image_replacement_is_not_mislabeled_video_editing(self):
        ref = image_ref(1, "Wardrobe", purpose="wardrobe", mode="replace")
        result = self.compile(5, [ref], [shot(1, 0, 5, "@Wardrobe appears.")])
        summary = result[0].split("summary:\n", 1)[1].split("\n\nretention_analysis:", 1)[0]
        self.assertNotIn("video editing", summary)


if __name__ == "__main__":
    unittest.main()
