"""Prompt and reference-plan compiler for ComfyUI's MiniMax H3 Ref2VA node."""

from __future__ import annotations

import json
import os
import re
import wave
from bisect import bisect_left
from typing import Any

import numpy as np
import torch
from aiohttp import web
from PIL import Image

import server


KIND = "LH_MINIMAX_H3_DIRECTOR_TIMELINE"
VERSION = 3
FPS = 24
PURPOSES = {
    "identity",
    "wardrobe",
    "object",
    "scene",
    "style",
    "composition",
    "motion",
    "camera",
    "edit_source",
    "voice",
    "music",
    "sfx",
    "text",
}
PURPOSE_LABELS = {
    "identity": "identity and appearance",
    "wardrobe": "wardrobe, materials, and accessories",
    "object": "object or product geometry and details",
    "scene": "environment and scene layout",
    "style": "visual style, color, and lighting",
    "composition": "composition and framing",
    "motion": "subject or object motion",
    "camera": "camera movement and lens behavior",
    "edit_source": "source footage content and timing",
    "voice": "voice and vocal performance",
    "music": "music, rhythm, and melody",
    "sfx": "sound effect",
    "text": "logo, typography, or visible text",
}
CONTROL_MODES = {"preserve", "borrow", "match", "transform", "replace", "inspire"}
FIDELITIES = {"strict", "strong", "balanced", "loose"}
RETENTION_MODES = {"auto", "fully_preserved", "partially_preserved", "attribute_transfer", "weak_reference", "fully_copy", "partially_copy", "reference"}
VISUAL_RETENTION_MODES = {"auto", "fully_preserved", "partially_preserved", "attribute_transfer", "weak_reference"}
AUDIO_RETENTION_MODES = {"auto", "fully_copy", "partially_copy", "reference", "weak_reference"}
AUDIO_MODES = {"reuse", "reference"}
AUDIO_ROLES = {
    "complete_soundtrack",
    "voice_timbre",
    "voice_delivery",
    "dialogue_content",
    "lyrics",
    "music_style",
    "beat_rhythm",
    "sound_effect",
    "audio_continuity",
}
MEDIA_MODES = {"video", "audio", "video_audio"}
REF_TYPES = {"image", "video", "audio"}
FRAME_ROLES = {"reference", "first_frame", "keyframe", "last_frame", "storyboard", "edit_source", "continuation_source"}
MAX_IMAGES = 9
MAX_VIDEOS = 3
MAX_AUDIOS = 3
MAX_FILES = 12
MIN_DURATION = 4.0
MAX_DURATION = 15.0
MIN_VIDEO_DURATION = 2.0
MAX_VIDEO_DURATION = 15.0


def _float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _clean_text(value: Any) -> str:
    return " ".join(str(value or "").strip().split())


def _clean_multiline(value: Any) -> str:
    return "\n".join(line.strip() for line in str(value or "").strip().splitlines() if line.strip())


def _choice(value: Any, choices: set[str], default: str) -> str:
    value = str(value or default).lower()
    return value if value in choices else default


def _h3_frame_count(duration: float) -> int:
    requested = max(5, round(duration * FPS))
    lower = max(5, requested - (requested - 5) % 17)
    upper = lower + 17
    return lower if requested - lower < upper - requested else upper


def _default_global() -> dict[str, str]:
    return {
        "format": "single continuous cinematic clip",
        "scene": "",
        "visualStyle": "cinematic, coherent lighting, natural motion",
        "characterRules": "Keep every named subject visually distinct and temporally consistent.",
        "cameraRules": "Use stable, intentional camera movement and preserve screen direction.",
        "audioRules": "Generate only explicitly requested ambience and physical sound effects. Empty sound fields mean silence.",
        "musicRules": "N/A",
        "continuity": "Maintain identity, wardrobe, props, geography, lighting, and action continuity between shots.",
        "avoid": "identity mixing, duplicated subjects, extra limbs, unstable anatomy, flicker, frozen expressions, accidental subtitles, logos, or watermarks",
    }


def _default_data(duration: float = 5.0) -> dict[str, Any]:
    return {
        "version": VERSION,
        "kind": KIND,
        "duration": duration,
        "settings": {"promptMode": "director", "snap": 0.1},
        "global": _default_global(),
        "references": [
            {
                "id": "ref_1",
                "name": "Character_A",
                "type": "image",
                "subject": "Subject 1",
                "description": "",
                "purpose": "identity",
                "mode": "preserve",
                "fidelity": "strict",
                "start": 0,
                "end": duration,
                "duration": 0,
                "pairedVideoId": "",
                "frameRole": "reference",
                "mediaMode": "video",
                "sourcePath": "",
                "sourceDuration": 0,
                "trimStart": 0,
                "trimEnd": None,
                "attachedAudioPath": "",
                "audioMode": "reference",
                "audioRoles": [],
                "speakerRefId": "",
                "speakerDescription": "",
                "audioRetention": "auto",
                "audioNotes": "",
                "retention": "auto",
                "notes": "Preserve face, hair, body shape, outfit, and distinctive details.",
                "enabled": True,
            }
        ],
        "shots": [
            {
                "id": "shot_1",
                "title": "Opening",
                "start": 0,
                "end": duration,
                "shotType": "medium shot",
                "lens": "",
                "depth": "",
                "camera": "slow dolly in",
                "cameraAngle": "",
                "composition": "",
                "lighting": "",
                "motionPace": "",
                "subjects": "@Character_A",
                "action": "@Character_A looks toward camera",
                "expression": "",
                "dialogue": "",
                "speaker": "",
                "voice": "",
                "language": "Chinese",
                "dialogueStart": "",
                "dialogueEnd": "",
                "cutoff": False,
                "narration": "",
                "narrator": "",
                "narrationVoice": "",
                "narrationLanguage": "Chinese",
                "narrationStart": "",
                "narrationEnd": "",
                "narrationCutoff": False,
                "ambience": "",
                "music": "",
                "sfx": "",
                "transition": "cut",
                "continuity": "",
                "referenceIds": [],
                "cameraAuto": False,
                "audioAuto": False,
                "transitionAuto": False,
                "promptOverrideEnabled": False,
                "promptOverride": "",
            }
        ],
    }


def _parse_data(raw: Any, duration: float) -> tuple[dict[str, Any], list[str]]:
    warnings: list[str] = []
    if isinstance(raw, dict):
        data = raw
    else:
        try:
            data = json.loads(raw or "{}")
        except (TypeError, json.JSONDecodeError) as exc:
            warnings.append(f"Director JSON was invalid and defaults were used: {exc}")
            data = _default_data(duration)
    if not isinstance(data, dict):
        warnings.append("Director JSON root must be an object; defaults were used.")
        data = _default_data(duration)
    data = dict(data)
    data["version"] = VERSION
    data["kind"] = KIND
    data["duration"] = duration
    if not isinstance(data.get("settings"), dict):
        data["settings"] = {}
    if not isinstance(data.get("global"), dict):
        data["global"] = {}
    if not isinstance(data.get("references"), list):
        data["references"] = []
        warnings.append("references must be an array.")
    if not isinstance(data.get("shots"), list):
        data["shots"] = []
        warnings.append("shots must be an array.")
    return data, warnings


def _normalize_settings(data: dict[str, Any]) -> dict[str, Any]:
    settings = data.get("settings", {})
    return {
        "promptMode": "compact" if settings.get("promptMode") == "compact" else "director",
        "snap": max(1 / FPS, min(1.0, _float(settings.get("snap"), 0.1))),
    }


def _normalize_global(data: dict[str, Any]) -> dict[str, str]:
    defaults = _default_global()
    source = data.get("global", {})
    result = {key: _clean_multiline(source.get(key, default)) for key, default in defaults.items()}
    if result["audioRules"] == "Generate clean synchronized stereo audio. Keep dialogue intelligible.":
        result["audioRules"] = defaults["audioRules"]
    if result["audioRules"] == "Natural synchronized stereo ambience and physical sounds support the visible action.":
        result["audioRules"] = defaults["audioRules"]
    if result["musicRules"] == "Use music only when requested and keep it subordinate to dialogue.":
        result["musicRules"] = "N/A"
    if result["scene"] in {
        "Construct each shot from its explicitly described subjects, environment, actions, camera direction, and reference relationships. Do not assume an unstated genre, performer, or location.",
        "Stage the explicitly described setting so the active speakers and their facial performances remain readable. Preserve clear spatial relationships between all characters.",
        "Treat the explicitly described environment, location, object, atmosphere, weather, or visual event as the primary subject. Do not introduce a foreground performer unless explicitly requested.",
    }:
        result["scene"] = ""
    return result


def _unique_name(raw: Any, index: int, seen: set[str], warnings: list[str]) -> str:
    name = _clean_text(raw) or f"Reference_{index}"
    base = name
    suffix = 2
    while name.casefold() in seen:
        name = f"{base}_{suffix}"
        suffix += 1
    if name != base:
        warnings.append(f"Duplicate reference name '{base}' was renamed to '{name}'.")
    seen.add(name.casefold())
    return name


