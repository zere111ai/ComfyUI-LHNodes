import hashlib
import json


class LHRepairCacheFingerprint:
    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {"sampler_id": ("STRING", {"default": "125"})},
                "hidden": {"prompt": "PROMPT"}}

    RETURN_TYPES = ("STRING",)
    FUNCTION = "fingerprint"
    CATEGORY = "LH/MiniMax H3"

    @classmethod
    def IS_CHANGED(cls, sampler_id, prompt):
        return cls().fingerprint(sampler_id, prompt)[0]

    def fingerprint(self, sampler_id, prompt):
        pending = [sampler_id]
        upstream = {}
        while pending:
            key = pending.pop()
            if key in upstream:
                continue
            node = prompt[key]
            upstream[key] = {"class_type": node["class_type"], "inputs": node["inputs"]}
            for value in node["inputs"].values():
                if isinstance(value, list) and len(value) == 2 and isinstance(value[0], str) and value[0] in prompt and isinstance(value[1], int):
                    pending.append(value[0])
        payload = json.dumps(upstream, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
        return (hashlib.sha256(payload.encode("utf-8")).hexdigest(),)


class LHRepairSegmentAudio:
    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {"audio": ("AUDIO",),
                             "splice_map": ("STRING", {"forceInput": True}),
                             "fps": ("INT", {"default": 24, "min": 1})}}

    RETURN_TYPES = ("AUDIO",)
    FUNCTION = "crop"
    CATEGORY = "LH/MiniMax H3"

    def crop(self, audio, splice_map, fps):
        segment = json.loads(splice_map)
        rate = audio["sample_rate"]
        start = round(segment["start"] * rate / fps)
        end = round((segment["end"] + 1) * rate / fps)
        waveform = audio["waveform"]
        if start < 0 or end <= start or start >= waveform.shape[-1]:
            raise ValueError("Repair segment lies outside the source audio.")
        return ({"sample_rate": rate, "waveform": waveform[..., start:end].clone()},)


NODE_CLASS_MAPPINGS = {
    "LHRepairCacheFingerprint": LHRepairCacheFingerprint,
    "LHRepairSegmentAudio": LHRepairSegmentAudio,
}
NODE_DISPLAY_NAME_MAPPINGS = {
    "LHRepairCacheFingerprint": "LH 首轮缓存参数指纹",
    "LHRepairSegmentAudio": "LH 修复片段音频对齐",
}
