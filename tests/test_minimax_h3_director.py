import json
import pathlib
import sys
import unittest


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