def _normalize_references(data: dict[str, Any], duration: float, warnings: list[str]) -> list[dict[str, Any]]:
    refs: list[dict[str, Any]] = []
    seen_names: set[str] = set()
    seen_ids: set[str] = set()
    for index, raw in enumerate(data.get("references", []), 1):
        if not isinstance(raw, dict) or raw.get("enabled", True) is False:
            continue
        ref_type = str(raw.get("type", "image")).lower()
        if ref_type not in REF_TYPES:
            warnings.append(f"Reference {index} has unsupported type '{ref_type}' and was ignored.")
            continue
        purpose = str(raw.get("purpose", "identity")).lower()
        if purpose not in PURPOSES:
            warnings.append(f"Reference {index} purpose '{purpose}' was changed to 'identity'.")
            purpose = "identity"
        start = min(duration, max(0.0, _float(raw.get("start"), 0.0)))
        end = min(duration, _float(raw.get("end"), duration))
        if end <= start:
            warnings.append(f"Reference {index} had an invalid active range; the full timeline is used.")
            start, end = 0.0, duration
        ref_id = _clean_text(raw.get("id")) or f"ref_{index}"
        if ref_id in seen_ids:
            ref_id = f"ref_{index}"
            warnings.append(f"Reference {index} had a duplicate id; it was changed to '{ref_id}'.")
        seen_ids.add(ref_id)
        media_mode = _choice(raw.get("mediaMode", raw.get("media_mode")), MEDIA_MODES, "video")
        attached_audio_path = str(raw.get("attachedAudioPath", raw.get("audio", "")) or "").strip()
        has_audio = ref_type == "audio" or (ref_type == "video" and media_mode in {"audio", "video_audio"})
        raw_roles = raw.get("audioRoles", raw.get("audio_roles", []))
        audio_roles = [str(role) for role in raw_roles if str(role) in AUDIO_ROLES] if isinstance(raw_roles, list) else []
        if has_audio and not audio_roles:
            audio_roles = {
                "voice": ["voice_timbre", "voice_delivery"],
                "music": ["music_style"],
                "sfx": ["sound_effect"],
            }.get(purpose, ["audio_continuity"])
        legacy_retention = _choice(raw.get("retention"), RETENTION_MODES, "auto")
        audio_retention = _choice(raw.get("audioRetention", raw.get("audio_retention", legacy_retention if ref_type == "audio" else "auto")), AUDIO_RETENTION_MODES, "auto")
        audio_mode = _choice(raw.get("audioMode", raw.get("audio_mode")), AUDIO_MODES, "reference")
        valid_audio_retentions = {"auto", "fully_copy", "partially_copy"} if audio_mode == "reuse" else {"auto", "reference", "weak_reference"}
        if audio_retention not in valid_audio_retentions:
            warnings.append(f"Audio '{raw.get('name', index)}' retention '{audio_retention}' conflicts with {audio_mode} mode and was reset to auto.")
            audio_retention = "auto"
        visual_retention = legacy_retention if legacy_retention in VISUAL_RETENTION_MODES else "auto"
        ref = {
            "id": ref_id,
            "name": _unique_name(raw.get("name"), index, seen_names, warnings),
            "type": ref_type,
            "subject": _clean_text(raw.get("subject")),
            "description": _clean_multiline(raw.get("description", raw.get("subjectDescription", raw.get("subject_description", "")))),
            "purpose": purpose,
            "mode": _choice(raw.get("mode"), CONTROL_MODES, "preserve"),
            "fidelity": _choice(raw.get("fidelity"), FIDELITIES, "balanced"),
            "retention": visual_retention,
            "audioMode": audio_mode,
            "audioRoles": audio_roles,
            "speakerRefId": _clean_text(raw.get("speakerRefId", raw.get("speaker_ref_id"))),
            "speakerDescription": _clean_text(raw.get("speakerDescription", raw.get("speaker_description"))),
            "audioRetention": audio_retention,
            "audioNotes": _clean_multiline(raw.get("audioNotes", raw.get("audio_notes", raw.get("notes", "") if has_audio and ref_type == "audio" else ""))),
            "start": round(start, 3),
            "end": round(end, 3),
            "duration": max(0.0, _float(raw.get("duration"), 0.0)),
            "pairedVideoId": _clean_text(raw.get("pairedVideoId")),
            "frameRole": _choice(
                raw.get("frameRole", raw.get("frame_role")),
                FRAME_ROLES,
                "edit_source" if ref_type == "video" and purpose == "edit_source" else "reference",
            ),
            "mediaMode": media_mode,
            "sourcePath": str(raw.get("sourcePath", raw.get("value", "")) or "").strip(),
            "sourceDuration": max(0.0, _float(raw.get("sourceDuration", raw.get("source_duration")), 0.0)),
            "trimStart": max(0.0, _float(raw.get("trimStart", raw.get("trim_start")), 0.0)),
            "trimEnd": None,
            "attachedAudioPath": attached_audio_path,
            "waveformPeaks": raw.get("waveformPeaks", raw.get("waveform_peaks", [])) if isinstance(raw.get("waveformPeaks", raw.get("waveform_peaks", [])), list) else [],
            "notes": _clean_multiline(raw.get("notes")),
            "timelinePinned": raw.get("timelinePinned", raw.get("timeline_pinned", False)) is True,
            "timelineShotId": _clean_text(raw.get("timelineShotId", raw.get("timeline_shot_id"))),
            "order": index,
        }
        trim_end = raw.get("trimEnd", raw.get("trim_end"))
        if trim_end is not None:
            ref["trimEnd"] = max(ref["trimStart"], _float(trim_end, ref["sourceDuration"]))
        elif ref["sourceDuration"] > 0:
            ref["trimEnd"] = ref["sourceDuration"]
        if ref["trimEnd"] is not None:
            ref["duration"] = max(0.0, ref["trimEnd"] - ref["trimStart"])
        if ref_type == "image" and ref["frameRole"] in {"edit_source", "continuation_source"}:
            warnings.append(f"Image '{ref['name']}' cannot be a video edit or continuation source; its asset role was reset to reference.")
            ref["frameRole"] = "reference"
        if ref_type == "video" and ref["frameRole"] in {"first_frame", "keyframe", "last_frame"}:
            warnings.append(f"Video '{ref['name']}' cannot be a still-frame anchor; its asset role was reset to reference.")
            ref["frameRole"] = "reference"
        if ref_type == "audio":
            ref["frameRole"] = "reference"
        if ref_type == "audio" and purpose not in {"voice", "music", "sfx"}:
            warnings.append(f"Audio '{ref['name']}' uses visual purpose '{purpose}'; describe the intended audio role explicitly.")
        if ref_type != "audio" and purpose in {"voice", "music", "sfx"}:
            warnings.append(f"{ref_type.title()} '{ref['name']}' uses audio purpose '{purpose}'; check the media type.")
        refs.append(ref)
    return refs


def _assign_tags(refs: list[dict[str, Any]], warnings: list[str]) -> None:
    images = [ref for ref in refs if ref["type"] == "image"]
    videos = [ref for ref in refs if ref["type"] == "video" and ref["mediaMode"] != "audio"]
    audio_only_videos = [ref for ref in refs if ref["type"] == "video" and ref["mediaMode"] == "audio"]
    audios = [ref for ref in refs if ref["type"] == "audio"]
    video_ids = {ref["id"] for ref in videos}

    for ref in refs:
        for key in ("tag", "connection", "audioTag", "audioConnection", "audioAlias"):
            ref.pop(key, None)
    for index, ref in enumerate(images, 1):
        ref["tag"] = f"<Picture {index}>"
        ref["connection"] = f"ref_image_{index - 1}"
    for index, ref in enumerate(videos, 1):
        ref["tag"] = f"<Video {index}>"
        ref["connection"] = f"ref_video_{index - 1}"

    video_position = {ref["id"]: index for index, ref in enumerate(videos)}
    paired_by_video: dict[str, dict[str, Any]] = {}
    standalone: list[dict[str, Any]] = []
    for video in videos:
        if video["mediaMode"] == "video_audio":
            paired_by_video[video["id"]] = video
    for ref in audios:
        pair_id = ref.get("pairedVideoId")
        if pair_id and pair_id in video_ids and pair_id not in paired_by_video:
            paired_by_video[pair_id] = ref
        else:
            if pair_id:
                reason = "already has a paired soundtrack" if pair_id in paired_by_video else "is missing or audio-only"
                warnings.append(f"Audio '{ref['name']}' points to a video that {reason} and is treated as standalone.")
                ref["pairedVideoId"] = ""
            standalone.append(ref)

    ordered_audio: list[tuple[dict[str, Any], str]] = []
    for video in videos:
        audio_ref = paired_by_video.get(video["id"])
        if audio_ref is not None:
            ordered_audio.append((audio_ref, video["id"]))
    ordered_audio.extend((ref, "") for ref in sorted(audio_only_videos + standalone, key=lambda item: item["order"]))
    standalone_index = 0
    for index, (ref, pair_id) in enumerate(ordered_audio, 1):
        audio_tag = f"<Audio {index}>"
        if pair_id:
            audio_connection = f"ref_video_audio_{video_position[pair_id]}"
            if ref["type"] == "video":
                ref["audioTag"] = audio_tag
                ref["audioConnection"] = audio_connection
                ref["audioAlias"] = f"{ref['name']}_Audio"
            else:
                ref["tag"] = audio_tag
                ref["connection"] = audio_connection
        else:
            ref["tag"] = audio_tag
            ref["connection"] = f"ref_audio_{standalone_index}"
            standalone_index += 1


def _assign_subject_tags(refs: list[dict[str, Any]]) -> None:
    subjects: dict[str, str] = {}
    for ref in refs:
        ref.pop("subjectTag", None)
        if not ref.get("tag", "").startswith(("<Picture", "<Video")):
            continue
        subject = ref["subject"] or (ref["name"] if ref["purpose"] not in {"composition", "camera", "edit_source"} else "")
        if not subject:
            continue
        key = subject.casefold()
        if key not in subjects:
            subjects[key] = f"<Subject {len(subjects) + 1}>"
        ref["subjectTag"] = subjects[key]


def _speaker_identity(value: str, refs: list[dict[str, Any]]) -> tuple[str, str]:
    speaker = _clean_text(value)
    alias = speaker[1:] if speaker.startswith("@") else speaker
    for ref in refs:
        names = {ref["name"].casefold()}
        if ref.get("subject"):
            names.add(ref["subject"].casefold())
        if alias.casefold() in names and ref.get("subjectTag"):
            return f"subject:{ref['subjectTag']}", ref["subjectTag"]
    return f"voice:{speaker.casefold()}", _replace_aliases(speaker, refs, subject_labels=True) or "The designated speaker"


def _speaker_ids(shots: list[dict[str, Any]], refs: list[dict[str, Any]], warnings: list[str]) -> dict[str, int]:
    result: dict[str, int] = {}
    claimed: dict[int, str] = {}
    for shot in shots:
        inline_source = shot["promptOverride"] if shot["promptOverrideEnabled"] and shot["promptOverride"] else shot["action"]
        inline = _replace_aliases(inline_source, refs, subject_labels=True)
        for subject_tag, speaker_id in re.findall(r"(<Subject\s+\d+>)\s*\(S(\d+)\)", inline, re.IGNORECASE):
            key = f"subject:{subject_tag}"
            requested = int(speaker_id)
            if key in result:
                if result[key] != requested:
                    warnings.append(f"{subject_tag} used multiple speaker IDs; S{result[key]} was kept.")
                continue
            if requested in claimed and claimed[requested] != key:
                assigned = 1
                while assigned in claimed:
                    assigned += 1
                warnings.append(f"Speaker ID S{requested} was assigned to multiple subjects; {subject_tag} was changed to S{assigned}.")
            else:
                assigned = requested
            result[key] = assigned
            claimed[assigned] = key
    events = []
    for shot_index, shot in enumerate(shots):
        if shot["promptOverrideEnabled"] and shot["promptOverride"]:
            continue
        for event_order, (prefix, text_field, speaker_field) in enumerate((("dialogue", "dialogue", "speaker"), ("narration", "narration", "narrator"))):
            if shot[text_field]:
                event_start = shot["start"] if shot[f"{prefix}Start"] == "" else shot[f"{prefix}Start"]
                events.append((event_start, shot_index, event_order, shot[speaker_field]))
    next_id = 1
    for _, _, _, speaker in sorted(events):
        key, _ = _speaker_identity(speaker, refs)
        if key not in result:
            while next_id in claimed:
                next_id += 1
            result[key] = next_id
            claimed[next_id] = key
            next_id += 1
    return result


