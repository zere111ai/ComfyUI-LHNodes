import importlib.util
import json
from pathlib import Path
import unittest

import torch

spec = importlib.util.spec_from_file_location(
    "repair_helpers", Path(__file__).resolve().parents[1] / "lh_h3_repair_helpers.py")
helpers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helpers)


class RepairHelpersTests(unittest.TestCase):
    def setUp(self):
        self.prompt = {
            "125": {"class_type": "Sampler", "inputs": {"noise": ["129", 0]}},
            "129": {"class_type": "Noise", "inputs": {"seed": 42}},
            "187": {"class_type": "Sampler", "inputs": {"steps": 18}},
        }

    def test_first_pass_changes_invalidate(self):
        cls = helpers.LHRepairCacheFingerprint
        before = cls.IS_CHANGED("125", self.prompt)
        self.prompt["129"]["inputs"]["seed"] = 43
        self.assertNotEqual(before, cls.IS_CHANGED("125", self.prompt))

    def test_second_pass_changes_reuse(self):
        cls = helpers.LHRepairCacheFingerprint
        before = cls.IS_CHANGED("125", self.prompt)
        self.prompt["187"]["inputs"]["steps"] = 12
        self.assertEqual(before, cls.IS_CHANGED("125", self.prompt))

    def test_audio_uses_segment_offset_and_inclusive_end(self):
        waveform = torch.arange(48000 * 5).reshape(1, 1, -1)
        audio = {"sample_rate": 48000, "waveform": waveform}
        result, = helpers.LHRepairSegmentAudio().crop(
            audio, json.dumps({"start": 48, "end": 71}), 24)
        self.assertEqual(result["waveform"].shape[-1], 48000)
        self.assertEqual(result["waveform"][0, 0, 0].item(), 96000)
        result["waveform"].zero_()
        self.assertEqual(waveform[0, 0, 96000].item(), 96000)

    def test_invalid_audio_range(self):
        with self.assertRaises(ValueError):
            helpers.LHRepairSegmentAudio().crop(
                {"sample_rate": 24, "waveform": torch.zeros(1, 1, 24)},
                json.dumps({"start": 48, "end": 71}), 24)


if __name__ == "__main__":
    unittest.main()
