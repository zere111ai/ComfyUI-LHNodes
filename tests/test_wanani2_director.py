"""Exercise queue rewriting without a GPU, HTTP server, or model files."""
import ast
import contextlib
import copy
import io
import json
import math
import os
from pathlib import Path
import tempfile
import time
from types import SimpleNamespace
import unittest
from unittest.mock import Mock


SOURCE = Path(__file__).resolve().parents[1] / 'segment_queue_node.py'


def load_queue():
    tree = ast.parse(SOURCE.read_text(encoding='utf-8'))
    end = next(n.lineno for n in tree.body if isinstance(n, ast.AsyncFunctionDef))
    tree.body = [n for n in tree.body if isinstance(n, (ast.FunctionDef, ast.ClassDef, ast.Assign, ast.AnnAssign)) and n.lineno < end]
    namespace = dict(copy=copy, json=json, math=math, os=os, time=time, __file__=str(SOURCE))
    exec(compile(tree, str(SOURCE), 'exec'), namespace)
    return namespace


class InlineThread:
    def __init__(self, target, **kwargs):
        self.target = target

    def start(self):
        if self.target.__name__ == 'submit_all':
            self.target()


class Animate2QueueTests(unittest.TestCase):
    def test_director_plan_rejects_gaps_and_overflow(self):
        env = load_queue()
        with self.assertRaisesRegex(ValueError, '存在空洞'):
            env['parse_director_plan']({'segments': [
                {'start': 0, 'end': 40}, {'start': 45, 'end': 80},
            ]}, 80)
        with self.assertRaisesRegex(ValueError, '超出当前视频总帧数'):
            env['parse_director_plan']({'segments': [
                {'start': 0, 'end': 81},
            ]}, 80)

    def test_configured_output_id_must_be_video_combine(self):
        env = load_queue()
        prompt = {
            '10': {'class_type': 'LoadImage', 'inputs': {}},
            '20': {'class_type': 'VHS_VideoCombine', 'inputs': {'save_output': True}},
        }
        self.assertEqual(env['find_video_combine_node'](prompt, '20'), '20')
        self.assertEqual(env['find_video_combine_node'](prompt, '10'), '20')

    def test_interpolation_is_found_through_post_processing_chain(self):
        env = load_queue()
        prompt = {
            '10': {'class_type': 'FrameInterpolate', 'inputs': {'images': ['9', 0]}},
            '11': {'class_type': 'ImageScale', 'inputs': {'image': ['10', 0]}},
        }
        self.assertEqual(env['find_frame_interpolate_for_images'](prompt, ['11', 0]), ('10', ['9', 0]))

    def test_director_scope_does_not_cross_into_a_second_output_chain(self):
        env = load_queue()
        prompt = {
            '9': {'class_type': 'VAEDecode', 'inputs': {}},
            '10': {'class_type': 'Mask', 'inputs': {'image': ['9', 0]}},
            '11': {'class_type': 'VHS_VideoCombine', 'inputs': {'images': ['10', 0]}},
            '20': {'class_type': 'Mask', 'inputs': {'image': ['19', 0]}},
            '21': {'class_type': 'VHS_VideoCombine', 'inputs': {'images': ['20', 0]}},
        }
        self.assertEqual(env['upstream_node_ids'](prompt, ['11']), {'9', '10', '11'})

    def run_queue(self, transition=True, stride=1, positive='A red-haired character in a studio.', motion_id='12'):
        env = load_queue()
        submitted = []
        with tempfile.TemporaryDirectory() as directory:
            env['folder_paths'] = SimpleNamespace(get_input_directory=lambda: directory, get_output_directory=lambda: directory)
            env['threading'] = SimpleNamespace(Thread=InlineThread)
            env['args'] = SimpleNamespace(listen='127.0.0.1', port=8188)
            for name in ('_sqr_log', 'clear_checkpoint', 'write_checkpoint', '_sqr_cleanup_ref_images', 'save_speed_record'):
                env[name] = lambda *a, **kw: None
            env['read_checkpoint'] = lambda *a: None
            env['_sqr_prepare_checkpoint_ref_entries'] = lambda entries, **kw: entries
            env['first_director_guide_path'] = lambda *a: ''
            env['load_first_director_guide_frame'] = lambda *a: None
            env['find_audio_filename'] = lambda *a: None
            env['wait_for_prompt'] = lambda *a: True
            env['queue_prompt'] = lambda wf, **kw: submitted.append(copy.deepcopy(wf)) or str(len(submitted))
            env['merge_videos'] = lambda *a, **kw: True

            def output_info(pid, nid, **kwargs):
                path = Path(directory) / f'{pid}_{nid}.mp4'
                path.touch()
                return str(path), 81 if pid == '1' else 70

            env['get_output_video_info'] = output_info
            state = {'version': 3, 'segments': [
                {'start': 0, 'end': 81, 'positive': positive, 'positive_pose': 'Dancing.',
                 'references': [{'path': 'first.png'}], 'mode': 'replacement', 'multi_ref': True},
                {'start': 81, 'end': 151, 'positive': '', 'positive_pose': '', 'references': [{'path': 'second.png'}],
                 'guide_frame': {'path': 'guide.png'}, 'color_match': True, 'color_match_strength': 0.6},
            ]}
            prompt = {
                '91': {'class_type': 'VHS_LoadVideo', 'inputs': {'video':'drive.mp4','skip_first_frames':7,'select_every_nth':stride}},
                '12': {'class_type':'WanAnimate2ToVideo', 'inputs':{'length':81,'pose_video':['91',0]}},
                '13': {'class_type':'SamplerCustom', 'inputs':{}},
                '50': {'class_type':'LoadImage','inputs':{'image':'old.png'}},
                '432': {'class_type':'ResizeImageMaskNode','inputs':{'input':['50',0]}},
                '14': {'class_type':'VAEDecode','inputs':{'samples':['438',0]}},
                '438': {'class_type':'TrimVideoLatent','inputs':{'samples':['13',0],'trim_amount':['12',3]}},
                '85': {'class_type':'FrameInterpolate','inputs':{'images':['14',0]}},
                '15': {'class_type':'VHS_VideoCombine','inputs':{'images':['85',0],'filename_prefix':'test','frame_rate':30}},
                '21': {'class_type':'CLIPTextEncode','inputs':{'text':['423',0]}},
                '17': {'class_type':'CLIPTextEncode','inputs':{'text':['423',2]}},
                '423': {'class_type':'WanAni2Director','inputs':{}},
            }
            with contextlib.redirect_stdout(io.StringIO()):
                result = env['WanAni2Director']().run(
                    总帧数=151, 帧率=30, 启用过渡效果=transition, 分段数=2, 从第几段开始=1,
                    执行=True, 启用续跑=False, 参考视频节点ID='91', 输出节点ID='15', 动作嵌入节点ID=motion_id,
                    参考图节点ID='50', 分段参考图='', 续跑视频路径='', director_data=json.dumps(state),
                    prompt=prompt, unique_id='423', extra_pnginfo={'sqr_full_prompt':prompt},
                )
            self.assertEqual(result[2], 'Dancing.')
        self.assertEqual(len(submitted), 2)
        return submitted

    def test_continuation_uses_one_visible_frame_and_separate_prompts(self):
        first, second = self.run_queue()
        self.assertNotIn('continue_motion', first['12']['inputs'])
        self.assertEqual(first['12']['inputs']['length'], 81)
        self.assertEqual(second['12']['inputs']['length'], 73)
        self.assertEqual(second['12']['inputs']['video_frame_offset'], 1)
        self.assertEqual(second['12']['inputs']['continue_motion'], ['sqr_tv_2', 0])
        self.assertNotIn('transition_video', second['12']['inputs'])
        self.assertEqual(second['sqr_tv_2']['inputs']['skip_first_frames'], 80)
        self.assertEqual(second['sqr_tv_2']['inputs']['frame_load_cap'], 1)
        self.assertEqual(second['91']['inputs']['skip_first_frames'], 87)
        self.assertEqual(second['sqr_ifb_2_a']['inputs']['batch_index'], 1)
        self.assertEqual(second['sqr_ifb_2_a']['inputs']['length'], 70)
        self.assertEqual(first['sqr_full_vc_1']['inputs']['images'], ['sqr_ifb_1_a', 0])
        self.assertEqual(second['85']['inputs']['images'], ['sqr_ifb_2_a', 0])
        self.assertEqual(second['17']['inputs']['text'], 'Dancing.')
        self.assertEqual(second['21']['inputs']['text'], 'A red-haired character in a studio.')
        self.assertEqual(second['50']['inputs']['image'], 'second.png')
        self.assertEqual(second['432']['inputs']['input'], ['sqr_color_match_2_1', 0])
        self.assertEqual(second['sqr_color_match_2_1']['inputs']['image_target'], ['50', 0])
        self.assertNotIn('423', second)

    def test_transition_off_keeps_full_visible_range(self):
        first, second = self.run_queue(False)
        self.assertNotIn('continue_motion', second['12']['inputs'])
        self.assertEqual(second['12']['inputs']['video_frame_offset'], 0)
        self.assertEqual(second['sqr_ifb_2_a']['inputs']['batch_index'], 0)
        self.assertEqual(second['sqr_ifb_2_a']['inputs']['length'], 70)
        self.assertEqual(second['91']['inputs']['skip_first_frames'], 88)

    def test_empty_appearance_prompt_still_queues_both_segments(self):
        first, second = self.run_queue(positive='')
        self.assertEqual(first['21']['inputs']['text'], '')
        self.assertEqual(second['21']['inputs']['text'], '')
        self.assertEqual(second['17']['inputs']['text'], 'Dancing.')
        env = load_queue()
        self.assertTrue(env['WanAniDirector'].REQUIRE_POSITIVE_PROMPT)
        self.assertFalse(env['WanAni2Director'].REQUIRE_POSITIVE_PROMPT)

    def test_source_stride_preserves_frame_boundary(self):
        _, second = self.run_queue(stride=2)
        self.assertEqual(second['91']['inputs']['skip_first_frames'], 167)

    def test_sampler_id_is_corrected_before_rewriting_pose_prompt(self):
        first, second = self.run_queue(motion_id='13')
        self.assertEqual(second['12']['inputs']['continue_motion'], ['sqr_tv_2', 0])
        self.assertEqual(first['17']['inputs']['text'], 'Dancing.')
        self.assertEqual(second['17']['inputs']['text'], 'Dancing.')
        self.assertEqual(second['13']['inputs'], {})
        self.assertNotIn('423', second)

    def test_validation_errors_do_not_count_as_submission_success(self):
        env = load_queue()
        response = SimpleNamespace(read=lambda: json.dumps({'prompt_id':'p','node_errors':{'17':{'errors':['missing 423']}}}).encode())
        opener = Mock(return_value=contextlib.nullcontext(response))
        env['urllib'] = SimpleNamespace(request=SimpleNamespace(urlopen=opener, Request=lambda *a, **kw: None))
        env['_sqr_get_comfy_host'] = lambda **kw: '127.0.0.1:8188'
        with self.assertRaisesRegex(ValueError, '验证失败'):
            env['queue_prompt']({})
        self.assertEqual(opener.call_count, 1)

    def test_completed_error_history_is_failure(self):
        env = load_queue()
        response = SimpleNamespace(read=lambda: b'{"p":{"status":{"completed":true,"status_str":"error"}}}')
        env['urllib'] = SimpleNamespace(request=SimpleNamespace(urlopen=lambda *a, **kw: contextlib.nullcontext(response)))
        env['time'] = SimpleNamespace(sleep=lambda *a: None)
        env['_sqr_get_comfy_host'] = lambda **kw: '127.0.0.1:8188'
        self.assertFalse(env['wait_for_prompt']('p'))

    def test_new_schema_is_motion_only_and_original_stays_registered(self):
        env = load_queue()
        inputs = env['WanAni2Director'].INPUT_TYPES()['required']
        self.assertNotIn('replacement_enabled', inputs)
        self.assertNotIn('multi_ref_enabled', inputs)
        self.assertNotIn('multi_ref_startup_fix', inputs)
        self.assertIn('WanAniDirector', env['NODE_CLASS_MAPPINGS'])
        self.assertEqual(env['NODE_DISPLAY_NAME_MAPPINGS']['WanAni2Director'], 'WAN ANI 2 DIRECTOR')

    def test_workflow_has_consistent_links_and_native_conditioning(self):
        root = SOURCE.parents[2]
        workflow = json.loads((root / 'user/default/workflows/wan/WAN-ANI2-导演台-多参动作迁移-分段队列 V1.json').read_text(encoding='utf-8'))
        nodes = {node['id']: node for node in workflow['nodes']}
        links = {link[0]: link for link in workflow['links']}
        self.assertEqual(len(nodes), len(workflow['nodes']))
        self.assertEqual(len(links), len(workflow['links']))
        for link_id, source, output, target, slot, kind in links.values():
            self.assertIn(link_id, nodes[source]['outputs'][output]['links'])
            self.assertEqual(nodes[target]['inputs'][slot]['link'], link_id)
            self.assertTrue(set(nodes[source]['outputs'][output]['type'].split(',')) & set(kind.split(',')))
        for node in nodes.values():
            for slot, inp in enumerate(node['inputs']):
                if inp.get('link') is not None:
                    self.assertEqual(links[inp['link']][3:5], [node['id'], slot])
            for slot, out in enumerate(node['outputs']):
                for link_id in out.get('links') or []:
                    self.assertEqual(links[link_id][1:3], [node['id'], slot])
        native = nodes[12]
        self.assertEqual(native['type'], 'WanAnimate2ToVideo')
        pose = next(i for i in native['inputs'] if i['name'] == 'pose_video')
        self.assertEqual(links[pose['link']][1:3], [91, 0])
        self.assertEqual(nodes[438]['type'], 'TrimVideoLatent')
        self.assertEqual(nodes[435]['type'], 'WanAnimate2Cache')
        self.assertFalse(any('SCAIL' in n['type'].upper() or n['type']=='SAM3_VideoTrack' for n in nodes.values()))


if __name__ == '__main__':
    unittest.main()