def _normalize_inline_speaker_ids(text: str, speaker_ids: dict[str, int]) -> str:
    def replace(match: re.Match[str]) -> str:
        subject_tag = match.group(1)
        speaker_id = speaker_ids.get(f"subject:{subject_tag}")
        return f"{subject_tag} (S{speaker_id})" if speaker_id is not None else match.group(0)

    return re.sub(r"(<Subject\s+\d+>)\s*\(S\d+\)", replace, text, flags=re.IGNORECASE)


def _normalize_vocal_timing(raw: dict[str, Any], shot: dict[str, Any], prefix: str, shot_index: int, warnings: list[str]) -> tuple[float | str, float | str]:
    start_key = f"{prefix}Start"
    end_key = f"{prefix}End"
    snake_prefix = prefix.lower()
    raw_start = raw.get(start_key, raw.get(f"{snake_prefix}_start", ""))
    raw_end = raw.get(end_key, raw.get(f"{snake_prefix}_end", ""))
    start = "" if raw_start in (None, "") else round(min(shot["end"], max(shot["start"], _float(raw_start, shot["start"]))), 3)
    end = "" if raw_end in (None, "") else round(min(shot["end"], max(shot["start"], _float(raw_end, shot["end"]))), 3)
    if start != "" and abs(start - _float(raw_start, start)) > 0.001:
        warnings.append(f"Shot {shot_index} {prefix} start was clamped to the shot range.")
    if end != "" and abs(end - _float(raw_end, end)) > 0.001:
        warnings.append(f"Shot {shot_index} {prefix} end was clamped to the shot range.")
    effective_start = shot["start"] if start == "" else start
    effective_end = shot["end"] if end == "" else end
    if effective_end <= effective_start:
        warnings.append(f"Shot {shot_index} {prefix} timing has start >= end; the full shot range was used.")
        return "", ""
    return start, end


def _normalize_shots(data: dict[str, Any], duration: float, refs: list[dict[str, Any]], warnings: list[str]) -> list[dict[str, Any]]:
    shots: list[dict[str, Any]] = []
    ref_ids = {ref["id"] for ref in refs}
    fields = (
        "title", "shotType", "lens", "depth", "camera", "cameraAngle", "composition", "lighting", "motionPace", "subjects", "action", "expression",
        "dialogue", "speaker", "voice", "language", "narration", "narrator", "narrationVoice", "narrationLanguage",
        "ambience", "music", "sfx", "transition", "continuity", "promptOverride",
        "shotRelation", "focusMode", "focusTarget", "cameraSpeed", "cameraAmplitude", "cameraStability", "cameraTarget", "transitionOut",
    )
    for index, raw in enumerate(data.get("shots", []), 1):
        if not isinstance(raw, dict):
            warnings.append(f"Shot {index} was not an object and was ignored.")
            continue
        start = max(0.0, _float(raw.get("start"), 0.0))
        end = min(duration, _float(raw.get("end"), duration))
        if end <= start:
            warnings.append(f"Shot {index} has start >= end and was ignored.")
            continue
        explicit_refs = raw.get("referenceIds", [])
        if not isinstance(explicit_refs, list):
            explicit_refs = []
        unknown = [str(ref_id) for ref_id in explicit_refs if ref_id not in ref_ids]
        if unknown:
            warnings.append(f"Shot {index} names missing reference ids: {', '.join(unknown)}.")
        shot = {
            "id": _clean_text(raw.get("id")) or f"shot_{index}",
            "start": round(start, 3),
            "end": round(end, 3),
            "referenceIds": [ref_id for ref_id in explicit_refs if ref_id in ref_ids],
        }
        shot.update({field: _clean_multiline(raw.get(field)) for field in fields})
        shot["cameraAuto"] = raw.get("cameraAuto", raw.get("camera_auto", False)) is True
        shot["audioAuto"] = raw.get("audioAuto", raw.get("audio_auto", False)) is True
        shot["transitionAuto"] = raw.get("transitionAuto", raw.get("transition_auto", False)) is True
        shot["promptOverrideEnabled"] = raw.get("promptOverrideEnabled", raw.get("prompt_override_enabled", False)) is True
        override_source = shot["promptOverride"] if shot["promptOverrideEnabled"] and shot["promptOverride"] else shot["action"]
        if shot["promptOverrideEnabled"] and not shot["promptOverride"]:
            warnings.append(f"Shot {index} enables external prompt override but the override is empty; Director fields were used instead.")
        if shot["promptOverrideEnabled"] and shot["promptOverride"]:
            leading_shot = re.match(r"^\s*\[Shot\s+(\d+)\]", shot["promptOverride"], re.IGNORECASE)
            if leading_shot and int(leading_shot.group(1)) != index:
                warnings.append(f"Shot {index} override used [Shot {leading_shot.group(1)}]; the compiler corrected it to [Shot {index}].")
            if re.search(r"^(subject_definitions|summary|retention_analysis|detailed_description|overall_soundscape|non_diegetic_music):", shot["promptOverride"], re.IGNORECASE | re.MULTILINE):
                warnings.append(f"Shot {index} override contains full Ref2VA section headings; enter only this Shot's body text.")
        if re.search(r"<d>\s*\[[^\]]+\].*?</d>", override_source, re.IGNORECASE | re.DOTALL) and not re.search(r"\(S\d+\).*?<d>", override_source, re.IGNORECASE | re.DOTALL):
            warnings.append(f"Shot {index} contains inline dialogue without a preceding stable (Sx) speaker ID.")
        direction_overrides = raw.get("directionOverrides", raw.get("direction_overrides", {}))
        if not isinstance(direction_overrides, dict):
            direction_overrides = {}
        shot["directionMode"] = "custom" if raw.get("directionMode", raw.get("direction_mode")) == "custom" else "inherit"
        shot["directionOverrides"] = {
            field: _clean_multiline(direction_overrides.get(field))
            for field in _default_global()
            if field in direction_overrides
        }
        shot["language"] = "Chinese" if shot["language"] in ("", "Mandarin Chinese") else shot["language"]
        shot["narrationLanguage"] = "Chinese" if shot["narrationLanguage"] in ("", "Mandarin Chinese") else shot["narrationLanguage"]
        shot["dialogueStart"], shot["dialogueEnd"] = _normalize_vocal_timing(raw, shot, "dialogue", index, warnings)
        shot["narrationStart"], shot["narrationEnd"] = _normalize_vocal_timing(raw, shot, "narration", index, warnings)
        shot["cutoff"] = raw.get("cutoff", False) is True
        shot["narrationCutoff"] = raw.get("narrationCutoff", raw.get("narration_cutoff", False)) is True
        if raw.get("voiceover", False) is True and not shot["narration"]:
            shot["narration"] = shot["dialogue"]
            shot["narrator"] = shot["speaker"]
            shot["narrationVoice"] = shot["voice"]
            shot["narrationLanguage"] = shot["language"]
            shot["narrationStart"] = shot["dialogueStart"]
            shot["narrationEnd"] = shot["dialogueEnd"]
            shot["narrationCutoff"] = shot["cutoff"]
            shot["dialogue"] = ""
            shot["speaker"] = ""
            shot["voice"] = ""
            shot["dialogueStart"] = ""
            shot["dialogueEnd"] = ""
            shot["cutoff"] = False
        shots.append(shot)
    shots.sort(key=lambda shot: (shot["start"], shot["end"]))
    if shots and shots[0]["start"] > 0.01:
        warnings.append(f"The shot plan starts at {shots[0]['start']:g}s, leaving an opening gap.")
    for previous, current in zip(shots, shots[1:]):
        if current["start"] < previous["end"] - 0.01:
            warnings.append(f"Shots '{previous['id']}' and '{current['id']}' overlap.")
        elif current["start"] > previous["end"] + 0.01:
            warnings.append(f"There is a timeline gap before shot '{current['id']}'.")
    if shots and shots[-1]["end"] < duration - 0.01:
        warnings.append(f"The shot plan ends at {shots[-1]['end']:g}s, before the {duration:g}s output ends.")
    return shots


def _validate_limits(refs: list[dict[str, Any]], duration: float, frame_count: int, warnings: list[str]) -> None:
    counts = {
        "image": sum(ref.get("tag", "").startswith("<Picture") for ref in refs),
        "video": sum(ref.get("tag", "").startswith("<Video") for ref in refs),
        "audio": sum(ref.get("tag", "").startswith("<Audio") for ref in refs) + sum(bool(ref.get("audioTag")) for ref in refs),
    }
    if counts["image"] > MAX_IMAGES:
        warnings.append(f"Too many images: {counts['image']} (H3 maximum {MAX_IMAGES}).")
    if counts["video"] > MAX_VIDEOS:
        warnings.append(f"Too many videos: {counts['video']} (H3 maximum {MAX_VIDEOS}).")
    if counts["audio"] > MAX_AUDIOS:
        warnings.append(f"Too many audio references: {counts['audio']} (H3 maximum {MAX_AUDIOS}).")
    file_count = sum(
        bool(ref.get("sourcePath"))
        + bool(ref["type"] == "video" and ref["mediaMode"] == "video_audio" and ref.get("attachedAudioPath"))
        for ref in refs
    )
    if file_count > MAX_FILES:
        warnings.append(f"Too many reference files: {file_count} (recommended H3 maximum {MAX_FILES}).")
    if not refs:
        warnings.append("Ref2VA needs at least one prompt-referenced visual asset; mention an uploaded picture or video with its @alias.")
    if refs and counts["image"] + counts["video"] == 0:
        warnings.append("Audio cannot be the only reference; add at least one picture or video.")
    for ref in refs:
        if not ref.get("sourcePath"):
            warnings.append(f"Prompt-referenced asset '@{ref['name']}' has no uploaded {ref['type']} file.")
    if not MIN_DURATION <= duration <= MAX_DURATION:
        warnings.append(f"Output duration {duration:g}s is outside H3's recommended {MIN_DURATION:g}-{MAX_DURATION:g}s range.")
    actual_duration = frame_count / FPS
    if abs(actual_duration - duration) >= 0.25:
        warnings.append(f"H3 length snaps {duration:g}s to {frame_count} frames ({actual_duration:.3f}s) on its 17k+5 frame grid.")
    videos = [ref for ref in refs if ref.get("tag", "").startswith("<Video")]
    total_video = 0.0
    for ref in videos:
        seconds = ref["duration"]
        if seconds <= 0:
            warnings.append(f"Video '{ref['name']}' has no duration metadata; validate its connected frame batch manually.")
            continue
        total_video += seconds
        if not MIN_VIDEO_DURATION <= seconds <= MAX_VIDEO_DURATION:
            warnings.append(f"Video '{ref['name']}' is {seconds:g}s; recommended range is {MIN_VIDEO_DURATION:g}-{MAX_VIDEO_DURATION:g}s.")
    if total_video > MAX_VIDEO_DURATION:
        warnings.append(f"Reference videos total {total_video:g}s (recommended H3 maximum {MAX_VIDEO_DURATION:g}s).")
    audio_refs = [ref for ref in refs if ref.get("tag", "").startswith("<Audio") or ref.get("audioTag")]
    total_audio = sum(ref["duration"] for ref in audio_refs if ref["duration"] > 0)
    if total_audio > MAX_VIDEO_DURATION:
        warnings.append(f"Reference audio totals {total_audio:g}s (recommended H3 maximum {MAX_VIDEO_DURATION:g}s).")


