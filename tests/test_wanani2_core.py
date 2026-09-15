"""CPU contract check against the installed Wan Animate 2 conditioning node."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
sys.argv = [sys.argv[0], '--cpu']
import comfy.options
comfy.options.enable_args_parsing()
import torch
from comfy_extras.nodes_wan import WanAnimate2ToVideo, TrimVideoLatent


class RecordingVAE:
    def __init__(self):
        self.images = []

    def encode(self, images):
        self.images.append(images.clone())
        return torch.zeros(1, 16, (images.shape[0] - 1) // 4 + 1, 2, 2)


vae = RecordingVAE()
pose = torch.arange(80, 152, dtype=torch.float32).reshape(-1, 1, 1, 1).expand(-1, 16, 16, 3)
conditioning = [[torch.zeros(1, 1, 8), {}]]
result = WanAnimate2ToVideo.execute(
    positive=conditioning, negative=conditioning, vae=vae, width=16, height=16,
    length=73, batch_size=1, video_frame_offset=1,
    reference_image=torch.zeros(1, 16, 16, 3), pose_video=pose,
    continue_motion=torch.full((1, 16, 16, 3), 80.0),
    positive_pose=[[torch.ones(1, 1, 8), {}]],
)
assert result[3] == 1 and result[4] == 1
assert result[5] == 73
assert vae.images[1][0, 0, 0, 0] == 80
assert vae.images[2].shape[0] == 73
assert vae.images[2][0, 0, 0, 0] == 80
assert vae.images[2][-1, 0, 0, 0] == 151
assert torch.equal(result[0][0][1]['cross_attn_pose'], torch.ones(1, 1, 8))
trimmed = TrimVideoLatent.execute(result[2], result[3])[0]['samples']
assert trimmed.shape[2] == 19
assert (trimmed.shape[2] - 1) * 4 + 1 == 73
print('Native WanAnimate2ToVideo: anchor, pose offset, padding, dual conditioning and latent trim passed.')