def _replace_aliases(text: str, refs: list[dict[str, Any]], subject_labels: bool = False) -> str:
    for ref in sorted((item for item in refs if item.get("audioTag")), key=lambda item: len(item["name"]), reverse=True):
        pattern = re.compile(r"(?<![A-Za-z0-9_])@" + re.escape(ref["audioAlias"]) + r"(?![A-Za-z0-9_-])", re.IGNORECASE)
        text = pattern.sub(ref["audioTag"], text)
    for ref in sorted(refs, key=lambda item: len(item["name"]), reverse=True):
        pattern = re.compile(r"(?<![A-Za-z0-9_])@" + re.escape(ref["name"]) + r"(?![A-Za-z0-9_-])", re.IGNORECASE)
        replacement = ref.get("subjectTag", ref["tag"]) if subject_labels else ref["tag"]
        text = pattern.sub(replacement, text)
    return text


def _effective_prompt_sources(base_prompt: str, global_data: dict[str, str], shots: list[dict[str, Any]]) -> list[str]:
    sources = [base_prompt, *global_data.values()]

    for shot in shots:
        sources.extend(_shot_prompt_sources(shot))
    return [str(source) for source in sources if source]


def _shot_prompt_sources(shot: dict[str, Any]) -> list[str]:
    sources: list[str] = []
    visual_fields = ("title", "subjects", "action", "expression")
    camera_fields = ("shotType", "lens", "depth", "camera", "cameraAngle", "composition", "lighting", "motionPace", "shotRelation", "focusMode", "focusTarget", "cameraSpeed", "cameraAmplitude", "cameraStability", "cameraTarget")
    if shot["promptOverrideEnabled"] and shot["promptOverride"]:
        return [shot["title"], shot["promptOverride"]]
    sources.extend(shot[field] for field in visual_fields)
    if not shot["cameraAuto"]:
        sources.extend(shot[field] for field in camera_fields)
    if shot["dialogue"]:
        sources.extend((shot["speaker"], shot["voice"], shot["dialogue"]))
    if shot["narration"]:
        sources.extend((shot["narrator"], shot["narrationVoice"], shot["narration"]))
    if not shot["audioAuto"]:
        sources.extend((shot["ambience"], shot["music"], shot["sfx"]))
    if shot["continuity"]:
        sources.append(shot["continuity"])
    if not shot["transitionAuto"] and shot["transition"]:
        sources.append(shot["transition"])
    if not shot["transitionAuto"] and shot["transitionOut"]:
        sources.append(shot["transitionOut"])
    if shot["directionMode"] == "custom":
        sources.extend(shot["directionOverrides"].values())
    return [str(source) for source in sources if source]


def _filter_prompt_references(refs: list[dict[str, Any]], sources: list[str]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    used_ids: set[str] = set()
    pending_sources = list(sources)
    while pending_sources:
        text = "\n".join(pending_sources)
        pending_sources = []
        for ref in refs:
            if ref["id"] in used_ids:
                continue
            aliases = [ref["name"]]
            if ref["type"] == "video" and ref["mediaMode"] == "video_audio":
                aliases.append(f"{ref['name']}_Audio")
            if not any(re.search(r"(?<![A-Za-z0-9_])@" + re.escape(alias) + r"(?![A-Za-z0-9_-])", text, re.IGNORECASE) for alias in aliases):
                continue
            used_ids.add(ref["id"])
            pending_sources.extend(str(ref.get(field, "")) for field in ("subject", "description", "notes", "audioNotes", "speakerDescription") if ref.get(field))
    return (
        [ref for ref in refs if ref["id"] in used_ids],
        [ref for ref in refs if ref["id"] not in used_ids],
    )


def _shot_active_refs(shot: dict[str, Any], refs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if "activeReferenceIds" in shot:
        selected = set(shot["activeReferenceIds"])
        return [ref for ref in refs if ref["id"] in selected]
    if shot["referenceIds"]:
        selected = set(shot["referenceIds"])
        return [ref for ref in refs if ref["id"] in selected]
    return [ref for ref in refs if ref["start"] < shot["end"] and ref["end"] > shot["start"]]


def _timestamp(seconds: float) -> str:
    minutes = int(seconds // 60)
    remainder = seconds - minutes * 60
    return f"{minutes:02d}:{remainder:06.3f}"


def _shot_voice_cues(shot: dict[str, Any], field: str, speaker_key: str, active: list[dict[str, Any]], refs: list[dict[str, Any]]) -> str:
    cues = []
    if shot[field]:
        cues.append(_replace_aliases(shot[field], refs))
    for ref in active:
        audio_tag = ref.get("audioTag", ref.get("tag", ""))
        if not audio_tag.startswith("<Audio") or _audio_speaker_key(ref, refs) != speaker_key:
            continue
        relation = "reusing" if ref.get("audioMode") == "reuse" else "referencing"
        cues.append(f"{relation} {audio_tag} for {_audio_roles_phrase(ref)}")
    return "; ".join(dict.fromkeys(cues))


def _vocal_time_range(shot: dict[str, Any], prefix: str) -> tuple[float, float, str]:
    start_value = shot[f"{prefix}Start"]
    end_value = shot[f"{prefix}End"]
    start = shot["start"] if start_value == "" else start_value
    end = shot["end"] if end_value == "" else end_value
    return start, end, f"{_timestamp(start)}-{_timestamp(end)}"


def _shot_sentence(index: int, shot: dict[str, Any], refs: list[dict[str, Any]], compact: bool, speaker_ids: dict[str, int]) -> str:
    title = shot["title"] or "a new composition"
    if index == 1:
        label = f"[Shot {index}]" + (f" {shot['title']}" if shot["title"] else "")
    elif shot["transitionAuto"]:
        label = f"[Shot {index}] At {_timestamp(shot['start'])}, the model designs the transition into {title}"
    elif shot["transition"]:
        transition = _replace_aliases(shot["transition"], refs)
        if transition.casefold() in {"cut", "direct cut", "hard cut"}:
            label = f"[Shot {index}] At {_timestamp(shot['start'])}, the shot cuts to {title}"
        else:
            label = f"[Shot {index}] At {_timestamp(shot['start'])}, the shot transitions via {transition} to {title}"
    else:
        label = f"[Shot {index}] At {_timestamp(shot['start'])}, {title} begins"
    if shot["promptOverrideEnabled"] and shot["promptOverride"]:
        override = _normalize_inline_speaker_ids(
            _replace_aliases(shot["promptOverride"], refs, subject_labels=True), speaker_ids,
        ).strip()
        override = re.sub(
            r"^\[Shot(?:\s+\d+)?\](?:\s+At\s+\d{2}:\d{2}\.\d{3},?)?\s*",
            "",
            override,
            count=1,
            flags=re.IGNORECASE,
        )
        return f"{label}. {override}" if override else label + "."
    visual = []
    if shot["cameraAuto"]:
        visual.append("The model designs the shot scale, lens, depth of field, camera movement, angle, composition, lighting, and motion pace to best serve the action")
    for key in (() if shot["cameraAuto"] else ("shotType", "lens", "depth", "camera", "cameraAngle", "composition", "lighting", "motionPace", "shotRelation", "focusMode", "focusTarget", "cameraSpeed", "cameraAmplitude", "cameraStability", "cameraTarget")):
        if shot[key]:
            prefix = {"focusTarget": "Focus on ", "cameraTarget": "The camera follows "}.get(key, "")
            visual.append(prefix + _normalize_inline_speaker_ids(_replace_aliases(shot[key], refs, subject_labels=True), speaker_ids))
    for key in ("subjects", "action", "expression"):
        if shot[key]:
            visual.append(_normalize_inline_speaker_ids(_replace_aliases(shot[key], refs, subject_labels=True), speaker_ids))
    parts = [label]
    if not shot["transitionAuto"] and shot["transitionOut"]:
        visual.append("At the end of this shot: " + _replace_aliases(shot["transitionOut"], refs, subject_labels=True))
    if visual:
        parts.append("; ".join(visual))
    if shot["directionMode"] == "custom":
        labels = {
            "format": "format", "scene": "scene/world", "visualStyle": "visual style",
            "characterRules": "identity/subject rules", "cameraRules": "camera rules",
            "continuity": "continuity bible", "avoid": "avoid",
        }
        overrides = [
            f"{labels[field]}: {_replace_aliases(value, refs, subject_labels=True)}"
            for field, value in shot["directionOverrides"].items()
            if field in labels and value
        ]
        if overrides:
            parts.append("Shot-specific director override — " + "; ".join(overrides))
    active = _shot_active_refs(shot, refs)
    if active:
        labels = []
        for ref in active:
            label_tag = ref.get("subjectTag", ref["tag"])
            if label_tag not in labels:
                labels.append(label_tag)
            if ref.get("frameRole", "reference") != "reference" and ref.get("tag", "").startswith(("<Picture", "<Video")) and ref["tag"] not in labels:
                labels.append(ref["tag"])
            audio_tag = ref.get("audioTag") or (ref.get("tag") if ref.get("tag", "").startswith("<Audio") else "")
            if audio_tag and audio_tag not in labels:
                labels.append(audio_tag)
        parts.append("Reference guidance active in this shot: " + ", ".join(labels))
    inline_dialogue = bool(re.search(
        r"<d>.*?</d>|[\"“‘「『]|\b(?:say|says|said|speak|speaks|speaking|whisper|whispers|shout|shouts|sing|sings|dialogue|voiceover|narration)\b|说|问|回答|喊|低语|对白|台词|旁白|唱",
        shot["action"], re.IGNORECASE | re.DOTALL,
    ))
    vocal_parts = []
    if shot["dialogue"]:
        dialogue_start, _, dialogue_range = _vocal_time_range(shot, "dialogue")
        speaker_key, speaker = _speaker_identity(shot["speaker"], refs)
        dialogue = _replace_aliases(shot["dialogue"], refs)
        speaker_id = speaker_ids[speaker_key]
        language = shot["language"] or "Original language"
        cutoff = " <cutoff>" if shot["cutoff"] else ""
        voice_cues = _shot_voice_cues(shot, "voice", speaker_key, active, refs)
        voice = f" Voice: {voice_cues}." if voice_cues else ""
        vocal_parts.append((dialogue_start, 0,
            f'Only during {dialogue_range}, {speaker} (S{speaker_id}) says the on-screen dialogue exactly once: '
            f'<d>[{language}] {dialogue}</d>{cutoff} with precise natural lip sync; do not begin before '
            f'{_timestamp(dialogue_start)} and do not add, repeat, paraphrase, or improvise any spoken words; '
            f'no other on-screen subject speaks.{voice}'
        ))
    if shot["narration"]:
        narration_start, _, narration_range = _vocal_time_range(shot, "narration")
        narrator_key, narrator = _speaker_identity(shot["narrator"], refs)
        narration = _replace_aliases(shot["narration"], refs)
        narrator_id = speaker_ids[narrator_key]
        language = shot["narrationLanguage"] or "Original language"
        cutoff = " <cutoff>" if shot["narrationCutoff"] else ""
        voice_cues = _shot_voice_cues(shot, "narrationVoice", narrator_key, active, refs)
        voice = f" Voice: {voice_cues}." if voice_cues else ""
        has_on_screen_dialogue = bool(shot["dialogue"] or inline_dialogue)
        closed_lips = "every visible subject other than the designated on-screen speakers keeps their lips closed during the narration" if has_on_screen_dialogue else "every visible subject keeps their lips closed during the narration"
        vocal_parts.append((narration_start, 1,
            f'Only during {narration_range}, {narrator} (S{narrator_id}) says in an off-screen voiceover exactly once: '
            f'<d>[{language}] {narration}</d>{cutoff} while {closed_lips}; '
            f'do not begin before {_timestamp(narration_start)} and do not add, repeat, paraphrase, or improvise any spoken words.{voice}'
        ))
    parts.extend(sentence for _, _, sentence in sorted(vocal_parts))
    vocal_events = len(vocal_parts)
    if vocal_events or inline_dialogue:
        if inline_dialogue and vocal_events:
            allowed_vocals = "inline dialogue and narration event"
        elif inline_dialogue:
            allowed_vocals = "inline dialogue"
        else:
            allowed_vocals = "dialogue and narration events" if vocal_events == 2 else "vocal event"
        parts.append(f"Only the designated {allowed_vocals} may be heard; no additional speech is allowed")
    else:
        reused_vocals = []
        for ref in active:
            audio_tag = ref.get("audioTag", ref.get("tag", ""))
            roles = set(ref.get("audioRoles", []))
            if audio_tag.startswith("<Audio") and ref.get("audioMode") == "reuse" and roles.intersection({"complete_soundtrack", "dialogue_content", "lyrics"}):
                reused_vocals.append(audio_tag)
        if reused_vocals:
            parts.append(
                "No independently generated subject, narrator, or voiceover speaks in this shot; only verbal content already contained in the directly reused "
                + ", ".join(dict.fromkeys(reused_vocals)) + " may remain audible"
            )
        else:
            parts.append("Speech is forbidden throughout this shot: no dialogue, voiceover, muttering, babble, singing, or other human vocalization")
    if shot["audioAuto"]:
        parts.append("The model designs the non-vocal ambience, music, and sound effects to best support the shot")
    else:
        audio = []
        for name, key in (("Ambience", "ambience"), ("Music", "music"), ("SFX", "sfx")):
            value = _replace_aliases(shot[key], refs) if shot[key] else "none (silent)"
            audio.append(f"{name}: {value}")
        parts.append("; ".join(audio))
    if shot["continuity"] and not compact:
        parts.append("Continuity: " + _replace_aliases(shot["continuity"], refs))
    return ". ".join(part.rstrip(". ") for part in parts if part) + "."


def _audio_roles_phrase(ref: dict[str, Any]) -> str:
    labels = {
        "complete_soundtrack": "complete soundtrack",
        "voice_timbre": "voice-timbre",
        "voice_delivery": "vocal-delivery",
        "dialogue_content": "dialogue content",
        "lyrics": "lyric content",
        "music_style": "background-music style",
        "beat_rhythm": "beat/rhythm",
        "sound_effect": "sound-effect texture",
        "audio_continuity": "audio continuity",
    }
    roles = [labels[role] for role in ref.get("audioRoles", []) if role in labels]
    if not roles:
        roles = [PURPOSE_LABELS.get(ref["purpose"], "audio characteristics")]
    if len(roles) == 1:
        return roles[0]
    if len(roles) == 2:
        return f"{roles[0]} and {roles[1]}"
    return ", ".join(roles[:-1]) + f", and {roles[-1]}"


def _audio_target(ref: dict[str, Any], refs: list[dict[str, Any]], speaker_ids: dict[str, int]) -> str:
    target_ref = next((item for item in refs if item["id"] == ref.get("speakerRefId", "") and item.get("subjectTag")), None)
    if target_ref is not None:
        key = f"subject:{target_ref['subjectTag']}"
        speaker_id = speaker_ids.get(key)
        return f"{target_ref['subjectTag']} (S{speaker_id})" if speaker_id else target_ref["subjectTag"]
    description = ref.get("speakerDescription", "")
    if description:
        speaker_id = speaker_ids.get(f"voice:{description.casefold()}")
        return f"{description} (S{speaker_id})" if speaker_id else description
    return ""


def _audio_speaker_key(ref: dict[str, Any], refs: list[dict[str, Any]]) -> str:
    target_ref = next((item for item in refs if item["id"] == ref.get("speakerRefId", "") and item.get("subjectTag")), None)
    if target_ref is not None:
        return f"subject:{target_ref['subjectTag']}"
    if ref.get("speakerDescription"):
        return f"voice:{ref['speakerDescription'].casefold()}"
    return ""


def _audio_definition(ref: dict[str, Any], refs: list[dict[str, Any]], speaker_ids: dict[str, int]) -> str:
    tag = ref.get("audioTag", ref.get("tag", ""))
    roles = _audio_roles_phrase(ref)
    target = _audio_target(ref, refs, speaker_ids)
    if ref.get("audioMode") == "reuse":
        line = f"{tag} is an audio asset reused in full or in part for its {roles}"
        if target:
            line += f" for {target}"
    else:
        line = f"{tag} is the {roles} reference"
        if target:
            line += f" for {target}"
    notes = _replace_aliases(ref.get("audioNotes") or (ref.get("notes", "") if ref["type"] == "audio" else ""), refs, subject_labels=True)
    if notes:
        line += f"; {notes.rstrip('. ')}"
    return line + "."


def _subject_definitions(refs: list[dict[str, Any]], speaker_ids: dict[str, int], shots: list[dict[str, Any]]) -> str:
    grouped: dict[str, list[dict[str, Any]]] = {}
    labels: dict[str, str] = {}
    for ref in refs:
        tag = ref.get("subjectTag")
        if not tag:
            continue
        grouped.setdefault(tag, []).append(ref)
        labels.setdefault(tag, ref["subject"] or ref["name"])
    lines = []
    for tag, subject_refs in grouped.items():
        sources = []
        for ref in subject_refs:
            source = f"{ref['tag']} provides {PURPOSE_LABELS[ref['purpose']]}"
            description = _replace_aliases(ref["description"], refs, subject_labels=True)
            if description:
                source += f", showing {description.rstrip('. ')}"
            sources.append(source)
        lines.append(f"{tag} is {labels[tag]}; " + "; ".join(sources) + ".")
    for ref in refs:
        tag = ref.get("tag", "")
        description = _replace_aliases(ref["description"], refs, subject_labels=True)
        detail = f" It shows {description.rstrip('. ')}." if description else ""
        shot_numbers = [index for index, shot in enumerate(shots, 1) if ref["id"] in {item["id"] for item in _shot_active_refs(shot, refs)}]
        shot_labels = ", ".join(f"[Shot {index}]" for index in shot_numbers)
        frame_role = ref.get("frameRole", "reference")
        if tag.startswith("<Picture") and frame_role == "first_frame":
            shot_label = f"[Shot {shot_numbers[0]}]" if shot_numbers else "[Shot 1]"
            lines.append(f"{tag} is the first frame of {shot_label}.{detail}")
        elif tag.startswith("<Picture") and frame_role == "last_frame":
            shot_label = f"[Shot {shot_numbers[-1]}]" if shot_numbers else f"[Shot {max(1, len(shots))}]"
            lines.append(f"{tag} is the last frame of {shot_label}.{detail}")
        elif tag.startswith("<Picture") and frame_role == "keyframe":
            where = f" in {shot_labels}" if shot_labels else ""
            lines.append(f"{tag} is a concrete keyframe anchor{where} at {_timestamp(ref['start'])}.{detail}")
        elif tag.startswith("<Picture") and frame_role == "storyboard":
            where = f" for {shot_labels}" if shot_labels else " for the target video"
            lines.append(f"{tag} is a storyboard reference{where}, defining viewpoint, subject placement, and shot order.{detail}")
        elif tag.startswith("<Picture") and not ref.get("subjectTag"):
            lines.append(f"{tag} is a concrete frame or composition anchor named @{ref['name']}.{detail}")
        elif tag.startswith("<Video") and frame_role == "edit_source":
            lines.append(f"{tag} is the source video for the target video edit.{detail}")
        elif tag.startswith("<Video") and frame_role == "continuation_source":
            lines.append(f"{tag} is the source video whose ending state is continued by the target video.{detail}")
        elif tag.startswith("<Video") and frame_role == "storyboard":
            lines.append(f"{tag} provides the target video's camera, cut, rhythm, and temporal-structure guidance.{detail}")
        elif tag.startswith("<Video") and not ref.get("subjectTag"):
            lines.append(f"{tag} is the source for {PURPOSE_LABELS[ref['purpose']]} guidance named @{ref['name']}.{detail}")
    audio_refs = [ref for ref in refs if ref.get("audioTag") or ref.get("tag", "").startswith("<Audio")]
    lines.extend(_audio_definition(ref, refs, speaker_ids) for ref in audio_refs)
    return "\n".join(lines)


def _task_prefixes(refs: list[dict[str, Any]]) -> str:
    tasks = []
    if any(ref["type"] == "video" and ref.get("frameRole") == "edit_source" for ref in refs):
        tasks.append("[video editing]")
    if any(ref["type"] == "video" and ref.get("frameRole") == "continuation_source" for ref in refs):
        tasks.append("[video continuation]")
    if any(ref.get("tag", "").startswith("<Picture") and ref.get("frameRole") in {"first_frame", "keyframe", "last_frame"} for ref in refs):
        tasks.append("[keyframe completion]")
    if any(ref.get("tag", "").startswith(("<Picture", "<Video")) and ref.get("frameRole") not in {"edit_source", "continuation_source"} for ref in refs):
        tasks.append("[reference generation]")
    audio_refs = [ref for ref in refs if ref.get("audioTag") or ref.get("tag", "").startswith("<Audio")]
    if any(ref.get("audioMode") == "reuse" for ref in audio_refs):
        tasks.append("[audio reuse]")
    if any(ref.get("audioMode") == "reference" for ref in audio_refs):
        tasks.append("[audio reference]")
    return "[" + " + ".join(task.strip("[]") for task in tasks) + "]" if tasks else "[reference generation]"


def _retention_marker(ref: dict[str, Any], audio: bool = False) -> str:
    if audio:
        if ref.get("audioRetention", "auto") != "auto":
            return ref["audioRetention"]
        if ref.get("audioMode") == "reuse":
            return "fully_copy" if ref["fidelity"] == "strict" and "complete_soundtrack" in ref.get("audioRoles", []) else "partially_copy"
        return "weak_reference" if ref["fidelity"] == "loose" else "reference"
    if ref["retention"] != "auto":
        return ref["retention"]
    if ref["mode"] in {"borrow", "match", "transform", "replace"}:
        return "attribute_transfer"
    if ref["fidelity"] == "strict" and ref["mode"] == "preserve":
        return "fully_preserved"
    if ref["fidelity"] == "loose" or ref["mode"] == "inspire":
        return "weak_reference"
    return "partially_preserved"


def _retention_analysis(refs: list[dict[str, Any]], shots: list[dict[str, Any]]) -> str:
    lines = []
    subject_groups: dict[str, list[dict[str, Any]]] = {}
    for ref in refs:
        if ref.get("subjectTag"):
            subject_groups.setdefault(ref["subjectTag"], []).append(ref)
    for subject_tag, subject_refs in subject_groups.items():
        appearances = []
        subject_ids = {ref["id"] for ref in subject_refs}
        for index, shot in enumerate(shots, 1):
            if subject_ids.intersection(ref["id"] for ref in _shot_active_refs(shot, refs)):
                appearances.append(f"[Shot {index}]")
        where = f" (appears in {', '.join(appearances)})" if appearances else ""
        marker = _retention_marker(subject_refs[0])
        explanations = [(_replace_aliases(ref["notes"], refs, subject_labels=True) or PURPOSE_LABELS[ref["purpose"]]).rstrip(". ") for ref in subject_refs]
        lines.append(f"{subject_tag}{where}: {marker} - " + "; ".join(dict.fromkeys(explanations)) + ".")
    for ref in refs:
        tag = ref.get("tag", "")
        if tag.startswith(("<Picture", "<Video")) and (not ref.get("subjectTag") or ref.get("frameRole", "reference") != "reference"):
            explanation = (_replace_aliases(ref["notes"], refs, subject_labels=True) or PURPOSE_LABELS[ref["purpose"]]).rstrip(". ")
            lines.append(f"{tag}: {_retention_marker(ref)} - {explanation}.")
    for ref in refs:
        audio_tag = ref.get("audioTag", ref.get("tag", ""))
        if not audio_tag.startswith("<Audio"):
            continue
        roles = _audio_roles_phrase(ref)
        marker = _retention_marker(ref, audio=True)
        if ref.get("audioMode") == "reuse":
            explanation = f"the source signal is reused in full or in part for its {roles}"
        else:
            explanation = f"only its {roles} guides the target audio without directly copying the source signal"
        target_ref = next((item for item in refs if item["id"] == ref.get("speakerRefId") and item.get("subjectTag")), None)
        if target_ref is not None:
            explanation += f" for {target_ref['subjectTag']}"
        elif ref.get("speakerDescription"):
            explanation += f" for {ref['speakerDescription']}"
        lines.append(f"{audio_tag}: {marker} - {explanation}.")
    return "\n".join(lines)


def compile_director(base_prompt: str, duration: float, director_data: Any) -> tuple[str, str, str, str, int]:
    warnings: list[str] = []
    duration = max(0.01, _float(duration, 5.0))
    data, parse_warnings = _parse_data(director_data, duration)
    warnings.extend(parse_warnings)
    settings = _normalize_settings(data)
    global_data = _normalize_global(data)
    all_refs = _normalize_references(data, duration, warnings)
    shots = _normalize_shots(data, duration, all_refs, warnings)
    scoped_fields = {field for shot in shots if shot["directionMode"] == "custom"
                     for field in shot["directionOverrides"]}
    for shot in shots:
        effective = {field: global_data[field] for field in scoped_fields}
        if shot["directionMode"] == "custom":
            effective.update(shot["directionOverrides"])
        if effective:
            shot["directionMode"] = "custom"
            shot["directionOverrides"] = effective
    global_data = {field: "" if field in scoped_fields else value for field, value in global_data.items()}
    shot_ids = {shot["id"] for shot in shots}
    for ref in all_refs:
        if ref.get("timelinePinned") and ref.get("timelineShotId") and ref["timelineShotId"] not in shot_ids:
            ref["timelinePinned"] = False
            warnings.append(f"Reference '@{ref['name']}' was detached from a deleted Shot and removed from the manual timeline selection.")
    clean_prompt = _clean_multiline(base_prompt)
    refs, unused_refs = _filter_prompt_references(all_refs, _effective_prompt_sources(clean_prompt, global_data, shots))
    used_ref_ids = {ref["id"] for ref in refs}
    global_refs, _ = _filter_prompt_references(refs, [clean_prompt, *global_data.values()])
    global_ref_ids = {ref["id"] for ref in global_refs}
    for shot in shots:
        shot["referenceIds"] = [ref_id for ref_id in shot["referenceIds"] if ref_id in used_ref_ids]
        shot_refs, _ = _filter_prompt_references(refs, _shot_prompt_sources(shot))
        shot_ref_ids = {ref["id"] for ref in shot_refs}
        shot["activeReferenceIds"] = [
            ref["id"] for ref in refs
            if ref["id"] in global_ref_ids
            or ref["id"] in shot["referenceIds"]
            or ref["id"] in shot_ref_ids
        ]
    frame_count = _h3_frame_count(duration)
    _assign_tags(refs, warnings)
    _assign_subject_tags(refs)
    _validate_limits(refs, duration, frame_count, warnings)

    unresolved_source = "\n".join(
        _effective_prompt_sources(clean_prompt, global_data, shots)
        + [str(ref.get(key, "")) for ref in refs for key in ("subject", "description", "notes", "audioNotes", "speakerDescription")]
    )
    replaced_source = _replace_aliases(unresolved_source, refs)
    unresolved = sorted(set(re.findall(r"(?<![\w])@[\w.-]+", replaced_source)))
    if unresolved:
        warnings.append("Unresolved aliases in the plan: " + ", ".join(unresolved) + ".")

    normalized = {
        "version": VERSION,
        "kind": KIND,
        "duration": round(duration, 3),
        "h3FrameCount": frame_count,
        "h3Duration": round(frame_count / FPS, 3),
        "settings": settings,
        "global": global_data,
        "references": refs,
        "shots": shots,
    }
    compact = settings["promptMode"] == "compact"
    speaker_ids = _speaker_ids(shots, refs, warnings)
    for ref in refs:
        if not (ref.get("audioTag") or ref.get("tag", "").startswith("<Audio")):
            continue
        target_ref = next((item for item in refs if item["id"] == ref.get("speakerRefId") and item.get("subjectTag")), None)
        if ref.get("speakerRefId") and target_ref is None:
            warnings.append(f"Audio '{ref['name']}' targets a missing or non-subject visual reference; no speaker ID was attached.")
        elif target_ref is not None and f"subject:{target_ref['subjectTag']}" not in speaker_ids:
            warnings.append(f"Audio '{ref['name']}' targets {target_ref['subjectTag']}, but that subject has no dialogue or narration event; no speaker ID was invented.")
        elif ref.get("speakerDescription") and f"voice:{ref['speakerDescription'].casefold()}" not in speaker_ids:
            warnings.append(f"Audio '{ref['name']}' names speaker '{ref['speakerDescription']}', but no matching dialogue or narration speaker exists; no speaker ID was invented.")

    summary_parts = [_task_prefixes(refs)]
    edit_video = next((ref for ref in refs if ref["type"] == "video" and ref.get("frameRole") == "edit_source"), None)
    continuation_video = next((ref for ref in refs if ref["type"] == "video" and ref.get("frameRole") == "continuation_source"), None)
    if edit_video is not None:
        summary_parts.append(f"The target video is an edited version of {edit_video['tag']}.")
    elif continuation_video is not None:
        summary_parts.append(f"The target video continues from the ending state of {continuation_video['tag']}.")
    if clean_prompt:
        summary_parts.append(_replace_aliases(clean_prompt, refs, subject_labels=True))
    for key in ("format", "scene", "visualStyle"):
        if global_data[key]:
            summary_parts.append(_replace_aliases(global_data[key], refs, subject_labels=True))
    for ref in refs:
        audio_tag = ref.get("audioTag", ref.get("tag", ""))
        if not audio_tag.startswith("<Audio"):
            continue
        relation = "reuses" if ref.get("audioMode") == "reuse" else "references"
        target = _audio_target(ref, refs, speaker_ids)
        target_phrase = f" for {target.rsplit(' (S', 1)[0]}" if target else ""
        summary_parts.append(f"The target video {relation} {audio_tag}'s {_audio_roles_phrase(ref)}{target_phrase}.")
    summary = " ".join(summary_parts)

    opening_lines = []
    if global_data["format"] or global_data["visualStyle"]:
        format_text = _replace_aliases(global_data["format"], refs, subject_labels=True).rstrip(". ")
        style_text = _replace_aliases(global_data["visualStyle"], refs, subject_labels=True).rstrip(". ")
        opening_lines.append(f"The target video uses {format_text}" + (f" with {style_text}" if style_text else "") + ".")
    if global_data["scene"]:
        opening_lines.append(_replace_aliases(global_data["scene"], refs, subject_labels=True).rstrip(". ") + ".")
    detailed_lines = opening_lines
    detailed_lines.extend(_shot_sentence(i, shot, refs, compact, speaker_ids) for i, shot in enumerate(shots, 1))
    if not compact:
        for key in ("characterRules", "cameraRules", "continuity", "avoid"):
            if global_data[key]:
                label = "Avoid" if key == "avoid" else key.replace("Rules", " rules")
                detailed_lines.append(f"{label}: {_replace_aliases(global_data[key], refs)}")
    soundscape = [_replace_aliases(global_data["audioRules"], refs).rstrip(". ") + "."] if global_data["audioRules"] else []
    music = []
    shot_sound: list[str] = []
    shot_music: list[str] = []
    for index, shot in enumerate(shots, 1):
        if shot["promptOverrideEnabled"] and shot["promptOverride"]:
            continue
        if shot["audioAuto"]:
            shot_sound.append(f"Shot {index} uses model-directed non-vocal ambience and physical sound effects")
            shot_music.append(f"Shot {index} uses model-directed music")
        else:
            ambience = _replace_aliases(shot["ambience"], refs) if shot["ambience"] else "no ambience"
            sfx = _replace_aliases(shot["sfx"], refs) if shot["sfx"] else "no sound effects"
            shot_sound.append(f"Shot {index}: {ambience}; {sfx}")
            music_value = _replace_aliases(shot["music"], refs) if shot["music"] else "no music"
            shot_music.append(f"Shot {index}: {music_value}")
        if shot["directionMode"] == "custom":
            audio_override = shot["directionOverrides"].get("audioRules", "")
            music_override = shot["directionOverrides"].get("musicRules", "")
            if audio_override:
                shot_sound.append(f"Shot {index} director override: " + _replace_aliases(audio_override, refs))
            if music_override and music_override.upper() != "N/A" and (shot["audioAuto"] or shot["music"]):
                shot_music.append(f"Shot {index} director override: " + _replace_aliases(music_override, refs))
        if global_data["musicRules"] and global_data["musicRules"].upper() != "N/A" and (shot["audioAuto"] or shot["music"]):
            shot_music.append(f"Shot {index} music direction: " + _replace_aliases(global_data["musicRules"], refs))
    if shot_sound:
        soundscape.append("Shot-specific sound: " + "; ".join(item.rstrip(". ") for item in shot_sound) + ".")
    if shot_music:
        music.append("Shot-specific music: " + "; ".join(item.rstrip(". ") for item in shot_music) + ".")
    referenced_sound: list[str] = []
    referenced_music: list[str] = []
    for ref in refs:
        audio_tag = ref.get("audioTag", ref.get("tag", ""))
        if not audio_tag.startswith("<Audio"):
            continue
        roles = set(ref.get("audioRoles", []))
        relation = "is reused from" if ref.get("audioMode") == "reuse" else "is guided by"
        if roles.intersection({"complete_soundtrack", "sound_effect", "audio_continuity"}):
            referenced_sound.append(f"the ambience and physical-sound layer {relation} {audio_tag} for {_audio_roles_phrase(ref)}")
        if roles.intersection({"complete_soundtrack", "music_style", "beat_rhythm"}):
            referenced_music.append(f"the audience-only music layer {relation} {audio_tag} for {_audio_roles_phrase(ref)}")
    if referenced_sound:
        soundscape.append("Reference audio: " + "; ".join(referenced_sound) + ".")
    if referenced_music:
        music.append("Reference music: " + "; ".join(referenced_music) + ".")
    prompt_parts = [
        "subject_definitions:\n" + (_subject_definitions(refs, speaker_ids, shots) or "No named visual subjects."),
        "summary:\n" + summary,
        "retention_analysis:\n" + (_retention_analysis(refs, shots) or "No reference retention directives."),
        "detailed_description:\n" + ("\n".join(detailed_lines) or summary),
        "overall_soundscape:\n" + (" ".join(soundscape) or "N/A"),
        "non_diegetic_music:\n" + (" ".join(music) or "N/A"),
    ]
    compiled_prompt = "\n\n".join(prompt_parts)
    remaining_aliases = sorted(set(re.findall(r"(?<![\w])@[\w.-]+", compiled_prompt)))
    if remaining_aliases:
        warnings.append("Unresolved aliases in compiled_prompt: " + ", ".join(remaining_aliases) + ".")

    report_lines = [
        "MiniMax H3 token presentation and connection order (prompt tags are 1-based; ComfyUI sockets are 0-based):"
    ]
    images = [ref for ref in refs if ref.get("tag", "").startswith("<Picture")]
    videos = [ref for ref in refs if ref.get("tag", "").startswith("<Video")]
    standalone_audio = [ref for ref in refs if ref.get("tag", "").startswith("<Audio") and ref.get("connection", "").startswith("ref_audio_")]
    presentation_order: list[tuple[dict[str, Any], bool]] = [(ref, False) for ref in images]
    for video_index, video in enumerate(videos):
        paired = next((ref for ref in refs if ref.get("connection") == f"ref_video_audio_{video_index}"), None)
        if video.get("audioTag"):
            presentation_order.append((video, True))
        elif paired is not None:
            presentation_order.append((paired, False))
        presentation_order.append((video, False))
    presentation_order.extend((ref, False) for ref in standalone_audio)
    for ref, audio_side in presentation_order:
        tag = ref["audioTag"] if audio_side else ref["tag"]
        connection = ref["audioConnection"] if audio_side else ref["connection"]
        alias = ref["audioAlias"] if audio_side else ref["name"]
        pair = f"; soundtrack for @{ref['name']}" if audio_side or connection.startswith("ref_video_audio_") else ""
        report_lines.append(
            f"- {tag} = @{alias} [{ref['purpose']}/{ref['mode']}/{ref['fidelity']}] -> MiniMaxH3ReferenceToVideo.{connection}{pair}"
        )
    if not refs:
        report_lines.append("- No references were selected by an effective @alias.")
    if unused_refs:
        report_lines.append("- Excluded because no effective prompt field mentions their @alias: " + ", ".join(f"@{ref['name']}" for ref in unused_refs) + ".")
    counts = {
        "image": sum(ref.get("tag", "").startswith("<Picture") for ref in refs),
        "video": sum(ref.get("tag", "").startswith("<Video") for ref in refs),
        "audio": sum(ref.get("tag", "").startswith("<Audio") for ref in refs) + sum(bool(ref.get("audioTag")) for ref in refs),
    }
    file_count = sum(
        bool(ref.get("sourcePath"))
        + bool(ref["type"] == "video" and ref["mediaMode"] == "video_audio" and ref.get("attachedAudioPath"))
        for ref in refs
    )
    report_lines.append(
        f"Files: {file_count}/{MAX_FILES}; pictures {counts['image']}/{MAX_IMAGES}; videos {counts['video']}/{MAX_VIDEOS}; audio {counts['audio']}/{MAX_AUDIOS}."
    )
    report_lines.append(f"Output: requested {duration:g}s -> connect length={frame_count} ({frame_count / FPS:.3f}s at {FPS} fps).")
    warning_report = "OK - no validation warnings." if not warnings else "\n".join(f"WARNING: {message}" for message in warnings)
    return (
        compiled_prompt,
        json.dumps(normalized, ensure_ascii=False, separators=(",", ":")),
        "\n".join(report_lines),
        warning_report,
        frame_count,
    )


async def lh_minimax_h3_director_preview(request):
    payload = await request.json()
    compiled_prompt, timeline_json, reference_report, warning_report, length = compile_director(
        payload.get("base_prompt", ""), payload.get("duration", 5.0), payload.get("director_data", {}),
    )
    return web.json_response({
        "compiled_prompt": compiled_prompt,
        "timeline_json": timeline_json,
        "reference_report": reference_report,
        "warning_report": warning_report,
        "length": length,
    })


_prompt_server = getattr(server.PromptServer, "instance", None)
if _prompt_server is not None:
    _prompt_server.routes.post("/lh/minimax_h3_director/preview")(lh_minimax_h3_director_preview)


def _resolve_input_path(relative_path: str) -> str:
    import folder_paths

    if not isinstance(relative_path, str) or not relative_path:
        raise ValueError("Reference media path is empty.")
    root = os.path.realpath(folder_paths.get_input_directory())
    candidate = os.path.realpath(os.path.join(root, relative_path))
    if os.path.commonpath((root, candidate)) != root:
        raise ValueError("Reference media path escapes the ComfyUI input directory.")
    if not os.path.isfile(candidate):
        raise ValueError(f"Reference media does not exist: {relative_path}")
    return candidate


def _load_image(path: str) -> torch.Tensor:
    with Image.open(_resolve_input_path(path)) as image:
        array = np.asarray(image.convert("RGB"), dtype=np.float32) / 255.0
    return torch.from_numpy(array).unsqueeze(0)


def _load_audio(path: str, trim_start: float = 0.0, trim_end: float | None = None) -> dict[str, Any]:
    full_path = _resolve_input_path(path)
    try:
        import soundfile as sf

        samples, sample_rate = sf.read(full_path, always_2d=True, dtype="float32")
        waveform = torch.from_numpy(samples.T).unsqueeze(0)
    except ImportError:
        with wave.open(full_path, "rb") as source:
            sample_rate = source.getframerate()
            channels = source.getnchannels()
            sample_width = source.getsampwidth()
            raw = source.readframes(source.getnframes())
        if sample_width != 2:
            raise ValueError("Without soundfile, only 16-bit PCM WAV references are supported.")
        samples = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
        waveform = torch.from_numpy(samples.reshape(-1, channels).T).unsqueeze(0)
    start = int(round(trim_start * sample_rate))
    end = waveform.shape[-1] if trim_end is None else min(waveform.shape[-1], int(round(trim_end * sample_rate)))
    if trim_start < 0 or end <= start:
        raise ValueError(f"Audio trim range is invalid for '{path}'.")
    return {"waveform": waveform[..., start:end], "sample_rate": int(sample_rate)}


def _load_embedded_audio(path: str, trim_start: float = 0.0, trim_end: float | None = None) -> dict[str, Any]:
    try:
        import av
    except ImportError as exc:
        raise RuntimeError("Video audio references require the PyAV package.") from exc
    if trim_start < 0 or (trim_end is not None and trim_end <= trim_start):
        raise ValueError(f"Embedded audio trim range is invalid for '{path}'.")
    container = av.open(_resolve_input_path(path))
    try:
        stream = next((item for item in container.streams if item.type == "audio"), None)
        if stream is None:
            raise ValueError(f"Video contains no audio stream: {path}")
        sample_rate = int(stream.rate or 48000)
        chunks = []
        for frame in container.decode(stream):
            timestamp = float(frame.pts * frame.time_base) if frame.pts is not None else 0.0
            frame_end = timestamp + frame.samples / sample_rate
            if frame_end <= trim_start or (trim_end is not None and timestamp >= trim_end):
                continue
            array = frame.to_ndarray()
            if not frame.format.is_planar:
                array = array.reshape(-1, len(frame.layout.channels)).T
            local_start = max(0, int(round((trim_start - timestamp) * sample_rate)))
            local_end = array.shape[-1] if trim_end is None else min(array.shape[-1], int(round((trim_end - timestamp) * sample_rate)))
            if local_end > local_start:
                chunk = torch.from_numpy(array[:, local_start:local_end]).float()
                if not np.issubdtype(array.dtype, np.floating):
                    chunk /= float(max(abs(np.iinfo(array.dtype).min), np.iinfo(array.dtype).max))
                chunks.append(chunk)
        if not chunks:
            raise ValueError(f"Embedded audio crop produced no samples: {path}")
        return {"waveform": torch.cat(chunks, dim=-1).unsqueeze(0), "sample_rate": sample_rate}
    finally:
        container.close()


def _load_video(path: str, trim_start: float = 0.0, trim_end: float | None = None) -> torch.Tensor:
    try:
        import av
    except ImportError as exc:
        raise RuntimeError("Video references require the PyAV package.") from exc
    if trim_start < 0 or (trim_end is not None and trim_end <= trim_start):
        raise ValueError(f"Video trim range is invalid for '{path}'.")
    container = av.open(_resolve_input_path(path))
    try:
        stream = next((item for item in container.streams if item.type == "video"), None)
        if stream is None:
            raise ValueError(f"File contains no video stream: {path}")
        source_frames: list[torch.Tensor] = []
        source_times: list[float] = []
        for frame in container.decode(stream):
            if frame.pts is None:
                continue
            timestamp = float(frame.pts * frame.time_base)
            if timestamp < trim_start:
                continue
            if trim_end is not None and timestamp >= trim_end:
                break
            source_times.append(timestamp)
            source_frames.append(torch.from_numpy(frame.to_rgb().to_ndarray()).float() / 255.0)
        if not source_frames:
            raise ValueError(f"Video crop produced no frames: {path}")
        end = trim_end if trim_end is not None else source_times[-1] + 1.0 / FPS
        target_times = np.arange(trim_start, end, 1.0 / FPS)
        indices = []
        for timestamp in target_times:
            right = bisect_left(source_times, timestamp)
            if right == 0:
                indices.append(0)
            elif right == len(source_times):
                indices.append(len(source_times) - 1)
            else:
                left = right - 1
                indices.append(left if timestamp - source_times[left] <= source_times[right] - timestamp else right)
        return torch.stack([source_frames[index] for index in indices])
    finally:
        container.close()


def _load_director_media(refs: list[dict[str, Any]]) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any], dict[str, Any]]:
    image_count = sum(ref.get("tag", "").startswith("<Picture") for ref in refs)
    video_count = sum(ref.get("tag", "").startswith("<Video") for ref in refs)
    audio_count = sum(ref.get("tag", "").startswith("<Audio") for ref in refs) + sum(bool(ref.get("audioTag")) for ref in refs)
    file_count = sum(
        bool(ref.get("sourcePath"))
        + bool(ref["type"] == "video" and ref["mediaMode"] == "video_audio" and ref.get("attachedAudioPath"))
        for ref in refs
    )
    if image_count > MAX_IMAGES or video_count > MAX_VIDEOS or audio_count > MAX_AUDIOS or file_count > MAX_FILES:
        raise ValueError(
            f"Reference limits exceeded: pictures {image_count}/{MAX_IMAGES}, videos {video_count}/{MAX_VIDEOS}, "
            f"audio {audio_count}/{MAX_AUDIOS}, files {file_count}/{MAX_FILES}."
        )
    images: dict[str, Any] = {}
    videos: dict[str, Any] = {}
    video_audios: dict[str, Any] = {}
    audios: dict[str, Any] = {}
    for ref in refs:
        path = ref.get("sourcePath", "")
        trim_start = float(ref.get("trimStart", 0.0))
        trim_end = ref.get("trimEnd")
        connection = ref.get("connection", "")
        if ref["type"] == "image":
            if not path:
                raise ValueError(f"@{ref['name']} has no uploaded image.")
            images[connection] = _load_image(path)
        elif ref["type"] == "video":
            if not path:
                raise ValueError(f"@{ref['name']} has no uploaded video.")
            if ref["mediaMode"] != "audio":
                videos[connection] = _load_video(path, trim_start, trim_end)
            if ref.get("audioConnection"):
                audio_path = ref.get("attachedAudioPath")
                video_audios[ref["audioConnection"]] = (_load_audio(audio_path, trim_start, trim_end)
                                                                 if audio_path else _load_embedded_audio(path, trim_start, trim_end))
            elif ref["mediaMode"] == "audio":
                audios[connection] = _load_embedded_audio(path, trim_start, trim_end)
        elif ref["type"] == "audio":
            if not path:
                raise ValueError(f"@{ref['name']} has no uploaded audio.")
            target = video_audios if connection.startswith("ref_video_audio_") else audios
            target[connection] = _load_audio(path, trim_start, trim_end)
    return images, videos, video_audios, audios


class LHMiniMaxH3DirectorTimeline:
    CATEGORY = "LH/MiniMax H3"
    DESCRIPTION = "Visual multi-reference, shot, dialogue, audio, and continuity planner for MiniMax H3 Ref2VA."
    RETURN_TYPES = ("STRING", "STRING", "STRING", "STRING", "INT", "CONDITIONING", "LATENT")
    RETURN_NAMES = ("compiled_prompt", "timeline_json", "reference_report", "warning_report", "length", "positive", "latent")
    FUNCTION = "compile"

    @classmethod
    def INPUT_TYPES(cls):
        default = json.dumps(_default_data(), ensure_ascii=False, separators=(",", ":"))
        return {
            "required": {
                "duration_seconds": ("FLOAT", {"default": 5.0, "min": 0.01, "max": 60.0, "step": 0.1}),
                "base_prompt": ("STRING", {"default": "A cinematic sequence featuring @Character_A.", "multiline": True, "dynamicPrompts": True}),
                "director_data": ("STRING", {"default": default, "multiline": True}),
                "width": ("INT", {"default": 1344, "min": 32, "max": 16384, "step": 32}),
                "height": ("INT", {"default": 768, "min": 32, "max": 16384, "step": 32}),
                "ref_image_size": (["match", "max"], {"default": "match"}),
            },
            "optional": {
                "clip": ("CLIP",),
                "vae": ("VAE",),
                "audio_vae": ("VAE",),
            }
        }

    def compile(self, duration_seconds, base_prompt, director_data, width=1344, height=768, ref_image_size="match",
                clip=None, vae=None, audio_vae=None):
        compiled = compile_director(base_prompt, duration_seconds, director_data)
        supplied = (clip is not None, vae is not None, audio_vae is not None)
        if not any(supplied):
            return (*compiled, None, None)
        if not all(supplied):
            raise ValueError("Connect clip, vae, and audio_vae together to enable direct H3 conditioning.")
        refs = json.loads(compiled[1])["references"]
        ref_images, ref_videos, ref_video_audios, ref_audios = _load_director_media(refs)
        from comfy_extras.nodes_minimax_h3 import MiniMaxH3ReferenceToVideo

        native = MiniMaxH3ReferenceToVideo.execute(
            clip=clip, vae=vae, audio_vae=audio_vae, prompt=compiled[0],
            width=width, height=height, length=compiled[4], ref_image_size=ref_image_size,
            ref_images=ref_images, ref_videos=ref_videos,
            ref_video_audios=ref_video_audios, ref_audios=ref_audios,
        )
        positive, latent = native.result
        return (*compiled, positive, latent)


class LHMiniMaxH3DirectorT8Conditioning:
    CATEGORY = "LH/MiniMax H3"
    RETURN_TYPES = ("CONDITIONING", "LATENT")
    RETURN_NAMES = ("positive", "av_latent")
    FUNCTION = "encode"

    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {
            "clip": ("CLIP",), "video_vae": ("VAE",), "audio_vae": ("VAE",),
            "compiled_prompt": ("STRING", {"forceInput": True}),
            "timeline_json": ("STRING", {"forceInput": True}),
            "width": ("INT", {"default": 1280, "min": 32, "max": 16384, "step": 32}),
            "height": ("INT", {"default": 736, "min": 32, "max": 16384, "step": 32}),
            "ref_image_size": (["match", "max"],),
        }, "optional": {"first_frame": ("IMAGE",), "last_frame": ("IMAGE",)}}

    def encode(self, clip, video_vae, audio_vae, compiled_prompt, timeline_json,
               width, height, ref_image_size="match", first_frame=None, last_frame=None):
        import nodes

        native = nodes.NODE_CLASS_MAPPINGS.get("MiniMaxH3AudioConditioningT8")
        if native is None:
            raise RuntimeError("Install/enable comfyui-minimax-h3-audio-T8 and restart ComfyUI.")
        timeline = json.loads(timeline_json)
        ref_images, ref_videos, ref_video_audios, ref_audios = _load_director_media(timeline["references"])
        result = native.execute(
            clip=clip, video_vae=video_vae, audio_vae=audio_vae, prompt=compiled_prompt,
            width=width, height=height, length=timeline["h3FrameCount"], task_type="auto",
            audio_mode="native", audio_denoise_strength=1.0, add_source_as_reference=False,
            prompt_primary_audio_ordinal=0, strict_prompt_tags=True,
            ref_image_size=ref_image_size, reference_video_policy="official_2_to_15s",
            allow_above_reference_area=False, first_frame=first_frame, last_frame=last_frame,
            ref_images=ref_images, ref_videos=ref_videos,
            ref_video_audios=ref_video_audios, ref_audios=ref_audios,
        )
        positive, latent, _, _, _, _ = result.result
        return positive, latent


NODE_CLASS_MAPPINGS = {
    "LHMiniMaxH3DirectorTimeline": LHMiniMaxH3DirectorTimeline,
    "LHMiniMaxH3DirectorT8Conditioning": LHMiniMaxH3DirectorT8Conditioning,
}
NODE_DISPLAY_NAME_MAPPINGS = {
    "LHMiniMaxH3DirectorTimeline": "MiniMax H3 Director Timeline v3",
    "LHMiniMaxH3DirectorT8Conditioning": "MiniMax H3 Director → T8 Conditioning",
}
