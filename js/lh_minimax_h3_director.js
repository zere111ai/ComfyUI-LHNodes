import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

const NODE_NAME = "LHMiniMaxH3DirectorTimeline";
const KIND = "LH_MINIMAX_H3_DIRECTOR_TIMELINE";
const VERSION = 3;
const FPS = 24;
const TIMELINE_DURATION = 30;
const PURPOSES = ["identity", "wardrobe", "object", "scene", "style", "composition", "motion", "camera", "edit_source", "voice", "music", "sfx", "text"];
const MODES = ["preserve", "borrow", "match", "transform", "replace", "inspire"];
const FIDELITIES = ["strict", "strong", "balanced", "loose"];
const REF_TYPES = ["image", "video", "audio"];
const MEDIA_MODES = ["video", "audio", "video_audio"];
const FRAME_ROLES = ["reference", "first_frame", "keyframe", "last_frame", "storyboard", "edit_source", "continuation_source"];
const RETENTIONS = ["auto", "fully_preserved", "partially_preserved", "attribute_transfer", "weak_reference", "fully_copy", "partially_copy", "reference"];
const VISUAL_RETENTIONS = ["auto", "fully_preserved", "partially_preserved", "attribute_transfer", "weak_reference"];
const AUDIO_RETENTIONS = ["auto", "fully_copy", "partially_copy", "reference", "weak_reference"];
const AUDIO_MODES = ["reference", "reuse"];
const SUPPORTED_LANGUAGES = ["Arabic", "Chinese", "English", "French", "German", "Italian", "Japanese", "Korean", "Portuguese", "Russian", "Spanish"];
const AUDIO_ROLES = ["complete_soundtrack", "voice_timbre", "voice_delivery", "dialogue_content", "lyrics", "music_style", "beat_rhythm", "sound_effect", "audio_continuity"];
const AUDIO_ROLE_LABELS = {
    complete_soundtrack: "Complete soundtrack", voice_timbre: "Voice timbre", voice_delivery: "Voice delivery",
    dialogue_content: "Dialogue content", lyrics: "Lyrics", music_style: "Music style", beat_rhythm: "Beat / rhythm",
    sound_effect: "Sound-effect texture", audio_continuity: "Audio continuity",
};
const EXTENSIONS = {
    image: new Set(["avif", "bmp", "gif", "jpeg", "jpg", "png", "tif", "tiff", "webp"]),
    video: new Set(["avi", "m4v", "mkv", "mov", "mp4", "mpeg", "mpg", "webm"]),
    audio: new Set(["aac", "aif", "aiff", "flac", "m4a", "mp3", "ogg", "opus", "wav", "weba"]),
};

const UI_ZH = {
    "Timeline": "时间轴", "References": "参考素材", "Global Direction": "全局导演", "R2V Guide": "R2V 指南",
    "Source Media": "源素材", "Upload / drop / paste real files · crop here affects decoded source only": "上传、拖入或粘贴真实素材 · 此处裁剪只影响源素材解码",
    "+ Image": "+ 图片", "+ Video": "+ 视频", "+ Audio": "+ 音频", "+ Shot": "+ 镜头", "+ Picture": "+ 图片",
    "No media attached": "尚未绑定素材", "Attach": "绑定", "Attach file": "绑定文件", "Replace": "替换", "Clear": "清除", "Delete": "删除",
    "Output direction timeline": "成片导演时间轴", "SHOTS": "镜头", "PICTURES": "图片", "VIDEOS": "视频", "AUDIO": "音频", "Snap": "吸附",
    "Select a block to edit its direction.": "选择一个区块以编辑导演内容。", "Enabled": "启用", "On": "开启", "Off": "关闭",
    "Name / @alias": "名称 / @别名", "Media type": "素材类型", "Purpose": "用途", "Relationship": "引用关系", "Fidelity": "参考强度",
    "Retention marker": "保留标记", "Subject / target": "主体 / 目标", "Prompt start (s)": "提示词开始（秒）", "Prompt end (s)": "提示词结束（秒）",
    "Source crop start (s)": "源裁剪开始（秒）", "Source crop end (s)": "源裁剪结束（秒）", "Video streams": "视频流模式",
    "Audio routing": "音频路由", "Standalone audio": "独立音频", "Reference instruction": "参考素材指令", "Source:": "源素材：",
    "Paired soundtrack:": "配对音轨：", "Use external audio": "使用外部音频", "Replace audio": "替换音频", "Use embedded": "使用内嵌音频",
    "Shot label": "镜头名称", "Start (s)": "开始（秒）", "End (s)": "结束（秒）", "Shot type": "景别", "Lens": "镜头 / 焦段", "Lens / depth": "镜头 / 景深",
    "Camera movement": "摄影机运动", "Composition / screen direction": "构图 / 屏幕方向", "Subjects": "主体", "Action and timing": "动作与时序",
    "Expression / performance": "表情 / 表演", "Speaker": "说话者", "Voice direction / @Audio": "声音指令 / @音频", "Dialogue language": "对白语言",
    "Delivery": "对白形式", "On-screen dialogue": "画面内对白", "Voiceover": "旁白", "Line ending": "对白结尾", "Complete line": "完整说完", "Cut off at shot end": "镜头结束时截断",
    "Exact dialogue": "准确对白", "Ambience": "环境声", "Music": "音乐", "Sound effects": "音效",
    "Transition": "转场", "Continuity handoff": "连续性衔接", "Shot references": "镜头参考素材", "No enabled references": "没有启用的参考素材",
    "Creative brief": "创作简述", "Prompt detail": "提示词详细度", "Director / detailed": "导演模式 / 详细", "Compact": "精简",
    "Output format": "输出形式", "Scene / world": "场景 / 世界", "Visual style / lighting / materials": "视觉风格 / 灯光 / 材质",
    "Identity / subject rules": "身份 / 主体规则", "Global camera rules": "全局摄影规则", "Global audio rules": "全局音频规则",
    "Non-diegetic music rules": "非剧情内音乐规则", "Continuity bible": "连续性设定", "Avoid": "避免",
    "What Ref2VA can direct": "Ref2VA 可以导演什么", "Identity & products": "身份与产品", "Motion & camera": "动作与摄影机", "Voice & sound": "声音与音频",
    "Multi-shot & editing": "多镜头与编辑", "Important limits": "重要限制", "Recommended graph": "推荐连接方式", "Direct mode:": "直连模式：", "Compiler mode:": "编译模式：",
    "Edit": "编辑", "Disabled": "已禁用", "No references.": "没有参考素材。", "Ready": "就绪", "Apply workflow preset…": "应用工作流预设…",
    "Character + voice performance": "角色 + 声音表演", "Identity + motion transfer": "身份 + 动作迁移", "Product advertisement": "产品广告", "Video edit / replacement": "视频编辑 / 替换",
    "V · picture only": "V · 仅画面", "A · embedded audio only": "A · 仅内嵌音频", "V+A · picture + soundtrack": "V+A · 画面与音轨",
    "image": "图片", "video": "视频", "audio": "音频", "identity": "身份", "wardrobe": "服装", "object": "物体 / 产品", "scene": "场景", "style": "风格",
    "composition": "构图", "motion": "动作", "camera": "摄影机", "edit_source": "编辑源", "voice": "声音", "music": "音乐", "sfx": "音效", "text": "文字",
    "preserve": "保留", "borrow": "借用", "match": "匹配", "transform": "转换", "replace": "替换", "inspire": "启发",
    "strict": "严格", "strong": "强", "balanced": "平衡", "loose": "宽松", "auto": "自动", "fully_preserved": "完全保留", "partially_preserved": "部分保留",
    "attribute_transfer": "属性迁移", "weak_reference": "弱参考", "fully_copy": "完全复制", "partially_copy": "部分复制", "reference": "普通参考",
    "Drop or upload media to build real H3 references.": "拖入或上传素材以建立真实 H3 参考。",
    "— these ranges control prompt wording and shot structure, independently from source crop. Only references mentioned by an effective @alias are sent to H3; manually placed blocks are planning aids only.": "— 此处控制提示词时序和镜头结构，与源裁剪相互独立。只有在生效提示词中使用 @别名的素材才会送入 H3；手动时间轴素材条只用于规划。",
    "Use aliases such as": "可在下方使用类似这样的别名：", "anywhere below. On queue they compile to the correct H3 tags.": "。执行时会自动编译为正确的 H3 标签。",
    "Only materials mentioned by an effective @alias are sent to H3. Manually placed timeline blocks are planning aids only.": "只有在生效提示词中通过 @别名提到的素材才会送入 H3。手动放置的时间轴素材条只用于规划。",
    "Only enter words that should be spoken.": "只填写实际需要说出的内容。", "What should the finished clip be?": "描述最终成片应呈现什么。",
    "State exactly what to preserve, borrow, transform, replace, or ignore.": "明确说明需要保留、借用、转换、替换或忽略的内容。",
    "Direct-to-camera performance": "直视镜头表演", "Opening": "开场", "Shot 1": "镜头 1",
    "Camera angle": "机位角度", "Depth of field": "景深", "Shot lighting": "镜头灯光", "Motion pace": "动作节奏",
    "Choose preset…": "选择预设…", "Custom value remains editable below.": "下方始终可以输入或修改自定义内容。",
    "Type @ in a text field to choose a named reference.": "在文本框输入 @ 可选择已经命名的参考素材。",
    "Prompt fields": "提示词区", "Template name": "模板名称", "Saved templates": "已保存模板",
    "Select or add a Shot.": "请选择或添加镜头。", "Select or add a Shot to edit its prompt.": "请选择或添加镜头以编辑提示词。",
    "Save template": "保存模板", "Load template": "读取模板", "Delete template": "删除模板", "Preview compiled prompt": "预览编译提示词",
    "Compiled prompt preview": "Compiled Prompt 预览", "Close": "关闭", "Loading compiled prompt…": "正在编译提示词…",
    "No saved templates": "没有已保存模板", "Enter a template name.": "请输入模板名称。", "Template saved.": "模板已保存。",
    "Template loaded.": "模板已读取。", "Template deleted.": "模板已删除。", "Select a saved template.": "请选择已保存模板。",
    "Describe action order, contacts, timing, and interactions.": "描述动作顺序、接触关系、时序和互动。",
    "Audio use": "音频使用方式", "Audio reference": "仅参考音频特征", "Audio reuse": "复用原始音频信号", "Audio roles": "音频用途（可多选）",
    "Audio retention": "音频保留关系", "Target speaker subject": "目标说话主体", "No target speaker": "不绑定说话主体",
    "Stable voice description": "稳定声音描述", "Complete soundtrack": "完整音轨", "Voice timbre": "音色", "Voice delivery": "说话方式",
    "Dialogue content": "对白内容", "Lyrics": "歌词", "Music style": "音乐风格", "Beat / rhythm": "节拍 / 节奏",
    "Sound-effect texture": "音效质感", "Audio continuity": "音频连续性", "Audio role description / instruction": "音频角色说明 / 指令",
    "Global ambience / physical sound rules": "全局环境声 / 物理音效规则",
    "One asset may serve several roles; the compiler writes them as one natural definition.": "一个音频可以承担多个用途；编译器会将它们合并成一句自然定义。",
    "Describe all selected audio roles in one natural instruction.": "请用一句自然语言说明所有选中的音频用途。",
    "Choose audio reuse to copy a signal or audio reference to borrow timbre, delivery, content, music style, beat, SFX texture, or continuity. Bind voice audio to a visual subject so its global Sx speaker ID is reused.": "选择“复用音频信号”可复制全部或部分原音；选择“仅参考”可借用音色、说话方式、内容、音乐风格、节拍、音效质感或连续性。将声音音频绑定到可视主体后，会复用该主体的全局 Sx 说话人编号。",
};

Object.assign(UI_ZH, {
    "Dialogue": "对白",
    "Narration": "旁白",
    "Narration settings": "旁白设定",
    "Narration / voiceover": "旁白 / 画外音",
    "Narrator": "旁白者",
    "Narration voice direction / @Audio": "旁白声音指令 / @音频",
    "Narration language": "旁白语言",
    "Narration ending": "旁白结尾",
    "Dialogue start (s)": "对白开始（秒）", "Dialogue end (s)": "对白结束（秒）",
    "Narration start (s)": "旁白开始（秒）", "Narration end (s)": "旁白结束（秒）",
    "Auto: shot start": "自动：镜头开始", "Auto: shot end": "自动：镜头结束",
    "Cut off at event end": "发声区间结束时截断",
    "Exact narration": "准确旁白",
    "Other / custom language": "其他 / 自定义语言",
    "Custom language": "自定义语言",
    "Stable support: Arabic, Chinese, English, French, German, Italian, Japanese, Korean, Portuguese, Russian, and Spanish. Other languages may vary.": "稳定支持：阿拉伯语、中文、英语、法语、德语、意大利语、日语、韩语、葡萄牙语、俄语和西班牙语；其他语言的效果可能有所不同。",
    "Only enter words spoken by an on-screen subject.": "仅填写画面内主体实际说出的内容。",
    "Only enter off-screen narration or voiceover words.": "仅填写画外旁白或画外音实际说出的内容。",
    "Action, performance and dialogue": "动作、表演与对白",
    "Performance emotion (optional)": "表演情绪（可选）",
    "Write the complete shot flow here. For dialogue use: @Subject (S1) says, <d>[Chinese] 台词。</d>": "在这里连续描述完整镜头。对白请使用：@角色 (S1) 说，<d>[Chinese] 台词。</d>",
    "Dialogue written here stays in the shot description; use stable Sx IDs and wrap exact words in <d>[Language] ...</d>.": "这里填写的对白会保留在镜头描述中；请保持 Sx 编号稳定，并用 <d>[语言] ...</d> 包裹准确台词。",
    "Arabic": "阿拉伯语", "Chinese": "中文", "English": "英语", "French": "法语", "German": "德语", "Italian": "意大利语",
    "Japanese": "日语", "Korean": "韩语", "Portuguese": "葡萄牙语", "Russian": "俄语", "Spanish": "西班牙语",
    "Preview": "预览",
    "Media preview": "素材预览",
    "Subject description / visible content": "主体描述 / 可见内容",
    "Describe the reusable person, animal, object, scene, clothing, effect, style, action, expression, or pose visible in this asset.": "描述素材中可复用的人物、动物、物体、场景、服装、特效、风格、动作、表情或姿态。",
    "Director settings": "导演设定",
    "Font size": "字体大小",
    "Output duration (s)": "输出时长（秒）",
    "Shot prompt source": "Shot 提示词来源",
    "Director fields": "导演台自动生成",
    "External prompt override": "外部完整提示词覆盖",
    "Complete Shot prompt override": "完整 Shot 提示词覆盖",
    "This replaces all automatically generated content for this Shot. Use @aliases for references; the Director still supplies the H3 global structure and reference definitions.": "启用后将替换该 Shot 的全部自动生成内容。可用 @别名引用素材；Director 仍会保留 H3 全局结构和参考素材定义。",
    "[Shot] Describe the complete visual action, camera, performance, dialogue, sound, timing, and transition for this Shot.": "[Shot] 在此填写该镜头完整的画面动作、摄影机、表演、对白、声音、时序和转场提示词。",
    "Camera settings": "镜头设定", "Sound settings": "音效设定", "Transition settings": "转场设定",
    "Shot controls": "镜头｜音效｜转场",
    "Auto design": "自动设计", "Let the model design this entire section.": "开启后由模型设计本组全部内容。",
    "Blank sound fields mean silence.": "音效子项留空时按静音处理。",
    "Interface mode": "界面模式", "Simple": "简易", "Director": "导演",
    "Basic setup": "基础设定", "Characters and subjects": "人物与主体", "Simple Shot editor": "简易 Shot 编辑",
    "Story goal / content summary": "故事目标／内容概述", "Format / video type": "视频类型／输出形式",
    "Scene and environment": "场景与环境", "Visual style and lighting": "视觉风格与灯光",
    "Descriptions should be English; dialogue keeps its original language.": "描述内容建议使用英文；对白保留原语言。",
    "Add visual subject": "添加视觉主体", "No visual subjects yet. Upload or add an image/video reference.": "还没有视觉主体，请上传或添加图片／视频参考。",
    "Select a visual reference above to edit its subject settings.": "请在上方选择一个视觉参考素材以编辑主体设定。",
    "Subject name": "主体名称", "Appearance / reusable content": "外观／可复用内容", "Reference provides": "参考素材提供",
    "Narration helper": "旁白助手", "Narration source": "旁白来源", "Additional voice": "额外声音", "Narration line": "旁白内容", "Apply narration": "应用旁白",
    "Visual characters": "视觉角色", "Audio references": "音频参考", "Extra voice / custom narrator": "额外声音／自定义旁白者",
    "Voice name or direction": "声音名称或描述", "Auto start": "自动开始", "Auto end": "自动结束",
    "Asset role": "素材角色", "Reusable reference": "可复用参考", "First-frame anchor": "首帧锚点", "Keyframe anchor": "关键帧锚点",
    "Last-frame anchor": "尾帧锚点", "Storyboard / temporal guide": "故事板／时序参考", "Video edit source": "视频编辑源", "Video continuation source": "视频续写源",
    "Dialogue language": "对白语言", "Exact spoken words": "准确台词", "No visual subject": "没有视觉主体", "Original language": "原始语言",
    "Identity / appearance": "身份／外观", "Scene / environment": "场景／环境", "Object / prop": "物体／道具", "Visual style": "视觉风格", "Motion / action": "运动／动作",
    "Camera settings · Auto design": "镜头设定 · 自动设计", "Sound settings · Auto design": "音效设定 · 自动设计", "Transition settings · Auto design": "转场设定 · 自动设计",
    "No file attached": "未绑定文件", "Name / @alias": "名称／@别名",
    "Drag to timeline": "拖入时间轴", "Timeline only · add @alias to send": "仅在时间轴 · 使用 @别名后才传给模型", "Auto from @prompt": "由 @提示词自动加入",
    "Remove from timeline": "移出时间轴", "Library only": "仅在素材库", "not on timeline": "未加入时间轴",
    "Mention at least one uploaded visual reference with its @alias.": "请在提示词中使用至少一个已上传视觉素材的 @别名。",
    "The 60-second timeline limit has been reached.": "时间轴已达到 60 秒上限。",
    "Simple prompt source": "提示词来源", "Structured simple fields": "简易结构字段",
    "Single-character performance": "单人表演", "Two-person dialogue": "双人对话", "Silent action": "无对白动作",
    "Environment showcase": "场景展示", "Product showcase": "产品展示", "Three-shot short": "三镜头短片",
    "Shot 1 master settings": "Shot 1 主设定",
    "Direction source": "导演设定来源",
    "Inherit Shot 1": "继承 Shot 1",
    "Custom override": "本镜头自定义",
    "Director template name": "导演模板名称",
    "Saved director templates": "已保存导演模板",
    "Built-in templates": "内置模板",
    "Custom templates": "自定义模板",
    "Built-in templates cannot be deleted.": "内置模板不能删除。",
    "Later shots inherit these settings automatically.": "后续镜头会自动继承这些设定。",
    "This shot currently follows Shot 1. Choose Custom override to change it.": "本镜头当前跟随 Shot 1；选择“本镜头自定义”后可修改。",
});

const SHOT_PRESETS = {
    shotType: [
        ["extreme wide shot", "大远景"], ["wide shot", "远景"], ["full shot", "全景"], ["medium full shot", "中全景"],
        ["medium shot", "中景"], ["medium close-up", "中近景"], ["close-up", "近景"], ["extreme close-up", "特写"],
        ["over-the-shoulder shot", "过肩镜头"], ["two-shot", "双人镜头"], ["point-of-view shot", "主观视角"], ["macro shot", "微距镜头"],
    ],
    camera: [
        ["locked-off tripod shot", "固定机位"], ["slow dolly in", "缓慢推进"], ["slow dolly out", "缓慢拉远"],
        ["tracking shot following the subject", "跟随拍摄"], ["truck left", "横移向左"], ["truck right", "横移向右"],
        ["pan left", "向左摇镜"], ["pan right", "向右摇镜"], ["tilt up", "向上俯仰"], ["tilt down", "向下俯仰"],
        ["smooth orbit around the subject", "环绕主体"], ["crane up", "升降向上"], ["crane down", "升降向下"],
        ["dolly zoom in: camera dollies forward while the lens zooms out, creating a vertigo effect", "推进式 Dolly Zoom（滑动变焦）"],
        ["dolly zoom out: camera dollies backward while the lens zooms in, creating a vertigo effect", "拉远式 Dolly Zoom（滑动变焦）"],
        ["clockwise rotational zoom in: the camera rolls clockwise while rapidly zooming toward the subject", "顺时针旋转变焦推进"],
        ["counterclockwise rotational zoom out: the camera rolls counterclockwise while rapidly zooming away from the subject", "逆时针旋转变焦拉远"],
        ["steady gimbal follow", "稳定器跟拍"], ["natural handheld follow", "自然手持跟拍"], ["whip pan", "快速甩镜"],
    ],
    lens: [
        ["automatic lens selection appropriate to the shot, no fixed focal length", "自动（不指定焦段）"],
        ["8mm circular fisheye lens with strong barrel distortion", "8mm 圆形鱼眼镜头"],
        ["180-degree fisheye lens with pronounced curved perspective", "180° 鱼眼镜头"],
        ["14mm ultra-wide lens", "14mm 超广角"], ["24mm wide-angle lens", "24mm 广角"], ["35mm cinematic lens", "35mm 电影镜头"],
        ["50mm standard lens", "50mm 标准镜头"], ["85mm portrait lens", "85mm 人像镜头"], ["100mm macro lens", "100mm 微距"],
        ["135mm telephoto lens", "135mm 长焦"], ["200mm super-telephoto lens with compressed perspective", "200mm 超长焦"],
        ["400mm ultra-telephoto lens with strong perspective compression", "400mm 超长焦"], ["anamorphic cinematic lens", "变形宽银幕镜头"],
    ],
    depth: [
        ["deep depth of field, foreground and background in focus", "大景深，前后景清晰"], ["moderate depth of field", "中等景深"],
        ["shallow depth of field with soft background bokeh", "浅景深，背景柔和虚化"], ["extremely shallow depth of field", "极浅景深"],
        ["rack focus from foreground to subject", "前景向主体拉焦"], ["rack focus from subject to background", "主体向背景拉焦"],
    ],
    transition: [
        ["cut", "直接切换"], ["hard cut", "硬切"], ["match cut", "匹配剪辑"], ["smash cut", "冲击式剪辑"],
        ["seamless motivated cut", "动机驱动无缝切换"], ["whip-pan transition", "甩镜转场"], ["cross dissolve", "交叉溶解"],
        ["fade in", "淡入"], ["fade out", "淡出"], ["continuous shot with no cut", "连续镜头不切换"],
    ],
    cameraAngle: [
        ["eye-level camera angle", "平视"], ["low-angle shot", "低机位仰拍"], ["high-angle shot", "高机位俯拍"],
        ["bird's-eye top-down view", "正顶俯视"], ["worm's-eye view", "贴地仰视"], ["Dutch angle", "荷兰倾斜角"],
        ["over-the-shoulder perspective", "过肩视角"], ["subjective point-of-view perspective", "主观视角"],
    ],
    composition: [
        ["centered symmetrical composition", "中心对称构图"], ["rule-of-thirds composition", "三分法构图"],
        ["foreground framing around the subject", "前景框架构图"], ["leading lines toward the subject", "引导线构图"],
        ["negative space composition", "留白构图"], ["layered foreground, subject, and background", "前中后景分层"],
        ["clean product hero composition", "产品英雄构图"], ["balanced two-subject composition", "双主体平衡构图"],
    ],
    lighting: [
        ["soft natural daylight", "柔和自然日光"], ["warm golden-hour sunlight", "暖色黄金时刻阳光"], ["overcast diffused light", "阴天漫射光"],
        ["high-key commercial lighting", "高调商业灯光"], ["low-key cinematic lighting", "低调电影灯光"], ["dramatic side lighting", "戏剧性侧光"],
        ["soft studio key light with subtle rim light", "柔和棚拍主光与轮廓光"], ["neon practical lighting", "霓虹实景灯光"],
        ["motivated interior practical lighting", "室内动机光"], ["silhouette backlighting", "逆光剪影"],
    ],
    motionPace: [
        ["still and restrained motion", "静态克制"], ["slow deliberate motion", "缓慢明确"], ["natural real-time motion", "自然实时"],
        ["energetic fast motion", "快速有活力"], ["cinematic slow motion", "电影慢动作"], ["speed ramp from slow to fast", "由慢到快变速"],
        ["speed ramp from fast to slow", "由快到慢变速"], ["rhythmic motion synchronized to the beat", "动作与节拍同步"],
    ],
    expression: [
        ["joyful facial performance: the mouth corners rise, the cheeks lift, and subtle crow's-feet form at the outer eyes, conveying joy, satisfaction, or happiness", "快乐 · 嘴角上扬、面颊抬高、眼角带笑纹"],
        ["sad facial performance: the mouth corners lower, the inner eyebrows lift, and the gaze becomes unfocused or tearful, conveying pain, loss, or despair", "悲伤 · 嘴角下垂、眉毛内端上扬、眼神涣散或含泪"],
        ["angry facial performance: the eyebrows draw tightly downward, the gaze turns sharp, and the lips press together or part to show the teeth, conveying displeasure, confrontation, or rage", "愤怒 · 眉毛紧锁下压、眼神锐利、紧抿或露齿"],
        ["fearful facial performance: the eyes open wide with visible sclera, the eyebrows rise, and the mouth parts slightly, conveying terror, helplessness, or imminent danger", "恐惧 · 双眼睁大、眼白显露、眉毛上扬、嘴巴微张"],
        ["surprised facial performance: the eyebrows lift into high arches, the eyes widen, and the jaw drops naturally, conveying sudden shock or astonishment", "惊讶 · 眉毛高挑、眼睛大张、下巴自然下垂"],
        ["disgusted facial performance: the nose wrinkles, the upper lip lifts, and the mouth pulls asymmetrically downward, conveying rejection, aversion, or distaste", "厌恶 · 鼻梁起皱、上唇抬起、嘴角不对称下撇"],
        ["contemptuous facial performance: one corner of the mouth lifts or tightens asymmetrically, conveying arrogance, mockery, or disdain", "轻视／轻蔑 · 单侧嘴角斜向上撇或紧绷"],
    ],
};

const SHOT_TEMPLATE_FIELDS = [
    "cameraAuto", "shotType", "lens", "depth", "camera", "cameraAngle", "composition", "lighting", "motionPace",
    "audioAuto", "ambience", "music", "sfx", "transitionAuto", "transition", "continuity",
];
const SHOT_TEMPLATE_STORAGE = "lh_minimax_h3_shot_templates_v1";
const DIRECTOR_TEMPLATE_FIELDS = [
    "format", "scene", "visualStyle", "characterRules", "cameraRules", "audioRules",
    "musicRules", "continuity", "avoid",
];
const DIRECTOR_TEMPLATE_STORAGE = "lh_minimax_h3_director_templates_v1";
const BUILTIN_DIRECTOR_TEMPLATES = [
    {
        id: "builtin:dialogue",
        label: { en: "Character dialogue", zh: "人物对白" },
        basePrompt: "Create a coherent cinematic dialogue scene featuring one or more explicitly defined characters.",
        values: {
            format: "coherent cinematic dialogue scene",
            scene: "",
            visualStyle: "cinematic, coherent lighting, natural performance, readable facial detail",
            characterRules: "Preserve each referenced character's identity, appearance, clothing, position, and stable speaker ID. Only a character assigned explicit dialogue in the current shot may speak. Non-speaking characters react naturally with closed mouths and no speech-like mouth movement.",
            cameraRules: "Prioritize readable facial performance, eyelines, shot-reverse-shot continuity, group composition, and natural reaction shots. Keep camera movement intentional and do not obscure the active speaker's face.",
            audioRules: "Generate only dialogue explicitly written inside <d>[Language] ...</d>. Preserve the exact words, language, speaker assignment, emotion, delivery, and timing. Do not invent, extend, paraphrase, repeat, or continue dialogue. A shot without explicit dialogue or narration contains no human vocalization.",
            musicRules: "No non-diegetic music unless explicitly requested in a shot.",
            continuity: "Maintain stable speaker IDs, character identity, wardrobe, props, screen direction, eyelines, scene geography, lighting, and emotional progression across shots.",
            avoid: "ad-libbed dialogue, invented speakers, speech from non-speaking characters, identity mixing, duplicated subjects, unstable anatomy, flicker, accidental subtitles, logos, or watermarks",
        },
    },
    {
        id: "builtin:environment",
        label: { en: "Environment / B-roll", zh: "环境过场" },
        basePrompt: "Create a cinematic establishing shot, environmental shot, cutaway, or transitional B-roll sequence based on the described scene and references.",
        values: {
            format: "cinematic establishing shot or transitional B-roll sequence",
            scene: "",
            visualStyle: "cinematic environmental photography, coherent lighting, natural atmospheric motion",
            characterRules: "Do not add people, faces, performers, speakers, crowds, silhouettes, reflections of people, or human-like figures unless they are explicitly named or provided as referenced subjects.",
            cameraRules: "Use establishing composition, environmental scale, spatial depth, controlled camera movement, and visually motivated reveals. Avoid portrait framing, speaker framing, interview composition, and dialogue coverage.",
            audioRules: "No dialogue, narration, voiceover, singing, muttering, babble, or other human vocalization. Use only explicitly specified environmental ambience and physical sound effects. Empty ambience and sound-effect fields mean silence.",
            musicRules: "No non-diegetic music unless explicitly requested in a shot.",
            continuity: "Preserve environment layout, architecture, weather, time of day, lighting direction, object placement, motion direction, and atmospheric continuity.",
            avoid: "unrequested people or human-like figures, portrait composition, dialogue, lip-sync performance, accidental subtitles, logos, or watermarks",
        },
    },
    {
        id: "builtin:general",
        label: { en: "General purpose", zh: "通用导演" },
        basePrompt: "Create a coherent cinematic audiovisual sequence that follows the shot timeline, referenced subjects, explicit actions, and requested sound.",
        values: {
            format: "coherent cinematic audiovisual sequence",
            scene: "",
            visualStyle: "cinematic, coherent lighting, natural motion",
            characterRules: "Preserve all explicitly referenced subjects. Do not introduce additional primary characters or merge identities. Characters speak only when explicit dialogue is assigned to them.",
            cameraRules: "Follow the camera settings defined by each shot. When a setting is automatic or unspecified, choose a restrained and visually motivated cinematic treatment appropriate to the subject.",
            audioRules: "Generate only explicitly requested dialogue, narration, ambience, and physical sound effects. Empty dialogue and narration fields mean no human vocalization. Empty ambience and sound-effect fields mean silence.",
            musicRules: "Generate non-diegetic music only when it is explicitly requested. An empty music field means no music.",
            continuity: "Maintain identity, wardrobe, props, geography, lighting, screen direction, action progression, reference roles, and audio continuity across the complete timeline.",
            avoid: "unrequested subjects, invented dialogue or narration, identity mixing, duplicated subjects, unstable anatomy, flicker, accidental subtitles, logos, or watermarks",
        },
    },
];

function hideWidget(item) {
    if (!item) return;
    item.hidden = true;
    item.type = "converted-widget";
    item.computeSize = () => [0, -4];
    item.draw = () => {};
    if (item.element) item.element.style.display = "none";
}

function widget(node, name) {
    return node.widgets?.find((item) => item.name === name);
}

function esc(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function options(values, selected, labels = {}) {
    return values.map((value) => `<option value="${esc(value)}" ${value === selected ? "selected" : ""}>${esc(labels[value] || value)}</option>`).join("");
}

function makeId(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function round(value, step = 0.1) {
    return Math.round(value / step) * step;
}

function mediaTypeFor(file) {
    for (const type of REF_TYPES) if (file.type?.startsWith(`${type}/`)) return type;
    const extension = String(file.name || "").split(".").pop().toLowerCase();
    return REF_TYPES.find((type) => EXTENSIONS[type].has(extension)) || null;
}

function viewUrl(path) {
    return api.apiURL(`/view?filename=${encodeURIComponent(path)}&type=input`);
}

async function uploadFile(file) {
    const form = new FormData();
    form.append("image", file, file.name);
    form.append("type", "input");
    form.append("overwrite", "false");
    const response = await api.fetchApi("/upload/image", { method: "POST", body: form });
    if (!response.ok) throw new Error(`Upload failed (${response.status}).`);
    const result = await response.json();
    return result.subfolder ? `${result.subfolder}/${result.name}` : result.name;
}

async function probeDuration(path, type) {
    if (type === "image") return 0;
    const media = document.createElement(type === "video" ? "video" : "audio");
    media.preload = "metadata";
    media.src = viewUrl(path);
    return await new Promise((resolve) => {
        const done = (value) => { media.remove(); resolve(Number.isFinite(value) ? value : 0); };
        media.onloadedmetadata = () => done(media.duration);
        media.onerror = () => done(0);
    });
}

function defaultGlobal() {
    return {
        format: "single continuous cinematic clip",
        scene: "",
        visualStyle: "cinematic, coherent lighting, natural motion",
        characterRules: "Keep every named subject visually distinct and temporally consistent.",
        cameraRules: "Use stable, intentional camera movement and preserve screen direction.",
        audioRules: "Generate only explicitly requested ambience and physical sound effects. Empty sound fields mean silence.",
        musicRules: "N/A",
        continuity: "Maintain identity, wardrobe, props, geography, lighting, and action continuity between shots.",
        avoid: "identity mixing, duplicated subjects, extra limbs, unstable anatomy, flicker, frozen expressions, accidental subtitles, logos, or watermarks",
    };
}

function defaultReference(duration, type = "image", index = 1) {
    const purposes = { image: "identity", video: "motion", audio: "voice" };
    return {
        id: makeId("ref"), name: `Reference_${index}`, type, subject: "", description: "", purpose: purposes[type],
        mode: "preserve", fidelity: type === "image" ? "strict" : "balanced",
        retention: "auto", start: 0, end: duration, duration: 0, pairedVideoId: "", frameRole: "reference",
        audioMode: "reference", audioRoles: [], speakerRefId: "", speakerDescription: "", audioRetention: "auto", audioNotes: "",
        mediaMode: type === "video" ? "video" : "video", sourcePath: "", sourceDuration: 0,
        trimStart: 0, trimEnd: null, attachedAudioPath: "", waveformPeaks: [], notes: "", enabled: true, timelinePinned: false, timelineShotId: "",
    };
}

function defaultShot(duration, start = 0, index = 1) {
    return {
        id: makeId("shot"), title: `Shot ${index}`, start, end: duration, shotType: "medium shot",
        lens: "", depth: "", camera: "", cameraAngle: "", composition: "", lighting: "", motionPace: "", subjects: "", action: "", expression: "",
        dialogue: "", speaker: "", voice: "", language: "Chinese", dialogueStart: "", dialogueEnd: "", cutoff: false,
        narration: "", narrator: "", narrationVoice: "", narrationLanguage: "Chinese", narrationStart: "", narrationEnd: "", narrationCutoff: false,
        ambience: "", music: "", sfx: "",
        cameraAuto: false, audioAuto: false, transitionAuto: false,
        transition: "cut", continuity: "", referenceIds: [],
        promptOverrideEnabled: false, promptOverride: "",
        directionMode: index === 1 ? "master" : "inherit", directionOverrides: {},
    };
}

function emptyPlan(duration) {
    return { version: VERSION, kind: KIND, duration, settings: { promptMode: "director", snap: 0.1, uiLanguage: "zh", uiFontSize: 12, uiMode: "director" }, global: defaultGlobal(), references: [], shots: [] };
}

function normalizeData(raw, duration) {
    const plan = emptyPlan(duration);
    if (!raw || typeof raw !== "object") return plan;
    plan.settings = { ...plan.settings, ...(raw.settings || {}) };
    plan.settings.uiFontSize = clamp(Number(plan.settings.uiFontSize || 12), 10, 18);
    plan.settings.uiMode = plan.settings.uiMode === "simple" ? "simple" : "director";
    delete plan.settings.speechGapFill;
    delete plan.settings.speech_gap_fill;
    plan.global = { ...plan.global, ...(raw.global || {}) };
    if (plan.global.audioRules === "Generate clean synchronized stereo audio. Keep dialogue intelligible.") plan.global.audioRules = defaultGlobal().audioRules;
    if (plan.global.audioRules === "Natural synchronized stereo ambience and physical sounds support the visible action.") plan.global.audioRules = defaultGlobal().audioRules;
    if (plan.global.musicRules === "Use music only when requested and keep it subordinate to dialogue.") plan.global.musicRules = "N/A";
    if ([
        "Construct each shot from its explicitly described subjects, environment, actions, camera direction, and reference relationships. Do not assume an unstated genre, performer, or location.",
        "Stage the explicitly described setting so the active speakers and their facial performances remain readable. Preserve clear spatial relationships between all characters.",
        "Treat the explicitly described environment, location, object, atmosphere, weather, or visual event as the primary subject. Do not introduce a foreground performer unless explicitly requested.",
    ].includes(plan.global.scene)) plan.global.scene = "";
    delete plan.global.visibleText;
    plan.references = Array.isArray(raw.references) ? raw.references.map((ref, index) => {
        const type = REF_TYPES.includes(ref.type) ? ref.type : "image";
        const mediaMode = MEDIA_MODES.includes(ref.mediaMode || ref.media_mode) ? (ref.mediaMode || ref.media_mode) : "video";
        const hasAudio = type === "audio" || (type === "video" && mediaMode !== "video");
        const legacyRetention = RETENTIONS.includes(ref.retention) ? ref.retention : "auto";
        let audioRoles = Array.isArray(ref.audioRoles || ref.audio_roles) ? (ref.audioRoles || ref.audio_roles).filter((role) => AUDIO_ROLES.includes(role)) : [];
        if (hasAudio && !audioRoles.length) {
            audioRoles = ref.purpose === "voice" ? ["voice_timbre", "voice_delivery"]
                : ref.purpose === "music" ? ["music_style"] : ref.purpose === "sfx" ? ["sound_effect"] : ["audio_continuity"];
        }
        return {
            ...defaultReference(duration, type, index + 1), ...ref,
            mode: MODES.includes(ref.mode) ? ref.mode : "preserve",
            fidelity: FIDELITIES.includes(ref.fidelity) ? ref.fidelity : "balanced",
            retention: VISUAL_RETENTIONS.includes(legacyRetention) ? legacyRetention : "auto",
            frameRole: FRAME_ROLES.includes(ref.frameRole || ref.frame_role)
                ? (ref.frameRole || ref.frame_role)
                : type === "video" && ref.purpose === "edit_source" ? "edit_source" : "reference",
            audioMode: AUDIO_MODES.includes(ref.audioMode || ref.audio_mode) ? (ref.audioMode || ref.audio_mode) : "reference",
            audioRoles,
            speakerRefId: ref.speakerRefId || ref.speaker_ref_id || "",
            speakerDescription: ref.speakerDescription || ref.speaker_description || "",
            audioNotes: ref.audioNotes || ref.audio_notes || (hasAudio && type === "audio" ? ref.notes || "" : ""),
            audioRetention: AUDIO_RETENTIONS.includes(ref.audioRetention || ref.audio_retention)
                ? (ref.audioRetention || ref.audio_retention) : type === "audio" && AUDIO_RETENTIONS.includes(legacyRetention) ? legacyRetention : "auto",
            mediaMode,
            description: ref.description || ref.subjectDescription || ref.subject_description || "",
            sourcePath: ref.sourcePath || ref.value || "",
            sourceDuration: Number(ref.sourceDuration ?? ref.source_duration ?? 0),
            trimStart: Number(ref.trimStart ?? ref.trim_start ?? 0),
            trimEnd: ref.trimEnd ?? ref.trim_end ?? null,
            attachedAudioPath: ref.attachedAudioPath || ref.audio || "",
            waveformPeaks: Array.isArray(ref.waveformPeaks || ref.waveform_peaks) ? (ref.waveformPeaks || ref.waveform_peaks) : [],
            timelinePinned: ref.timelinePinned === true || ref.timeline_pinned === true,
            timelineShotId: ref.timelineShotId || ref.timeline_shot_id || "",
        };
    }) : [];
    plan.shots = Array.isArray(raw.shots) ? raw.shots.map((shot, index) => {
        const normalized = {
            ...defaultShot(duration, Number(shot.start || 0), index + 1), ...shot,
            language: shot.language === "Mandarin Chinese" ? "Chinese" : shot.language || "Chinese",
            narrationLanguage: shot.narrationLanguage === "Mandarin Chinese" ? "Chinese" : shot.narrationLanguage || "Chinese",
            referenceIds: Array.isArray(shot.referenceIds) ? shot.referenceIds : [],
            directionMode: index === 0 ? "master" : shot.directionMode === "custom" ? "custom" : "inherit",
            directionOverrides: shot.directionOverrides && typeof shot.directionOverrides === "object" ? shot.directionOverrides : {},
            promptOverrideEnabled: shot.promptOverrideEnabled === true || shot.prompt_override_enabled === true,
            promptOverride: shot.promptOverride || shot.prompt_override || "",
            cameraAuto: shot.cameraAuto === true || shot.camera_auto === true,
            audioAuto: shot.audioAuto === true || shot.audio_auto === true,
            transitionAuto: shot.transitionAuto === true || shot.transition_auto === true,
        };
        if (shot.voiceover === true && !shot.narration) {
            normalized.narration = shot.dialogue || "";
            normalized.narrator = shot.speaker || "";
            normalized.narrationVoice = shot.voice || "";
            normalized.narrationLanguage = shot.language === "Mandarin Chinese" ? "Chinese" : shot.language || "Chinese";
            normalized.narrationStart = shot.dialogueStart ?? "";
            normalized.narrationEnd = shot.dialogueEnd ?? "";
            normalized.narrationCutoff = shot.cutoff === true;
            normalized.dialogue = "";
            normalized.speaker = "";
            normalized.voice = "";
            normalized.dialogueStart = "";
            normalized.dialogueEnd = "";
            normalized.cutoff = false;
        }
        delete normalized.voiceover;
        return normalized;
    }) : [];
    return plan;
}

function initialData(node) {
    const duration = Number(widget(node, "duration_seconds")?.value || 5);
    try {
        return normalizeData(JSON.parse(widget(node, "director_data")?.value || "{}"), duration);
    } catch {
        return emptyPlan(duration);
    }
}

function presetPlan(name, duration) {
    const plan = emptyPlan(duration);
    const split = Math.min(duration, Math.max(1, duration * 0.55));
    const third = duration / 3;
    const visualRef = (alias, subject, purpose = "identity") => {
        const ref = defaultReference(duration, "image", plan.references.length + 1);
        Object.assign(ref, { name: alias, subject, purpose, fidelity: purpose === "style" ? "balanced" : "strict", description: "" });
        plan.references.push(ref);
        return ref;
    };
    if (name.startsWith("simple_")) plan.settings.uiMode = "simple";
    if (name === "simple_single") {
        visualRef("Character", "main character");
        const shot = defaultShot(duration, 0, 1);
        Object.assign(shot, { title: "Single-character performance", subjects: "@Character", action: "@Character begins in a clear resting pose, performs the requested action with readable expression and body language, then settles into a clear final state.", cameraAuto: true, transitionAuto: true });
        plan.shots = [shot];
    } else if (name === "simple_dual") {
        visualRef("Character_A", "first character");
        visualRef("Character_B", "second character");
        const a = defaultShot(duration, 0, 1);
        const b = defaultShot(duration, third, 2);
        const c = defaultShot(duration, third * 2, 3);
        Object.assign(a, { title: "Two-person establish", end: third, subjects: "@Character_A, @Character_B", action: "A balanced two-shot establishes @Character_A and @Character_B facing each other in the shared scene.", cameraAuto: true });
        Object.assign(b, { title: "Character A speaks", end: third * 2, subjects: "@Character_A, @Character_B", action: "@Character_A (S1) reacts naturally and says, <d>[Chinese] 请替换第一句台词。</d>. @Character_B listens without speaking.", cameraAuto: true });
        Object.assign(c, { title: "Character B replies", subjects: "@Character_A, @Character_B", action: "@Character_B (S2) responds with a clear change in expression and says, <d>[Chinese] 请替换第二句台词。</d>. @Character_A listens without speaking.", cameraAuto: true });
        plan.shots = [a, b, c];
    } else if (name === "simple_silent") {
        visualRef("Character", "main character");
        const shot = defaultShot(duration, 0, 1);
        Object.assign(shot, { title: "Silent action", subjects: "@Character", action: "@Character performs a complete visible action from initial state through physical change to a clear result, using expression and body language without speaking.", cameraAuto: true, ambience: "", music: "", sfx: "", transitionAuto: true });
        plan.shots = [shot];
    } else if (name === "simple_scene") {
        visualRef("Environment", "main environment", "scene");
        plan.global.scene = "@Environment defines the location, layout, atmosphere, and important environmental details.";
        const shot = defaultShot(duration, 0, 1);
        Object.assign(shot, { title: "Environment reveal", subjects: "@Environment", action: "The shot reveals the environment from its strongest establishing composition, showing foreground, middle ground, background, light, atmosphere, and subtle environmental motion.", cameraAuto: true, audioAuto: true, transitionAuto: true });
        plan.shots = [shot];
    } else if (name === "simple_product") {
        visualRef("Product", "hero product", "object");
        plan.global.format = "polished cinematic product showcase";
        plan.global.visualStyle = "premium commercial lighting, precise material detail, clean composition";
        const shot = defaultShot(duration, 0, 1);
        Object.assign(shot, { title: "Product reveal", subjects: "@Product", action: "Light reveals @Product's form and material as it moves from an introductory composition into a clean final hero pose.", cameraAuto: true, transitionAuto: true });
        plan.shots = [shot];
    } else if (name === "simple_multi") {
        visualRef("Character", "main character");
        visualRef("Environment", "main environment", "scene");
        plan.global.scene = "@Environment is the continuous setting for all three shots.";
        const a = defaultShot(duration, 0, 1);
        const b = defaultShot(duration, third, 2);
        const c = defaultShot(duration, third * 2, 3);
        Object.assign(a, { title: "Establish", end: third, subjects: "@Character, @Environment", action: "An establishing view introduces @Character's position inside @Environment and the initial situation.", cameraAuto: true });
        Object.assign(b, { title: "Action", end: third * 2, subjects: "@Character, @Environment", action: "@Character performs the main action with clear physical progression and interaction with the environment.", cameraAuto: true });
        Object.assign(c, { title: "Result", subjects: "@Character, @Environment", action: "The final shot shows the result of the action and @Character's reaction in a resolved closing composition.", cameraAuto: true });
        plan.shots = [a, b, c];
    } else if (name === "performance") {
        plan.global.scene = "A clean performance space with an unobstructed view of the speaker's face.";
        plan.global.audioRules = "Generate clean dialogue with precise natural lip sync and subtle room tone. No narrator or overlapping speech.";
        const image = defaultReference(duration, "image", 1);
        Object.assign(image, { name: "Performer", subject: "main performer", purpose: "identity", fidelity: "strict", notes: "Preserve face, hair, wardrobe, proportions, and distinctive details." });
        const audio = defaultReference(duration, "audio", 2);
        Object.assign(audio, { name: "Voice", subject: "main performer", purpose: "voice", fidelity: "strong", audioMode: "reference", audioRoles: ["voice_timbre", "voice_delivery"], speakerRefId: image.id, audioNotes: "Match vocal identity, language, cadence, and emotion without copying unwanted background noise." });
        plan.references = [image, audio];
        const shot = defaultShot(duration, 0, 1);
        Object.assign(shot, { title: "Direct-to-camera performance", subjects: "@Performer", action: "@Performer (S1) looks toward camera, speaks with restrained expressive gestures, and says, <d>[Chinese] 请替换准确台词。</d>, using @Voice for voice timbre and delivery.", camera: "stable eye-level framing with a subtle push-in" });
        plan.shots = [shot];
    } else if (name === "motion") {
        plan.global.format = "single continuous motion-transfer shot";
        const image = defaultReference(duration, "image", 1);
        Object.assign(image, { name: "Character", purpose: "identity", fidelity: "strict", notes: "Preserve the character's identity and design; do not copy the source motion performer's appearance." });
        const video = defaultReference(duration, "video", 2);
        Object.assign(video, { name: "Motion", purpose: "motion", mode: "borrow", notes: "Borrow body timing, gesture rhythm, contact, and weight while keeping @Character's identity." });
        plan.references = [image, video];
        const shot = defaultShot(duration, 0, 1);
        Object.assign(shot, { title: "Motion transfer", subjects: "@Character", action: "@Character performs the motion from @Motion with believable weight and secondary motion", camera: "Borrow only the camera behavior from @Motion if it supports the action" });
        plan.shots = [shot];
    } else if (name === "product") {
        plan.global.format = "polished multi-shot product advertisement";
        plan.global.visualStyle = "premium commercial lighting, precise materials, clean brand-safe composition";
        const product = defaultReference(duration, "image", 1);
        Object.assign(product, { name: "Product", subject: "hero product", purpose: "object", fidelity: "strict", notes: "Preserve exact geometry, material, color, label placement, and proportions." });
        const style = defaultReference(duration, "image", 2);
        Object.assign(style, { name: "Style", purpose: "style", mode: "inspire", fidelity: "loose", notes: "Borrow palette and lighting mood without changing @Product." });
        plan.references = [product, style];
        const a = defaultShot(duration, 0, 1);
        Object.assign(a, { title: "Reveal", end: split, shotType: "macro hero shot", subjects: "@Product", action: "Light sweeps across @Product and reveals its materials", camera: "slow controlled orbit" });
        const b = defaultShot(duration, split, 2);
        Object.assign(b, { title: "Payoff", subjects: "@Product", action: "@Product settles into a clean final hero composition", camera: "gentle pull back", transition: "seamless motivated cut" });
        plan.shots = [a, b];
    } else if (name === "remix") {
        plan.global.format = "reference-video edit and regeneration";
        const source = defaultReference(duration, "video", 1);
        Object.assign(source, { name: "Source", purpose: "edit_source", mode: "transform", fidelity: "strong", notes: "Preserve requested timing, action, camera, and composition; regenerate only the changes described in the shot plan." });
        const identity = defaultReference(duration, "image", 2);
        Object.assign(identity, { name: "Replacement", purpose: "identity", mode: "replace", fidelity: "strict", notes: "Replace the designated subject while preserving @Source's action and scene interaction." });
        plan.references = [source, identity];
        const shot = defaultShot(duration, 0, 1);
        Object.assign(shot, { title: "Controlled regeneration", subjects: "@Replacement", action: "Replace the main subject in @Source with @Replacement while preserving motion, timing, contact, camera, and background continuity" });
        plan.shots = [shot];
    }
    return plan;
}

class DirectorUI {
    constructor(node, host, uiWidget) {
        this.node = node;
        this.host = host;
        this.uiWidget = uiWidget;
        this.data = initialData(node);
        this.tab = "timeline";
        this.selection = this.data.shots[0] ? { kind: "shot", id: this.data.shots[0].id } : null;
        this.activeShotId = this.data.shots[0]?.id || null;
        this.activeRefId = this.data.references.find((ref) => ref.type === "image" || (ref.type === "video" && ref.mediaMode !== "audio"))?.id || this.data.references[0]?.id || null;
        this.expandedSections = new Set();
        this.playhead = 0;
        this.status = "Drop or upload media to build real H3 references.";
        this.pendingUpload = null;
        this.fileInput = document.createElement("input");
        this.fileInput.type = "file";
        this.fileInput.multiple = true;
        this.fileInput.hidden = true;
        this.fileInput.onchange = async () => {
            const files = [...(this.fileInput.files || [])];
            this.fileInput.value = "";
            await this.acceptFiles(files, this.pendingUpload);
            this.pendingUpload = null;
        };
        host.append(this.fileInput);
        this.durationWidget = widget(node, "duration_seconds");
        this.basePromptWidget = widget(node, "base_prompt");
        this.originalDurationCallback = this.durationWidget?.callback;
        if (this.durationWidget) {
            this.durationWidget.callback = (...args) => {
                this.originalDurationCallback?.apply(this.durationWidget, args);
                this.setDuration(this.durationWidget.value);
                this.write();
                this.render();
            };
        }
        this.render();
    }

    destroy() {
        if (this.durationWidget) this.durationWidget.callback = this.originalDurationCallback;
        cancelAnimationFrame(this.layoutFrame);
        this.closeAliasMenu();
        this.previewModal?.remove();
        this.fileInput?.remove();
    }

    duration() {
        return Math.max(0.01, Number(this.durationWidget?.value || this.data.duration || 5));
    }

    timelineDuration() {
        return Math.max(TIMELINE_DURATION, Math.ceil(this.duration() / 5) * 5);
    }

    setDuration(value) {
        const previous = Math.max(0.01, Number(this.data.duration || this.durationWidget?.value || 5));
        const duration = clamp(Number(value || previous), 0.01, 60);
        if (this.durationWidget) this.durationWidget.value = duration;
        this.data.duration = duration;
        for (const item of [...this.data.references, ...this.data.shots]) {
            const followsBoundary = Math.abs(Number(item.end ?? previous) - previous) <= 0.01;
            item.start = clamp(Number(item.start || 0), 0, duration);
            item.end = followsBoundary ? duration : clamp(Number(item.end ?? duration), item.start, duration);
        }
    }

    syncDurationToShots() {
        const shotEnd = Math.max(0, ...this.data.shots.map((shot) => Number(shot.end || 0)));
        if (!shotEnd || Math.abs(shotEnd - this.duration()) <= 0.001) return false;
        if (this.durationWidget) this.durationWidget.value = shotEnd;
        this.data.duration = shotEnd;
        return true;
    }

    isChinese() {
        return this.data.settings.uiLanguage !== "en";
    }

    toggleLanguage() {
        this.data.settings.uiLanguage = this.isChinese() ? "en" : "zh";
        this.write();
        this.render();
    }

    sectionOpen(shot, section) {
        return this.expandedSections.has(`${shot.id}:${section}`) ? " open" : "";
    }

    localize() {
        if (!this.isChinese()) return;
        const replaceText = (value) => {
            const leading = value.match(/^\s*/)?.[0] || "";
            const trailing = value.match(/\s*$/)?.[0] || "";
            const core = value.trim();
            if (!core) return value;
            if (UI_ZH[core]) return leading + UI_ZH[core] + trailing;
            if (/^References \(\d+\)$/.test(core)) return leading + core.replace("References", "参考素材") + trailing;
            if (/^Reference · /.test(core)) return leading + core.replace("Reference · ", "参考素材 · ") + trailing;
            if (/^Source crop /.test(core)) return leading + core.replace("Source crop", "源裁剪") + trailing;
            if (/^Video \d+:/.test(core)) return leading + core.replace("Video", "视频") + trailing;
            return value;
        };
        const walker = document.createTreeWalker(this.host, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        for (const node of nodes) node.nodeValue = replaceText(node.nodeValue);
        this.host.querySelectorAll("[placeholder]").forEach((element) => {
            if (UI_ZH[element.placeholder]) element.placeholder = UI_ZH[element.placeholder];
        });
    }

    scheduleLayout() {
        cancelAnimationFrame(this.layoutFrame);
        this.layoutFrame = requestAnimationFrame(() => {
            const panel = this.host.querySelector(".h3d");
            if (!panel || !this.uiWidget) return;
            const uiHeight = Math.max(680, Math.ceil(panel.scrollHeight + 6));
            this.uiWidget.computeSize = (width) => [width, uiHeight];
            const computed = this.node.computeSize?.() || [this.node.size?.[0] || 1200, uiHeight + 170];
            const width = Math.max(1200, this.node.size?.[0] || 0, computed[0] || 0);
            const height = Math.max(uiHeight + 120, computed[1] || 0);
            if (Math.abs((this.node.size?.[1] || 0) - height) > 2 || (this.node.size?.[0] || 0) < width) this.node.setSize?.([width, height]);
            this.node.graph?.setDirtyCanvas(true, true);
        });
    }

    write() {
        this.data.version = VERSION;
        this.data.kind = KIND;
        this.data.duration = this.duration();
        const target = widget(this.node, "director_data");
        if (target) target.value = JSON.stringify(this.data);
        this.node.setDirtyCanvas(true, true);
    }

    find(kind, id) {
        return (kind === "ref" ? this.data.references : this.data.shots).find((item) => item.id === id);
    }

    selected() {
        return this.selection ? this.find(this.selection.kind, this.selection.id) : null;
    }

    activeShot() {
        if (this.selection?.kind === "shot") return this.find("shot", this.selection.id);
        return this.find("shot", this.activeShotId) || [...this.data.shots].sort((a, b) => Number(a.start) - Number(b.start))[0] || null;
    }

    effectivePromptSources() {
        const sources = [this.basePromptWidget?.value || "", ...Object.values(this.data.global || {})];
        for (const shot of this.data.shots) sources.push(...this.shotPromptSources(shot));
        return sources.filter(Boolean).map(String);
    }

    shotPromptSources(shot) {
        const sources = [];
        const visualFields = ["title", "subjects", "action", "expression"];
        const cameraFields = ["shotType", "lens", "depth", "camera", "cameraAngle", "composition", "lighting", "motionPace"];
        if (shot.promptOverrideEnabled && shot.promptOverride) return [shot.title, shot.promptOverride].filter(Boolean).map(String);
        sources.push(...visualFields.map((field) => shot[field] || ""));
        if (!shot.cameraAuto) sources.push(...cameraFields.map((field) => shot[field] || ""));
        if (shot.dialogue) sources.push(shot.speaker, shot.voice, shot.dialogue);
        if (shot.narration) sources.push(shot.narrator, shot.narrationVoice, shot.narration);
        if (!shot.audioAuto) sources.push(shot.ambience, shot.music, shot.sfx);
        if (shot.continuity) sources.push(shot.continuity);
        if (!shot.transitionAuto && shot.transition) sources.push(shot.transition);
        if (shot.directionMode === "custom") sources.push(...Object.values(shot.directionOverrides || {}));
        return sources.filter(Boolean).map(String);
    }

    referencesFromSources(initialSources) {
        const refs = this.data.references.filter((ref) => ref.enabled !== false);
        const used = new Set();
        let sources = [...initialSources];
        while (sources.length) {
            const text = sources.join("\n");
            sources = [];
            for (const ref of refs) {
                if (used.has(ref.id)) continue;
                const aliases = [ref.name];
                if (ref.type === "video" && ref.mediaMode === "video_audio") aliases.push(`${ref.name}_Audio`);
                const matched = aliases.some((alias) => new RegExp(`(^|[^\\w])@${String(alias).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w-])`, "i").test(text));
                if (!matched) continue;
                used.add(ref.id);
                sources.push(ref.subject, ref.description, ref.notes, ref.audioNotes, ref.speakerDescription);
            }
            sources = sources.filter(Boolean).map(String);
        }
        return refs.filter((ref) => used.has(ref.id));
    }

    promptReferences() {
        return this.referencesFromSources(this.effectivePromptSources());
    }

    shotPromptReferences(shot) {
        const globalRefs = this.referencesFromSources([this.basePromptWidget?.value || "", ...Object.values(this.data.global || {})]);
        const shotRefs = this.referencesFromSources(this.shotPromptSources(shot));
        const ids = new Set([...globalRefs, ...shotRefs].map((ref) => ref.id));
        for (const id of shot.referenceIds || []) ids.add(id);
        return this.promptReferences().filter((ref) => ids.has(ref.id));
    }

    timelineReferences() {
        const promptIds = new Set(this.promptReferences().map((ref) => ref.id));
        return this.data.references.filter((ref) => ref.enabled !== false && (ref.timelinePinned === true || promptIds.has(ref.id)));
    }

    select(kind, id) {
        this.selection = { kind, id };
        if (kind === "shot") this.activeShotId = id;
        if (kind === "ref") this.activeRefId = id;
        this.render();
    }

    addReference(type, timelinePinned = false) {
        const ref = defaultReference(this.duration(), type, this.data.references.length + 1);
        ref.timelinePinned = timelinePinned;
        this.data.references.push(ref);
        this.selection = { kind: "ref", id: ref.id };
        this.activeRefId = ref.id;
        this.write();
        this.render();
    }

    pinReference(refId, time = null) {
        const ref = this.find("ref", refId);
        if (!ref) return;
        ref.timelinePinned = true;
        ref.timelineShotId = "";
        if (Number.isFinite(time)) {
            const shot = this.data.shots.find((item) => Number(item.start) <= time && Number(item.end) >= time);
            if (shot) {
                ref.start = Number(shot.start);
                ref.end = Number(shot.end);
                ref.timelineShotId = shot.id;
            }
        }
        this.selection = { kind: "ref", id: ref.id };
        this.activeRefId = ref.id;
        this.write();
        this.render();
    }

    unpinReference(refId) {
        const ref = this.find("ref", refId);
        if (!ref) return;
        ref.timelinePinned = false;
        ref.timelineShotId = "";
        this.write();
        this.render();
    }

    syncPinnedReferences(shot) {
        for (const ref of this.data.references) {
            if (ref.timelinePinned && ref.timelineShotId === shot.id) {
                ref.start = Number(shot.start);
                ref.end = Number(shot.end);
            }
        }
    }

    chooseMedia(type = null, refId = null, attachedAudio = false) {
        this.pendingUpload = { type, refId, attachedAudio };
        this.fileInput.accept = attachedAudio ? "audio/*" : type ? `${type}/*` : "image/*,video/*,audio/*";
        this.fileInput.multiple = !refId && !attachedAudio;
        this.host.append(this.fileInput);
        this.fileInput.click();
    }

    async waveform(path, ref) {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const response = await fetch(viewUrl(path));
            const buffer = await context.decodeAudioData(await response.arrayBuffer());
            const samples = buffer.getChannelData(0);
            const count = 120;
            const step = Math.max(1, Math.floor(samples.length / count));
            ref.waveformPeaks = Array.from({ length: count }, (_, index) => {
                let peak = 0;
                for (let cursor = index * step; cursor < Math.min(samples.length, (index + 1) * step); cursor++) peak = Math.max(peak, Math.abs(samples[cursor]));
                return peak;
            });
            await context.close?.();
        } catch (error) {
            console.warn("[LH MiniMax H3 Director] waveform decode failed", error);
        }
    }

    async acceptFiles(files, request = null) {
        for (const file of files) {
            const type = mediaTypeFor(file);
            if (!type || (request?.type && request.type !== type) || (request?.attachedAudio && type !== "audio")) {
                this.status = `Unsupported media: ${file.name}`;
                continue;
            }
            try {
                this.status = `Uploading ${file.name}...`;
                this.render();
                const path = await uploadFile(file);
                const duration = await probeDuration(path, type);
                if (request?.attachedAudio) {
                    const target = this.find("ref", request.refId);
                    if (target) target.attachedAudioPath = path;
                } else {
                    let ref = request?.refId ? this.find("ref", request.refId) : null;
                    if (!ref) {
                        ref = defaultReference(this.duration(), type, this.data.references.length + 1);
                        this.data.references.push(ref);
                    }
                    ref.type = type;
                    ref.sourcePath = path;
                    ref.sourceDuration = duration;
                    ref.trimStart = 0;
                    ref.trimEnd = duration ? Math.min(duration, 15) : null;
                    ref.duration = ref.trimEnd ?? 0;
                    ref.name = ref.name.startsWith("Reference_") ? file.name.replace(/\.[^.]+$/, "").replace(/[^\w.-]+/g, "_") : ref.name;
                    if (type === "audio") await this.waveform(path, ref);
                    this.selection = { kind: "ref", id: ref.id };
                    this.activeRefId = ref.id;
                }
                this.status = `${file.name} ready${duration > 15 ? "; crop limited to first 15s" : ""}.`;
                this.write();
            } catch (error) {
                this.status = error.message;
            }
        }
        this.render();
    }

    clearMedia(refId, attachedAudio = false) {
        const ref = this.find("ref", refId);
        if (!ref) return;
        if (attachedAudio) ref.attachedAudioPath = "";
        else Object.assign(ref, { sourcePath: "", sourceDuration: 0, trimStart: 0, trimEnd: null, duration: 0, waveformPeaks: [] });
        this.write();
        this.render();
    }

    addShot() {
        const sorted = [...this.data.shots].sort((a, b) => Number(a.start) - Number(b.start));
        const latest = sorted.at(-1);
        const start = Math.max(0, ...sorted.map((item) => Number(item.end || 0)));
        const previousLength = latest ? Number(latest.end || 0) - Number(latest.start || 0) : this.duration();
        const length = clamp(previousLength || 5, 1, 5);
        const end = Math.min(60, start + length);
        if (end - start < 1 / FPS) {
            this.status = "The 60-second timeline limit has been reached.";
            this.render();
            return;
        }
        const shot = defaultShot(end, start, this.data.shots.length + 1);
        shot.end = end;
        this.data.shots.push(shot);
        this.selection = { kind: "shot", id: shot.id };
        this.activeShotId = shot.id;
        this.syncDurationToShots();
        this.write();
        this.render();
    }

    shotNeighbors(shot) {
        const sorted = [...this.data.shots].sort((a, b) => Number(a.start) - Number(b.start) || Number(a.end) - Number(b.end));
        const index = sorted.indexOf(shot);
        return {
            previousEnd: index > 0 ? Number(sorted[index - 1].end || 0) : 0,
            nextStart: index >= 0 && index < sorted.length - 1 ? Number(sorted[index + 1].start || this.timelineDuration()) : this.timelineDuration(),
        };
    }

    remove(kind, id) {
        const list = kind === "ref" ? this.data.references : this.data.shots;
        const index = list.findIndex((item) => item.id === id);
        if (index < 0) return;
        const removed = list[index];
        list.splice(index, 1);
        if (kind === "shot" && this.activeShotId === id) this.activeShotId = this.data.shots[0]?.id || null;
        if (kind === "ref") {
            for (const shot of this.data.shots) shot.referenceIds = (shot.referenceIds || []).filter((refId) => refId !== id);
            for (const ref of this.data.references) if (ref.pairedVideoId === id) ref.pairedVideoId = "";
            for (const ref of this.data.references) if (ref.speakerRefId === id) ref.speakerRefId = "";
            if (this.activeRefId === id) this.activeRefId = this.data.references[Math.min(index, this.data.references.length - 1)]?.id || null;
        }
        if (kind === "shot") {
            for (const ref of this.data.references) {
                const legacyMatch = ref.timelinePinned
                    && !ref.timelineShotId
                    && Math.abs(Number(ref.start) - Number(removed.start)) <= 0.01
                    && Math.abs(Number(ref.end) - Number(removed.end)) <= 0.01;
                if (ref.timelineShotId === id || legacyMatch) {
                    ref.timelinePinned = false;
                    ref.timelineShotId = "";
                }
            }
            this.syncDurationToShots();
        }
        this.selection = null;
        this.write();
        this.render();
    }

    moveReference(id, direction) {
        const index = this.data.references.findIndex((ref) => ref.id === id);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= this.data.references.length) return;
        [this.data.references[index], this.data.references[target]] = [this.data.references[target], this.data.references[index]];
        this.write();
        this.render();
    }

    updateField(element) {
        const target = element.dataset.target;
        const field = element.dataset.field;
        let item;
        if (target === "global") item = this.data.global;
        else if (target === "shot-global") {
            const shot = this.find("shot", element.dataset.id);
            if (!shot) return;
            shot.directionMode = "custom";
            shot.directionOverrides ||= {};
            item = shot.directionOverrides;
        }
        else if (target === "settings") item = this.data.settings;
        else if (target === "base") item = this.basePromptWidget;
        else item = this.find(target, element.dataset.id);
        if (!item || !field) return;
        const shotBounds = target === "shot" && ["start", "end"].includes(field) ? this.shotNeighbors(item) : null;
        let value = element.type === "checkbox" ? element.checked : element.value;
        if (element.type === "number") value = element.hasAttribute("data-optional-number") && element.value === "" ? "" : Number(value || 0);
        if (["enabled", "cutoff", "narrationCutoff", "promptOverrideEnabled", "cameraAuto", "audioAuto", "transitionAuto"].includes(field)) value = value === true || value === "true";
        item[field === "value" ? "value" : field] = value;
        if (shotBounds) {
            const minimum = 1 / FPS;
            if (field === "start") item.start = clamp(Number(item.start || 0), shotBounds.previousEnd, Number(item.end || 0) - minimum);
            else item.end = clamp(Number(item.end || 0), Number(item.start || 0) + minimum, shotBounds.nextStart);
            this.syncPinnedReferences(item);
            this.syncDurationToShots();
        }
        if (target === "ref" && ["start", "end"].includes(field)) item.timelineShotId = "";
        if (target === "ref" && field === "type") {
            const allowedRoles = value === "image"
                ? ["reference", "first_frame", "keyframe", "last_frame", "storyboard"]
                : value === "video" ? ["reference", "storyboard", "edit_source", "continuation_source"] : ["reference"];
            if (!allowedRoles.includes(item.frameRole)) item.frameRole = "reference";
            if (value !== "video") item.attachedAudioPath = "";
        }
        if (target === "ref" && field === "mediaMode") {
            if (value !== "video_audio") item.attachedAudioPath = "";
            if (value !== "video" && !(item.audioRoles || []).length) item.audioRoles = ["audio_continuity"];
        }
        if (target === "ref" && field === "audioMode") {
            const valid = value === "reuse" ? ["auto", "fully_copy", "partially_copy"] : ["auto", "reference", "weak_reference"];
            if (!valid.includes(item.audioRetention)) item.audioRetention = "auto";
        }
        this.write();
        if (["type", "pairedVideoId", "mediaMode", "frameRole", "promptMode", "uiMode", "audioMode", "speakerRefId", "directionMode", "promptOverrideEnabled", "cameraAuto", "audioAuto", "transitionAuto", "start", "end"].includes(field)) this.render();
    }

    toggleAudioRole(refId, role, checked) {
        const ref = this.find("ref", refId);
        if (!ref || !AUDIO_ROLES.includes(role)) return;
        const roles = new Set(ref.audioRoles || []);
        checked ? roles.add(role) : roles.delete(role);
        ref.audioRoles = AUDIO_ROLES.filter((item) => roles.has(item));
        this.write();
    }

    toggleShotReference(shotId, refId, checked) {
        const shot = this.find("shot", shotId);
        if (!shot) return;
        const refs = new Set(shot.referenceIds || []);
        checked ? refs.add(refId) : refs.delete(refId);
        shot.referenceIds = [...refs];
        this.write();
    }

    applyPreset(name) {
        if (!name) return;
        if ((this.data.references.length || this.data.shots.length) && !confirm("Replace the current Director plan with this preset?")) return;
        const uiLanguage = this.data.settings.uiLanguage;
        const uiFontSize = this.data.settings.uiFontSize;
        this.data = presetPlan(name, this.duration());
        this.data.settings.uiLanguage = uiLanguage;
        this.data.settings.uiFontSize = uiFontSize;
        this.selection = this.data.shots[0] ? { kind: "shot", id: this.data.shots[0].id } : null;
        this.activeShotId = this.data.shots[0]?.id || null;
        this.activeRefId = this.data.references[0]?.id || null;
        this.write();
        this.render();
    }

    startDrag(event, kind, id, edge, element) {
        event.preventDefault();
        event.stopPropagation();
        const item = this.find(kind, id);
        const lane = element.parentElement;
        if (!item || !lane) return;
        if (kind === "ref") item.timelineShotId = "";
        this.selection = { kind, id };
        if (kind === "shot") this.activeShotId = id;
        const duration = this.timelineDuration();
        const initialStart = Number(item.start || 0);
        const initialEnd = Number(item.end || duration);
        const startX = event.clientX;
        const minLength = 1 / FPS;
        const snap = Math.max(minLength, Number(this.data.settings.snap || 0.1));
        const shotBounds = kind === "shot" ? this.shotNeighbors(item) : { previousEnd: 0, nextStart: duration };
        const reorderMode = kind === "shot" && edge === "move";
        const orderedShots = reorderMode ? [...this.data.shots].sort((a, b) => Number(a.start) - Number(b.start) || Number(a.end) - Number(b.end)) : [];
        const originalIndex = orderedShots.indexOf(item);
        const shotLengths = new Map(orderedShots.map((shot) => [shot.id, Number(shot.end) - Number(shot.start)]));
        const gaps = orderedShots.slice(0, -1).map((shot, index) => Math.max(0, Number(orderedShots[index + 1].start) - Number(shot.end)));
        const centers = orderedShots.map((shot) => (Number(shot.start) + Number(shot.end)) / 2);
        let targetIndex = originalIndex;
        const move = (pointerEvent) => {
            const delta = (pointerEvent.clientX - startX) / Math.max(1, lane.getBoundingClientRect().width) * duration;
            if (reorderMode) {
                const proposedCenter = (initialStart + initialEnd) / 2 + delta;
                targetIndex = centers.reduce((best, center, index) => Math.abs(center - proposedCenter) < Math.abs(centers[best] - proposedCenter) ? index : best, originalIndex);
                const visualStart = clamp(initialStart + delta, 0, duration - (initialEnd - initialStart));
                element.style.left = `${visualStart / duration * 100}%`;
                element.style.zIndex = "8";
                return;
            }
            if (edge === "start") item.start = clamp(round(initialStart + delta, snap), shotBounds.previousEnd, initialEnd - minLength);
            else if (edge === "end") item.end = clamp(round(initialEnd + delta, snap), initialStart + minLength, shotBounds.nextStart);
            else {
                const length = initialEnd - initialStart;
                item.start = clamp(round(initialStart + delta, snap), shotBounds.previousEnd, shotBounds.nextStart - length);
                item.end = item.start + length;
            }
            element.style.left = `${item.start / duration * 100}%`;
            element.style.width = `${Math.max(0.5, (item.end - item.start) / duration * 100)}%`;
            const time = element.querySelector(".h3d-block-time");
            if (time) time.textContent = `${Number(item.start).toFixed(1)}–${Number(item.end).toFixed(1)}s`;
        };
        const up = () => {
            document.removeEventListener("pointermove", move);
            document.removeEventListener("pointerup", up);
            if (reorderMode && targetIndex >= 0 && targetIndex !== originalIndex) {
                const reordered = orderedShots.filter((shot) => shot !== item);
                reordered.splice(targetIndex, 0, item);
                let cursor = Number(orderedShots[0]?.start || 0);
                reordered.forEach((shot, index) => {
                    shot.start = cursor;
                    shot.end = cursor + shotLengths.get(shot.id);
                    this.syncPinnedReferences(shot);
                    cursor = shot.end + (gaps[index] || 0);
                });
            }
            if (kind === "shot") this.syncDurationToShots();
            if (kind === "shot") this.syncPinnedReferences(item);
            this.write();
            this.render();
        };
        document.addEventListener("pointermove", move);
        document.addEventListener("pointerup", up, { once: true });
    }

    referencePresentation(refs = this.promptReferences()) {
        const enabled = refs;
        const images = enabled.filter((ref) => ref.type === "image");
        const videos = enabled.filter((ref) => ref.type === "video" && ref.mediaMode !== "audio");
        const audioOnlyVideos = enabled.filter((ref) => ref.type === "video" && ref.mediaMode === "audio");
        const audios = enabled.filter((ref) => ref.type === "audio");
        const result = new Map();
        images.forEach((ref, index) => result.set(ref.id, { tag: `<Picture ${index + 1}>`, socket: `ref_image_${index}` }));
        videos.forEach((ref, index) => result.set(ref.id, { tag: `<Video ${index + 1}>`, socket: `ref_video_${index}` }));
        const videoIndex = new Map(videos.map((ref, index) => [ref.id, index]));
        const used = new Set();
        const paired = [];
        const standalone = [];
        for (const video of videos) {
            if (video.mediaMode === "video_audio") {
                paired.push(video);
                used.add(video.id);
            }
        }
        for (const ref of audios) {
            if (videoIndex.has(ref.pairedVideoId) && !used.has(ref.pairedVideoId)) {
                paired.push(ref);
                used.add(ref.pairedVideoId);
            } else standalone.push(ref);
        }
        paired.sort((a, b) => videoIndex.get(a.type === "video" ? a.id : a.pairedVideoId) - videoIndex.get(b.type === "video" ? b.id : b.pairedVideoId));
        [...paired, ...audioOnlyVideos, ...standalone].forEach((ref, index) => {
            const pairId = ref.type === "video" && ref.mediaMode !== "audio" ? ref.id : ref.pairedVideoId;
            const socket = pairId && videoIndex.has(pairId) ? `ref_video_audio_${videoIndex.get(pairId)}` : `ref_audio_${[...audioOnlyVideos, ...standalone].indexOf(ref)}`;
            if (ref.type === "video" && ref.mediaMode !== "audio") {
                const current = result.get(ref.id);
                result.set(ref.id, { ...current, audioTag: `<Audio ${index + 1}>`, audioSocket: socket });
            } else result.set(ref.id, { tag: `<Audio ${index + 1}>`, socket });
        });
        return result;
    }

    clientWarnings() {
        const warnings = [];
        const enabled = this.promptReferences();
        const counts = {
            image: enabled.filter((ref) => ref.type === "image").length,
            video: enabled.filter((ref) => ref.type === "video" && ref.mediaMode !== "audio").length,
            audio: enabled.filter((ref) => ref.type === "audio" || (ref.type === "video" && ref.mediaMode === "audio")).length
                + enabled.filter((ref) => ref.type === "video" && ref.mediaMode === "video_audio").length,
        };
        if (!enabled.length) warnings.push("Mention at least one uploaded visual reference with its @alias.");
        if (enabled.length && counts.image + counts.video === 0) warnings.push("Audio cannot be the only reference.");
        if (enabled.some((ref) => !ref.sourcePath)) warnings.push("A prompt-referenced asset has no uploaded file.");
        const aliases = enabled.map((ref) => String(ref.name || "").trim().toLowerCase()).filter(Boolean);
        if (enabled.some((ref) => !String(ref.name || "").trim())) warnings.push("A reference is missing its @alias.");
        if (new Set(aliases).size !== aliases.length) warnings.push("Duplicate @aliases must be renamed.");
        const fileCount = enabled.filter((ref) => ref.sourcePath).length
            + enabled.filter((ref) => ref.type === "video" && ref.mediaMode === "video_audio" && ref.attachedAudioPath).length;
        if (counts.image > 9 || counts.video > 3 || counts.audio > 3 || fileCount > 12) warnings.push("Reference limits exceeded (9 pictures / 3 videos / 3 audio / 12 files). ");
        if (this.duration() < 4 || this.duration() > 15) warnings.push("Recommended output duration is 4–15 seconds.");
        const shots = [...this.data.shots].sort((a, b) => Number(a.start) - Number(b.start));
        if (shots.some((shot) => Number(shot.start) < 0 || Number(shot.end) > this.duration() + 0.001)) warnings.push("A Shot extends beyond the selected output duration and will be clipped or ignored.");
        if (shots.some((shot) => shot.promptOverrideEnabled && !String(shot.promptOverride || "").trim())) warnings.push("A Shot enables external prompt override but its prompt is empty.");
        if (this.data.settings.uiMode === "simple") {
            const visualRefs = enabled.filter((ref) => ref.type === "image" || (ref.type === "video" && ref.mediaMode !== "audio"));
            if (visualRefs.some((ref) => !String(ref.subject || "").trim())) warnings.push("A visual reference is missing its subject name.");
            if (visualRefs.some((ref) => !String(ref.description || "").trim())) warnings.push("A visual subject is missing its appearance or reusable-content description.");
            if (shots.some((shot) => !shot.promptOverrideEnabled && !String(shot.action || "").trim())) warnings.push("A Shot is missing action or performance content.");
        }
        for (let i = 1; i < shots.length; i++) {
            if (Number(shots[i].start) < Number(shots[i - 1].end)) warnings.push("Shot overlap detected.");
            else if (Number(shots[i].start) > Number(shots[i - 1].end) + 0.01) warnings.push("Shot gap detected.");
        }
        return [...new Set(warnings)];
    }

    timelineBlock(item, kind, className, title, row = 0, locked = false) {
        const duration = this.timelineDuration();
        const left = clamp(Number(item.start || 0) / duration * 100, 0, 100);
        const width = clamp((Number(item.end || duration) - Number(item.start || 0)) / duration * 100, 0.5, 100 - left);
        const selected = this.selection?.kind === kind && this.selection?.id === item.id;
        const timeLabel = `${Number(item.start || 0).toFixed(1)}–${Number(item.end || 0).toFixed(1)}s`;
        return `<div class="h3d-block ${className} ${selected ? "selected" : ""} ${locked ? "locked" : ""}" data-block data-kind="${kind}" data-id="${esc(item.id)}" ${locked ? 'data-locked="true"' : ""} title="${esc(`${title} · ${timeLabel}`)}" aria-label="${esc(`${title} ${timeLabel}`)}" style="left:${left}%;width:${width}%;top:${8 + row * 49}px">
            ${locked ? "" : '<span class="h3d-handle start" data-edge="start"></span>'}
            <span class="h3d-block-title">${esc(title)}</span>
            <span class="h3d-block-time">${timeLabel}</span>
            ${locked ? "" : '<span class="h3d-handle end" data-edge="end"></span>'}
        </div>`;
    }

    ruler() {
        const duration = this.timelineDuration();
        const step = 5;
        const ticks = [];
        for (let time = 0; time <= duration + 0.0001; time += step) {
            ticks.push(`<span style="left:${time / duration * 100}%">${Number(time.toFixed(1))}s</span>`);
        }
        return ticks.join("");
    }

    track(label, className, content, rows = 1) {
        const height = Math.max(58, rows * 49 + 8);
        return `<div class="h3d-track" style="min-height:${height}px"><div class="h3d-track-label ${className}">${label}</div><div class="h3d-lane h3d-lane-rows" style="min-height:${height}px">${content}</div></div>`;
    }

    sourcePreview(ref) {
        if (!ref.sourcePath) return `<div class="h3d-source-empty">No media attached</div>`;
        const url = viewUrl(ref.sourcePath);
        if (ref.type === "image") return `<img src="${esc(url)}" alt="${esc(ref.name)}">`;
        if (ref.type === "video") return `<video src="${esc(url)}#t=${Number(ref.trimStart || 0)},${Number(ref.trimEnd ?? ref.sourceDuration ?? 0)}" controls muted preload="metadata"></video>`;
        const peaks = Array.isArray(ref.waveformPeaks) ? ref.waveformPeaks : [];
        const bars = peaks.length ? peaks.map((peak) => `<i style="height:${Math.max(3, Math.round(peak * 100))}%"></i>`).join("") : "";
        return `<div class="h3d-wave">${bars || "waveform pending"}</div><audio src="${esc(url)}" controls preload="metadata"></audio>`;
    }

    sourceCard(ref) {
        const duration = Math.max(0, Number(ref.sourceDuration || 0));
        const start = clamp(Number(ref.trimStart || 0), 0, duration || 0);
        const end = clamp(Number(ref.trimEnd ?? duration), start, duration || start);
        const crop = ref.type === "image" || !duration ? "" : `<div class="h3d-source-crop" data-source-crop data-id="${esc(ref.id)}">
            <span class="shade left" style="width:${start / duration * 100}%"></span><span class="selected" style="left:${start / duration * 100}%;width:${(end - start) / duration * 100}%"></span><span class="shade right" style="left:${end / duration * 100}%"></span>
            <b class="start" data-trim-edge="start" style="left:${start / duration * 100}%"></b><b class="end" data-trim-edge="end" style="left:${end / duration * 100}%"></b>
        </div><small>Source crop ${start.toFixed(2)}-${end.toFixed(2)}s / ${duration.toFixed(2)}s</small>`;
        const mode = ref.type === "video" ? `<span class="h3d-mode-badge">${ref.mediaMode === "video_audio" ? "V+A" : ref.mediaMode === "audio" ? "A" : "V"}</span>` : "";
        const selected = this.selection?.kind === "ref" && this.selection.id === ref.id
            || this.data.settings.uiMode === "simple" && this.activeRefId === ref.id;
        const onTimeline = this.timelineReferences().some((item) => item.id === ref.id);
        const promptActive = this.promptReferences().some((item) => item.id === ref.id);
        const timelineState = promptActive ? "Auto from @prompt" : ref.timelinePinned ? "Timeline only · add @alias to send" : onTimeline ? "Auto from @prompt" : "Drag to timeline";
        return `<article class="h3d-source-card ${selected ? "selected" : ""}" data-source-card data-id="${esc(ref.id)}" draggable="true">
            <div class="h3d-source-head"><b>@${esc(ref.name)}</b>${mode}<span class="h3d-source-type">${esc(ref.type)}</span><small class="h3d-timeline-state">${timelineState}</small></div><div class="h3d-source-preview">${this.sourcePreview(ref)}</div>${crop}
            <div class="h3d-source-actions"><button data-action="upload-ref" data-id="${esc(ref.id)}" data-type="${ref.type}">${ref.sourcePath ? "Replace" : "Attach"}</button>${ref.sourcePath ? `<button data-action="preview-media" data-id="${esc(ref.id)}">Preview</button><button class="danger" data-action="clear-media" data-id="${esc(ref.id)}">Delete</button>` : ""}${ref.timelinePinned ? `<button data-action="unpin-ref" data-id="${esc(ref.id)}">Remove from timeline</button>` : ""}</div>
        </article>`;
    }

    sourceMediaStrip() {
        const cards = this.data.references.map((ref) => this.sourceCard(ref)).join("");
        return `<section class="h3d-source-panel" data-drop-zone><div class="h3d-source-title"><b>Source Media</b><span>Upload / drop / paste real files · crop here affects decoded source only</span><span class="h3d-spacer"></span><em>${esc(this.status)}</em></div>
            <div class="h3d-source-buttons"><button data-action="upload-new" data-type="image">+ Image</button><button data-action="upload-new" data-type="video">+ Video</button><button data-action="upload-new" data-type="audio">+ Audio</button></div>
            <div class="h3d-source-cards">${cards || '<div class="h3d-source-empty wide">Drop images, video, or audio here.</div>'}</div></section>`;
    }

    startSourceTrim(event, refId, edge, bar) {
        event.preventDefault();
        event.stopPropagation();
        const ref = this.find("ref", refId);
        const sourceDuration = Number(ref?.sourceDuration || 0);
        if (!ref || !sourceDuration) return;
        const rect = bar.getBoundingClientRect();
        const minimum = Math.min(2, sourceDuration);
        const move = (pointerEvent) => {
            const value = clamp((pointerEvent.clientX - rect.left) / Math.max(1, rect.width) * sourceDuration, 0, sourceDuration);
            if (edge === "start") ref.trimStart = round(clamp(value, 0, Number(ref.trimEnd ?? sourceDuration) - minimum), 1 / FPS);
            else ref.trimEnd = round(clamp(value, Number(ref.trimStart || 0) + minimum, sourceDuration), 1 / FPS);
            ref.duration = Number(ref.trimEnd ?? sourceDuration) - Number(ref.trimStart || 0);
            this.render();
        };
        const up = () => { document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up); this.write(); };
        document.addEventListener("pointermove", move);
        document.addEventListener("pointerup", up, { once: true });
    }

    simpleSubjectCard(ref) {
        const sourceName = ref.sourcePath ? ref.sourcePath.split("/").pop() : "No file attached";
        const purposeLabels = { identity: "Identity / appearance", scene: "Scene / environment", object: "Object / prop", style: "Visual style", motion: "Motion / action" };
        const purposeValues = Object.keys(purposeLabels);
        if (!purposeValues.includes(ref.purpose)) purposeValues.push(ref.purpose);
        return `<article class="h3d-simple-subject">
            <div class="h3d-simple-card-head"><b>@${esc(ref.name)}</b><small>${esc(ref.type)} · ${esc(sourceName)}</small><span class="h3d-spacer"></span><button data-action="upload-ref" data-id="${esc(ref.id)}" data-type="${esc(ref.type)}">${ref.sourcePath ? "Replace" : "Attach"}</button>${ref.sourcePath ? `<button data-action="preview-media" data-id="${esc(ref.id)}">Preview</button>` : ""}<button class="danger" data-action="remove" data-kind="ref" data-id="${esc(ref.id)}">Delete</button></div>
            <div class="h3d-grid h3d-simple-subject-fields">
                ${this.input("ref", ref.id, "name", "Name / @alias", ref.name)}
                ${this.input("ref", ref.id, "subject", "Subject name", ref.subject, false, "text", "young woman / cafe / product")}
                <label>Reference provides<select data-target="ref" data-id="${esc(ref.id)}" data-field="purpose">${options(purposeValues, ref.purpose, purposeLabels)}</select></label>
                ${this.textarea("ref", ref.id, "description", "Appearance / reusable content", ref.description, "Describe identity, appearance, clothing, scene, object, style, action, expression, or pose in English.")}
            </div>
        </article>`;
    }

    applySimpleNarration(shotId, source, voiceDescription, language, line, start, end) {
        const shot = this.find("shot", shotId);
        if (!shot) return;
        const voice = String(voiceDescription || "").trim();
        if (source.startsWith("visual:")) {
            const ref = this.find("ref", source.slice(7));
            shot.narrator = ref ? `@${ref.name}` : voice || "off-screen narrator";
            shot.narrationVoice = voice;
        } else if (source.startsWith("audio:")) {
            const ref = this.find("ref", source.slice(6));
            const target = ref?.speakerRefId ? this.find("ref", ref.speakerRefId) : null;
            const info = ref ? this.referencePresentation(this.data.references.filter((item) => item.enabled !== false)).get(ref.id) : null;
            shot.narrator = target ? `@${target.name}` : voice || ref?.speakerDescription || "off-screen narrator";
            shot.narrationVoice = ref ? `@${ref.name}${info?.audioTag ? "_Audio" : ""}` : "";
            if (ref && !target && voice) ref.speakerDescription = voice;
        } else {
            shot.narrator = voice || "off-screen narrator";
            shot.narrationVoice = "";
        }
        shot.narration = String(line || "").trim();
        shot.narrationLanguage = language || "Chinese";
        shot.narrationStart = start === "" ? "" : Number(start);
        shot.narrationEnd = end === "" ? "" : Number(end);
        this.write();
        this.render();
    }

    simpleShotCard(shot, index) {
        const enabledRefs = this.data.references.filter((ref) => ref.enabled !== false);
        const visualRefs = enabledRefs.filter((ref) => ref.type === "image" || (ref.type === "video" && ref.mediaMode !== "audio"));
        const presentation = this.referencePresentation(enabledRefs);
        const audioRefs = enabledRefs.filter((ref) => {
            const info = presentation.get(ref.id);
            return info?.audioTag || info?.tag?.startsWith("<Audio");
        });
        const selectedAudio = audioRefs.find((ref) => {
            const info = presentation.get(ref.id);
            return shot.narrationVoice === `@${ref.name}${info?.audioTag ? "_Audio" : ""}`;
        });
        const selectedVisual = visualRefs.find((ref) => shot.narrator === `@${ref.name}`);
        const narrationSource = selectedAudio ? `audio:${selectedAudio.id}` : selectedVisual ? `visual:${selectedVisual.id}` : "custom";
        const visualOptions = visualRefs.map((ref) => `<option value="visual:${esc(ref.id)}" ${narrationSource === `visual:${ref.id}` ? "selected" : ""}>@${esc(ref.name)}${ref.subject ? ` · ${esc(ref.subject)}` : ""}</option>`).join("");
        const audioOptions = audioRefs.map((ref) => `<option value="audio:${esc(ref.id)}" ${narrationSource === `audio:${ref.id}` ? "selected" : ""}>@${esc(ref.name)} · audio</option>`).join("");
        const sourceOptions = `${visualOptions ? `<optgroup label="Visual characters">${visualOptions}</optgroup>` : ""}${audioOptions ? `<optgroup label="Audio references">${audioOptions}</optgroup>` : ""}<option value="custom" ${narrationSource === "custom" ? "selected" : ""}>Extra voice / custom narrator</option>`;
        const voiceDescription = narrationSource.startsWith("visual:") ? shot.narrationVoice : shot.narrator.startsWith("@") ? "" : shot.narrator;
        const languageOptions = options(SUPPORTED_LANGUAGES, shot.narrationLanguage || "Chinese") + `<option value="Original language" ${shot.narrationLanguage === "Original language" ? "selected" : ""}>Original language</option>`;
        const override = shot.promptOverrideEnabled ? `
            <div class="h3d-tip h3d-override-tip">This replaces all automatically generated content for this Shot. Use @aliases for references; the Director still supplies the H3 global structure and reference definitions.</div>
            <label class="h3d-override-field">Complete Shot prompt override<textarea data-target="shot" data-id="${esc(shot.id)}" data-field="promptOverride">${esc(shot.promptOverride)}</textarea></label>` : `
            <div class="h3d-grid h3d-simple-shot-main">
                ${this.input("shot", shot.id, "title", "Shot label", shot.title)}
                ${this.input("shot", shot.id, "start", "Start (s)", shot.start, false, "number")}
                ${this.input("shot", shot.id, "end", "End (s)", shot.end, false, "number")}
                ${this.input("shot", shot.id, "subjects", "Subjects", shot.subjects, true, "text", "@Character_A, @Character_B")}
                ${this.presetInput(shot.id, "expression", "Performance emotion (optional)", shot.expression, true, "joyful / sad / angry / fearful")}
                <label class="wide h3d-simple-action">Action, performance and dialogue<textarea data-target="shot" data-id="${esc(shot.id)}" data-field="action" placeholder="Describe the visible action from initial state through change to result.">${esc(shot.action)}</textarea></label>
            </div>
            <div class="h3d-narration-helper">
                <b>Narration helper</b><label>Narration source<select data-narration-source>${sourceOptions}</select></label><label>Additional voice<input type="text" data-narration-voice value="${esc(voiceDescription)}" placeholder="Voice name or direction"></label><label>Narration language<select data-narration-language>${languageOptions}</select></label><label>Start (s)<input type="number" step="0.1" data-narration-start value="${esc(shot.narrationStart)}" placeholder="Auto start"></label><label>End (s)<input type="number" step="0.1" data-narration-end value="${esc(shot.narrationEnd)}" placeholder="Auto end"></label><label class="h3d-narration-line">Narration line<input type="text" data-narration-line value="${esc(shot.narration)}" placeholder="Exact spoken words"></label><button data-action="apply-narration" data-id="${esc(shot.id)}">Apply narration</button>
            </div>
            <section class="h3d-simple-controls">
                <div><label class="h3d-simple-auto"><input type="checkbox" data-target="shot" data-id="${esc(shot.id)}" data-field="cameraAuto" ${shot.cameraAuto ? "checked" : ""}> Camera settings · Auto design</label>${shot.cameraAuto ? "" : `<div class="h3d-simple-control-fields">${this.presetInput(shot.id, "shotType", "Shot type", shot.shotType, true)}${this.presetInput(shot.id, "camera", "Camera movement", shot.camera, true)}</div>`}</div>
                <div><label class="h3d-simple-auto"><input type="checkbox" data-target="shot" data-id="${esc(shot.id)}" data-field="audioAuto" ${shot.audioAuto ? "checked" : ""}> Sound settings · Auto design</label>${shot.audioAuto ? "" : `<div class="h3d-simple-control-fields">${this.input("shot", shot.id, "ambience", "Ambience", shot.ambience, true)}${this.input("shot", shot.id, "sfx", "Sound effects", shot.sfx, true)}${this.input("shot", shot.id, "music", "Music", shot.music, true)}<small>Blank sound fields mean silence.</small></div>`}</div>
                <div><label class="h3d-simple-auto"><input type="checkbox" data-target="shot" data-id="${esc(shot.id)}" data-field="transitionAuto" ${shot.transitionAuto ? "checked" : ""}> Transition settings · Auto design</label>${shot.transitionAuto ? "" : `<div class="h3d-simple-control-fields">${this.presetInput(shot.id, "transition", "Transition", shot.transition, true)}${this.input("shot", shot.id, "continuity", "Continuity handoff", shot.continuity, true)}</div>`}</div>
            </section>`;
        return `<article class="h3d-simple-shot">
            <div class="h3d-simple-card-head"><b>Shot ${index + 1}</b><small>${esc(shot.title || "")}</small><span class="h3d-spacer"></span><label>Simple prompt source<select data-target="shot" data-id="${esc(shot.id)}" data-field="promptOverrideEnabled">${options([false, true], shot.promptOverrideEnabled === true, { false: "Structured simple fields", true: "External prompt override" })}</select></label><button class="danger" data-action="remove" data-kind="shot" data-id="${esc(shot.id)}">Delete</button></div>
            ${override}
        </article>`;
    }

    simpleView() {
        const visualRefs = this.data.references.filter((ref) => ref.type === "image" || (ref.type === "video" && ref.mediaMode !== "audio"));
        const activeRef = visualRefs.find((ref) => ref.id === this.activeRefId);
        const shots = [...this.data.shots].sort((a, b) => Number(a.start) - Number(b.start));
        return `<div class="h3d-simple-view">
            ${this.sourceMediaStrip()}
            <div class="h3d-simple-top">
                <section class="h3d-simple-panel"><div class="h3d-simple-panel-title"><b>Basic setup</b><small>Descriptions should be English; dialogue keeps its original language.</small></div><div class="h3d-grid">
                    ${this.textarea("base", "", "value", "Story goal / content summary", this.basePromptWidget?.value || "", "Describe what the finished video should show.")}
                    ${this.input("global", "", "format", "Format / video type", this.data.global.format, true, "text", "live-action cinematic clip")}
                    ${this.textarea("global", "", "scene", "Scene and environment", this.data.global.scene, "Describe location, time, weather, layout, and important props.")}
                    ${this.textarea("global", "", "visualStyle", "Visual style and lighting", this.data.global.visualStyle, "Describe style, lighting, palette, and materials.")}
                </div></section>
                <section class="h3d-simple-panel"><div class="h3d-simple-panel-title"><b>Characters and subjects</b><span class="h3d-spacer"></span><button data-action="add-ref" data-type="image">+ Image</button><button data-action="add-ref" data-type="video">+ Video</button></div><div class="h3d-simple-subjects">${activeRef ? this.simpleSubjectCard(activeRef) : visualRefs.length ? '<div class="h3d-empty">Select a visual reference above to edit its subject settings.</div>' : '<div class="h3d-empty">No visual subjects yet. Upload or add an image/video reference.</div>'}</div></section>
            </div>
            <section class="h3d-simple-panel h3d-simple-shots"><div class="h3d-simple-panel-title"><b>Simple Shot editor</b><span class="h3d-spacer"></span><button data-action="add-shot">+ Shot</button><button data-action="preview-prompt">Preview compiled prompt</button></div>${shots.map((shot, index) => this.simpleShotCard(shot, index)).join("") || '<div class="h3d-empty">Select or add a Shot.</div>'}</section>
        </div>`;
    }

    timelineView() {
        const shots = [...this.data.shots].sort((a, b) => Number(a.start) - Number(b.start));
        const timelineRefs = this.timelineReferences();
        const promptRefs = this.promptReferences();
        const promptTags = new Map(promptRefs.map((ref, index) => [ref.id, `<Ref ${index + 1}>`]));
        const displayTags = new Map(timelineRefs.map((ref) => [ref.id, promptTags.get(ref.id) || "<Timeline only>"]));
        const refs = (type) => timelineRefs.filter((ref) => ref.type === type);
        const blocks = (type, className) => refs(type).map((ref, row) => {
            const title = `${displayTags.get(ref.id) || "<Ref>"} @${ref.name}`;
            if (!promptTags.has(ref.id)) return this.timelineBlock(ref, "ref", className, title, row);
            const shotSegments = shots.filter((shot) => this.shotPromptReferences(shot).some((item) => item.id === ref.id));
            if (!shotSegments.length) return this.timelineBlock(ref, "ref", className, title, row, true);
            return shotSegments.map((shot) => this.timelineBlock({ ...ref, start: shot.start, end: shot.end }, "ref", className, title, row, true)).join("");
        }).join("");
        const playhead = clamp(this.playhead / this.timelineDuration() * 100, 0, 100);
        const activeShot = this.activeShot();
        const selected = this.selected();
        const promptPanel = selected && this.selection.kind === "ref"
            ? `<div class="h3d-inspector h3d-reference-prompt">${this.referenceInspector(selected)}</div>`
            : activeShot ? this.shotPromptPane(activeShot) : `<div class="h3d-inspector h3d-empty">Select or add a Shot to edit its prompt.</div>`;
        return `<div class="h3d-workspace">
            <aside class="h3d-camera-sound-zone">${activeShot ? this.shotSettingsPane(activeShot) : `<div class="h3d-shot-pane h3d-empty">Select or add a Shot.</div>`}</aside>
            <main class="h3d-work-main">
                <section class="h3d-material-zone">${this.sourceMediaStrip()}</section>
                <section class="h3d-timeline-zone">
                    <div class="h3d-tip"><b>Output direction timeline</b> — these ranges control prompt wording and shot structure, independently from source crop. Only references mentioned by an effective @alias are sent to H3; manually placed blocks are planning aids only.</div>
                    <div class="h3d-addbar">
                        <button data-action="add-shot">+ Shot</button><button data-action="add-ref" data-type="image" data-timeline="true">+ Picture</button>
                        <button data-action="add-ref" data-type="video" data-timeline="true">+ Video</button><button data-action="add-ref" data-type="audio" data-timeline="true">+ Audio</button>
                        <span class="h3d-spacer"></span><label>Snap <select data-target="settings" data-field="snap">${options([0.0416667, 0.1, 0.25, 0.5, 1], Number(this.data.settings.snap), { 0.0416667: "1 frame", 0.1: "0.1s", 0.25: "0.25s", 0.5: "0.5s", 1: "1s" })}</select></label>
                    </div>
                    <div class="h3d-timeline" data-timeline-drop>
                        <div class="h3d-ruler-label">${this.timelineDuration()} sec</div><div class="h3d-ruler">${this.ruler()}</div>
                        ${this.track("SHOTS", "shot-label", shots.map((shot, index) => this.timelineBlock(shot, "shot", "shot", shot.title || `Shot ${index + 1}`)).join(""))}
                        ${this.track("PICTURES", "image-label", blocks("image", "image"), refs("image").length)}
                        ${this.track("VIDEOS", "video-label", blocks("video", "video"), refs("video").length)}
                        ${this.track("AUDIO", "audio-label", blocks("audio", "audio"), refs("audio").length)}
                        <div class="h3d-playhead" style="left:calc(102px + (100% - 110px) * ${playhead / 100})"></div>
                    </div>
                </section>
                <section class="h3d-prompt-zone">${promptPanel}</section>
            </main>
        </div>`;
    }

    input(target, id, field, label, value, wide = false, type = "text", placeholder = "") {
        return `<label class="${wide ? "wide" : ""}">${label}<input type="${type}" ${type === "number" ? 'step="0.1" min="0"' : ""} data-target="${target}" data-id="${esc(id)}" data-field="${field}" value="${esc(value)}" placeholder="${esc(placeholder)}"></label>`;
    }

    textarea(target, id, field, label, value, placeholder = "") {
        return `<label class="wide">${label}<textarea data-target="${target}" data-id="${esc(id)}" data-field="${field}" placeholder="${esc(placeholder)}">${esc(value)}</textarea></label>`;
    }

    languageInput(shot, field, label) {
        const value = shot[field] === undefined || shot[field] === null ? "Chinese" : shot[field];
        const custom = !SUPPORTED_LANGUAGES.includes(value);
        const languageOptions = options(SUPPORTED_LANGUAGES, custom ? "" : value)
            + `<option value="__custom__" ${custom ? "selected" : ""}>Other / custom language</option>`;
        return `<label>${label}<select data-language-select data-id="${esc(shot.id)}" data-language-field="${field}">${languageOptions}</select>${custom ? `<input type="text" data-target="shot" data-id="${esc(shot.id)}" data-field="${field}" value="${esc(value)}" placeholder="Custom language">` : ""}</label>`;
    }

    vocalTimingInput(shot, field, label, placeholder) {
        const value = shot[field] ?? "";
        return `<label>${label}<input type="number" step="0.1" min="${esc(shot.start)}" max="${esc(shot.end)}" data-optional-number data-target="shot" data-id="${esc(shot.id)}" data-field="${field}" value="${esc(value)}" placeholder="${placeholder}"></label>`;
    }

    presetInput(id, field, label, value, wide = false, placeholder = "") {
        const presets = SHOT_PRESETS[field] || [];
        const presetOptions = presets.map(([preset, zh]) => `<option value="${esc(preset)}" ${preset === value ? "selected" : ""}>${esc(this.isChinese() ? `${zh} · ${preset}` : preset)}</option>`).join("");
        const customLens = field === "lens" && Boolean(value) && !presets.some(([preset]) => preset === value);
        const customOption = field === "lens" ? `<option value="__custom__" ${customLens ? "selected" : ""}>${this.isChinese() ? "自定义镜头…" : "Custom lens…"}</option>` : "";
        return `<label class="h3d-preset-field ${wide ? "wide" : ""}">${label}<div class="h3d-preset-control">
            <select data-shot-preset data-target="shot" data-id="${esc(id)}" data-field="${field}"><option value="">${this.isChinese() ? "选择预设…" : "Choose preset…"}</option>${presetOptions}${customOption}</select>
            <input type="text" data-target="shot" data-id="${esc(id)}" data-field="${field}" value="${esc(value)}" placeholder="${esc(placeholder)}">
        </div><small>${this.isChinese() ? "下方始终可以输入或修改自定义内容。" : "Custom value remains editable below."}</small></label>`;
    }

    shotTemplates() {
        try {
            const templates = JSON.parse(localStorage.getItem(SHOT_TEMPLATE_STORAGE) || "[]");
            return Array.isArray(templates) ? templates.filter((item) => item && item.name && item.values) : [];
        } catch {
            return [];
        }
    }

    storeShotTemplates(templates) {
        localStorage.setItem(SHOT_TEMPLATE_STORAGE, JSON.stringify(templates));
    }

    saveShotTemplate(shotId) {
        const shot = this.find("shot", shotId);
        const name = this.host.querySelector("[data-template-name]")?.value.trim();
        if (!shot || !name) {
            this.templateMessage = "Enter a template name.";
            this.render();
            return;
        }
        const templates = this.shotTemplates().filter((item) => item.name !== name);
        templates.push({ name, values: Object.fromEntries(SHOT_TEMPLATE_FIELDS.map((field) => [field, shot[field] ?? ""])) });
        this.storeShotTemplates(templates);
        this.selectedTemplate = name;
        this.templateMessage = "Template saved.";
        this.render();
    }

    loadShotTemplate(shotId) {
        const shot = this.find("shot", shotId);
        const name = this.host.querySelector("[data-template-select]")?.value;
        const template = this.shotTemplates().find((item) => item.name === name);
        if (!shot || !template) {
            this.templateMessage = "Select a saved template.";
            this.render();
            return;
        }
        for (const field of SHOT_TEMPLATE_FIELDS) shot[field] = template.values[field] ?? "";
        this.selectedTemplate = name;
        this.templateMessage = "Template loaded.";
        this.write();
        this.render();
    }

    deleteShotTemplate() {
        const name = this.host.querySelector("[data-template-select]")?.value;
        if (!name) {
            this.templateMessage = "Select a saved template.";
            this.render();
            return;
        }
        this.storeShotTemplates(this.shotTemplates().filter((item) => item.name !== name));
        this.selectedTemplate = "";
        this.templateMessage = "Template deleted.";
        this.render();
    }

    masterShot() {
        return [...this.data.shots].sort((a, b) => Number(a.start) - Number(b.start) || Number(a.end) - Number(b.end))[0] || null;
    }

    isMasterShot(shot) {
        return this.masterShot()?.id === shot?.id;
    }

    directorValues(shot) {
        if (this.isMasterShot(shot) || shot.directionMode !== "custom") return { ...this.data.global };
        return { ...this.data.global, ...(shot.directionOverrides || {}) };
    }

    directorTemplates() {
        try {
            const templates = JSON.parse(localStorage.getItem(DIRECTOR_TEMPLATE_STORAGE) || "[]");
            return Array.isArray(templates) ? templates.filter((item) => item && item.name && item.values) : [];
        } catch {
            return [];
        }
    }

    storeDirectorTemplates(templates) {
        localStorage.setItem(DIRECTOR_TEMPLATE_STORAGE, JSON.stringify(templates));
    }

    saveDirectorTemplate(shotId) {
        const shot = this.find("shot", shotId);
        const name = this.host.querySelector("[data-direction-template-name]")?.value.trim();
        if (!shot || !name) {
            this.directionTemplateMessage = "Enter a template name.";
            this.render();
            return;
        }
        const values = this.directorValues(shot);
        const templates = this.directorTemplates().filter((item) => item.name !== name);
        templates.push({
            name,
            basePrompt: this.isMasterShot(shot) ? this.basePromptWidget?.value || "" : undefined,
            values: Object.fromEntries(DIRECTOR_TEMPLATE_FIELDS.map((field) => [field, values[field] ?? ""])),
        });
        this.storeDirectorTemplates(templates);
        this.selectedDirectionTemplate = name;
        this.directionTemplateMessage = "Template saved.";
        this.render();
    }

    loadDirectorTemplate(shotId) {
        const shot = this.find("shot", shotId);
        const name = this.host.querySelector("[data-direction-template-select]")?.value;
        const template = BUILTIN_DIRECTOR_TEMPLATES.find((item) => item.id === name)
            || this.directorTemplates().find((item) => item.name === name);
        if (!shot || !template) {
            this.directionTemplateMessage = "Select a saved template.";
            this.render();
            return;
        }
        const values = Object.fromEntries(DIRECTOR_TEMPLATE_FIELDS.map((field) => [field, template.values[field] ?? ""]));
        if (this.isMasterShot(shot)) {
            this.data.global = { ...this.data.global, ...values };
            if (template.basePrompt !== undefined && this.basePromptWidget) this.basePromptWidget.value = template.basePrompt;
        }
        else {
            shot.directionMode = "custom";
            shot.directionOverrides = values;
        }
        this.selectedDirectionTemplate = name;
        this.directionTemplateMessage = "Template loaded.";
        this.write();
        this.render();
    }

    deleteDirectorTemplate() {
        const name = this.host.querySelector("[data-direction-template-select]")?.value;
        if (!name) {
            this.directionTemplateMessage = "Select a saved template.";
            this.render();
            return;
        }
        if (BUILTIN_DIRECTOR_TEMPLATES.some((item) => item.id === name)) {
            this.directionTemplateMessage = "Built-in templates cannot be deleted.";
            this.render();
            return;
        }
        this.storeDirectorTemplates(this.directorTemplates().filter((item) => item.name !== name));
        this.selectedDirectionTemplate = "";
        this.directionTemplateMessage = "Template deleted.";
        this.render();
    }

    previewMedia(refId) {
        const ref = this.find("ref", refId);
        if (!ref?.sourcePath) return;
        this.previewModal?.remove();
        const url = viewUrl(ref.sourcePath);
        let media;
        if (ref.type === "image") media = `<img src="${esc(url)}" alt="${esc(ref.name)}">`;
        else if (ref.type === "video") {
            const start = Number(ref.trimStart || 0);
            const end = Number(ref.trimEnd ?? ref.sourceDuration ?? 0);
            media = `<video src="${esc(url)}#t=${start},${end}" controls preload="metadata"></video>`;
        } else media = `<audio src="${esc(url)}" controls preload="metadata"></audio>`;
        const modal = document.createElement("div");
        modal.className = "h3d-preview-modal h3d-media-preview-modal";
        modal.innerHTML = `<div class="h3d-media-preview-dialog"><div class="h3d-preview-head"><b>${this.isChinese() ? "素材预览" : "Media preview"} · @${esc(ref.name)}</b><span class="h3d-spacer"></span><button type="button" data-preview-close>${this.isChinese() ? "关闭" : "Close"}</button></div><div class="h3d-media-preview-stage ${esc(ref.type)}">${media}</div></div>`;
        const close = () => {
            modal.querySelector("video,audio")?.pause();
            modal.remove();
            if (this.previewModal === modal) this.previewModal = null;
        };
        modal.querySelector("[data-preview-close]").addEventListener("click", close);
        modal.addEventListener("mousedown", (event) => { if (event.target === modal) close(); });
        document.body.append(modal);
        this.previewModal = modal;
    }

    async previewCompiledPrompt() {
        this.previewModal?.remove();
        const modal = document.createElement("div");
        modal.className = "h3d-preview-modal";
        modal.innerHTML = `<div class="h3d-preview-dialog"><div class="h3d-preview-head"><b>${this.isChinese() ? "Compiled Prompt 预览" : "Compiled prompt preview"}</b><span class="h3d-spacer"></span><button type="button" data-preview-close>${this.isChinese() ? "关闭" : "Close"}</button></div><div class="h3d-preview-meta"></div><pre>${this.isChinese() ? "正在编译提示词…" : "Loading compiled prompt…"}</pre></div>`;
        const close = () => { modal.remove(); if (this.previewModal === modal) this.previewModal = null; };
        modal.querySelector("[data-preview-close]").addEventListener("click", close);
        modal.addEventListener("mousedown", (event) => { if (event.target === modal) close(); });
        document.body.append(modal);
        this.previewModal = modal;
        try {
            const response = await api.fetchApi("/lh/minimax_h3_director/preview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ base_prompt: this.basePromptWidget?.value || "", duration: this.duration(), director_data: this.data }),
            });
            if (!response.ok) throw new Error(`Preview failed (${response.status}).`);
            const result = await response.json();
            modal.querySelector("pre").textContent = result.compiled_prompt;
            const localWarnings = this.clientWarnings();
            const localReport = localWarnings.length ? `\nUI CHECK:\n${localWarnings.map((warning) => `- ${warning}`).join("\n")}` : "";
            modal.querySelector(".h3d-preview-meta").textContent = `${result.length} frames · ${result.warning_report}${localReport}`;
        } catch (error) {
            modal.querySelector("pre").textContent = error.message;
        }
    }

    aliasCandidates() {
        const candidates = [];
        for (const ref of this.data.references.filter((item) => item.enabled !== false && item.name)) {
            candidates.push({ alias: `@${ref.name}`, tag: "<Ref>", detail: `${ref.type} · ${ref.purpose}` });
            if (ref.type === "video" && ref.mediaMode === "video_audio") candidates.push({ alias: `@${ref.name}_Audio`, tag: "<Audio>", detail: "paired video audio" });
        }
        return candidates;
    }

    closeAliasMenu() {
        this.aliasMenu?.remove();
        this.aliasMenu = null;
        this.aliasChoices = null;
        this.aliasChoose = null;
    }

    showAliasMenu(element) {
        const caret = element.selectionStart ?? element.value.length;
        const match = element.value.slice(0, caret).match(/@([\p{L}\p{N}_.-]*)$/u);
        if (!match) {
            this.closeAliasMenu();
            return;
        }
        const query = match[1].toLowerCase();
        const candidates = this.aliasCandidates().filter((item) => item.alias.slice(1).toLowerCase().includes(query));
        if (!candidates.length) {
            this.closeAliasMenu();
            return;
        }
        this.closeAliasMenu();
        const panel = this.host.querySelector(".h3d");
        const panelRect = panel.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const scale = panelRect.width / Math.max(1, panel.offsetWidth);
        const menu = document.createElement("div");
        menu.className = "h3d-alias-menu";
        menu.style.left = `${(elementRect.left - panelRect.left) / scale}px`;
        menu.style.top = `${(elementRect.bottom - panelRect.top) / scale + 3}px`;
        menu.style.width = `${Math.max(220, elementRect.width / scale)}px`;
        menu.innerHTML = candidates.map((item, index) => `<button type="button" data-alias-index="${index}"><b>${esc(item.alias)}</b><span>${esc(item.tag)}</span><small>${esc(item.detail)}</small></button>`).join("");
        const choose = (candidate) => {
            const tokenStart = caret - match[0].length;
            const suffix = element.value.slice(caret);
            const separator = suffix.startsWith(" ") || !suffix ? "" : " ";
            element.value = element.value.slice(0, tokenStart) + candidate.alias + separator + suffix;
            const nextCaret = tokenStart + candidate.alias.length + separator.length;
            element.setSelectionRange(nextCaret, nextCaret);
            this.updateField(element);
            this.closeAliasMenu();
            this.render();
        };
        menu.querySelectorAll("button").forEach((button, index) => button.addEventListener("mousedown", (event) => {
            event.preventDefault();
            choose(candidates[index]);
        }));
        panel.append(menu);
        this.aliasMenu = menu;
        this.aliasChoices = candidates;
        this.aliasChoose = choose;
        this.aliasIndex = 0;
        menu.querySelector("button")?.classList.add("active");
    }

    referenceInspector(ref) {
        const videos = this.data.references.filter((item) => item.type === "video" && item.id !== ref.id);
        const pairOptions = `<option value="">Standalone audio</option>` + videos.map((video, index) => `<option value="${esc(video.id)}" ${ref.pairedVideoId === video.id ? "selected" : ""}>Video ${index + 1}: ${esc(video.name)}</option>`).join("");
        const hasVisual = ref.type === "image" || (ref.type === "video" && ref.mediaMode !== "audio");
        const hasAudio = ref.type === "audio" || (ref.type === "video" && ref.mediaMode !== "video");
        const frameRoles = ref.type === "image"
            ? ["reference", "first_frame", "keyframe", "last_frame", "storyboard"]
            : ref.type === "video" ? ["reference", "storyboard", "edit_source", "continuation_source"] : ["reference"];
        const frameRoleLabels = {
            reference: "Reusable reference", first_frame: "First-frame anchor", keyframe: "Keyframe anchor",
            last_frame: "Last-frame anchor", storyboard: "Storyboard / temporal guide",
            edit_source: "Video edit source", continuation_source: "Video continuation source",
        };
        const speakerOptions = `<option value="">No target speaker</option>` + this.data.references
            .filter((item) => item.id !== ref.id && (item.type === "image" || (item.type === "video" && item.mediaMode !== "audio")))
            .map((item) => `<option value="${esc(item.id)}" ${ref.speakerRefId === item.id ? "selected" : ""}>@${esc(item.name)}${item.subject ? ` — ${esc(item.subject)}` : ""}</option>`).join("");
        const audioRoleChecks = AUDIO_ROLES.map((role) => `<label><input type="checkbox" data-audio-role data-ref="${esc(ref.id)}" data-audio-role="${role}" ${(ref.audioRoles || []).includes(role) ? "checked" : ""}> ${AUDIO_ROLE_LABELS[role]}</label>`).join("");
        const audioRetentionOptions = ref.audioMode === "reuse" ? ["auto", "fully_copy", "partially_copy"] : ["auto", "reference", "weak_reference"];
        const audioControls = hasAudio ? `<div class="h3d-audio-box wide">
                <div class="h3d-audio-title"><b>Audio roles</b><small>One asset may serve several roles; the compiler writes them as one natural definition.</small></div>
                <div class="h3d-grid">
                    <label>Audio use<select data-target="ref" data-id="${esc(ref.id)}" data-field="audioMode">${options(AUDIO_MODES, ref.audioMode, { reference: "Audio reference", reuse: "Audio reuse" })}</select></label>
                    <label>Audio retention<select data-target="ref" data-id="${esc(ref.id)}" data-field="audioRetention">${options(audioRetentionOptions, ref.audioRetention)}</select></label>
                    <label>Target speaker subject<select data-target="ref" data-id="${esc(ref.id)}" data-field="speakerRefId">${speakerOptions}</select></label>
                    ${this.input("ref", ref.id, "speakerDescription", "Stable voice description", ref.speakerDescription, false, "text", "calm adult narrator")}
                    <div class="h3d-audio-roles wide"><b>Audio roles</b>${audioRoleChecks}</div>
                    ${this.textarea("ref", ref.id, "audioNotes", "Audio role description / instruction", ref.audioNotes, "Describe all selected audio roles in one natural instruction.")}
                </div>
            </div>` : "";
        const sourceName = ref.sourcePath ? ref.sourcePath.split("/").pop() : "No file attached";
        return `<div class="h3d-inspector-head"><strong>Reference · @${esc(ref.name)}</strong><span class="h3d-spacer"></span><button class="danger" data-action="remove" data-kind="ref" data-id="${esc(ref.id)}">Delete</button></div>
            <div class="h3d-media-row"><b>Source:</b><code title="${esc(ref.sourcePath)}">${esc(sourceName)}</code><span class="h3d-spacer"></span><button data-action="upload-ref" data-id="${esc(ref.id)}" data-type="${ref.type}">${ref.sourcePath ? "Replace" : "Attach file"}</button>${ref.sourcePath ? `<button data-action="preview-media" data-id="${esc(ref.id)}">Preview</button><button class="danger" data-action="clear-media" data-id="${esc(ref.id)}">Delete</button>` : ""}</div>
            <div class="h3d-grid">
                <label>Enabled<select data-target="ref" data-id="${esc(ref.id)}" data-field="enabled">${options([true, false], ref.enabled !== false, { true: "On", false: "Off" })}</select></label>
                ${this.input("ref", ref.id, "name", "Name / @alias", ref.name)}
                <label>Media type<select data-target="ref" data-id="${esc(ref.id)}" data-field="type">${options(REF_TYPES, ref.type)}</select></label>
                <label>Purpose<select data-target="ref" data-id="${esc(ref.id)}" data-field="purpose">${options(PURPOSES, ref.purpose)}</select></label>
                ${hasVisual ? `<label>Asset role<select data-target="ref" data-id="${esc(ref.id)}" data-field="frameRole">${options(frameRoles, frameRoles.includes(ref.frameRole) ? ref.frameRole : "reference", frameRoleLabels)}</select></label>` : ""}
                ${hasVisual ? `<label>Relationship<select data-target="ref" data-id="${esc(ref.id)}" data-field="mode">${options(MODES, ref.mode)}</select></label>` : ""}
                <label>Fidelity<select data-target="ref" data-id="${esc(ref.id)}" data-field="fidelity">${options(FIDELITIES, ref.fidelity)}</select></label>
                ${hasVisual ? `<label>Retention marker<select data-target="ref" data-id="${esc(ref.id)}" data-field="retention">${options(VISUAL_RETENTIONS, ref.retention)}</select></label>` : ""}
                ${hasVisual ? this.input("ref", ref.id, "subject", "Subject / target", ref.subject, false, "text", "main character / product / scene") : ""}
                ${hasVisual ? this.textarea("ref", ref.id, "description", "Subject description / visible content", ref.description, "Describe the reusable person, animal, object, scene, clothing, effect, style, action, expression, or pose visible in this asset.") : ""}
                ${this.input("ref", ref.id, "start", "Prompt start (s)", ref.start, false, "number")}
                ${this.input("ref", ref.id, "end", "Prompt end (s)", ref.end, false, "number")}
                ${ref.type !== "image" ? this.input("ref", ref.id, "trimStart", "Source crop start (s)", ref.trimStart, false, "number") : ""}
                ${ref.type !== "image" ? this.input("ref", ref.id, "trimEnd", "Source crop end (s)", ref.trimEnd ?? ref.sourceDuration, false, "number") : ""}
                ${ref.type === "video" ? `<label>Video streams<select data-target="ref" data-id="${esc(ref.id)}" data-field="mediaMode">${options(MEDIA_MODES, ref.mediaMode, { video: "V · picture only", audio: "A · embedded audio only", video_audio: "V+A · picture + soundtrack" })}</select></label>` : ""}
                ${ref.type === "video" && ref.mediaMode === "video_audio" ? `<div class="h3d-attached wide"><b>Paired soundtrack:</b> ${esc(ref.attachedAudioPath ? ref.attachedAudioPath.split("/").pop() : "embedded video audio")}<span class="h3d-spacer"></span><button data-action="attach-audio" data-id="${esc(ref.id)}">${ref.attachedAudioPath ? "Replace audio" : "Use external audio"}</button>${ref.attachedAudioPath ? `<button data-action="clear-attached" data-id="${esc(ref.id)}">Use embedded</button>` : ""}<small>Prompt alias: @${esc(ref.name)}_Audio</small></div>` : ""}
                ${ref.type === "audio" ? `<label>Audio routing<select data-target="ref" data-id="${esc(ref.id)}" data-field="pairedVideoId">${pairOptions}</select></label>` : ""}
                ${audioControls}
                ${hasVisual ? this.textarea("ref", ref.id, "notes", "Reference instruction", ref.notes, "State exactly what to preserve, borrow, transform, replace, or ignore.") : ""}
            </div>`;
    }

    directorEditor(shot) {
        const master = this.isMasterShot(shot);
        const custom = master || shot.directionMode === "custom";
        const target = master ? "global" : "shot-global";
        const values = this.directorValues(shot);
        const disabled = custom ? "" : " disabled";
        const templates = this.directorTemplates();
        const builtInOptions = BUILTIN_DIRECTOR_TEMPLATES.map((item) => `<option value="${esc(item.id)}" ${item.id === this.selectedDirectionTemplate ? "selected" : ""}>${esc(this.isChinese() ? item.label.zh : item.label.en)}</option>`).join("");
        const customOptions = templates.length
            ? templates.map((item) => `<option value="${esc(item.name)}" ${item.name === this.selectedDirectionTemplate ? "selected" : ""}>${esc(item.name)}</option>`).join("")
            : `<option value="" disabled>${this.isChinese() ? "没有已保存模板" : "No saved templates"}</option>`;
        const templateOptions = `<optgroup label="${this.isChinese() ? "内置模板" : "Built-in templates"}">${builtInOptions}</optgroup><optgroup label="${this.isChinese() ? "自定义模板" : "Custom templates"}">${customOptions}</optgroup>`;
        const templateName = String(this.selectedDirectionTemplate || "").startsWith("builtin:") ? "" : this.selectedDirectionTemplate || "";
        const input = (field, label, value) => `<label>${label}<input type="text" data-target="${target}" data-id="${esc(shot.id)}" data-field="${field}" value="${esc(value)}"${disabled}></label>`;
        const textarea = (field, label, value) => `<label class="wide">${label}<textarea data-target="${target}" data-id="${esc(shot.id)}" data-field="${field}"${disabled}>${esc(value)}</textarea></label>`;
        return `<details class="h3d-direction-editor" data-fold="${esc(shot.id)}:director"${this.sectionOpen(shot, "director")}>
            <summary class="h3d-pane-title"><b>Director settings</b><small>${master ? "Shot 1 master settings" : custom ? "Custom override" : "Inherit Shot 1"}</small></summary>
            <div class="h3d-template-bar h3d-direction-template-bar">
                <input type="text" data-direction-template-name value="${esc(templateName)}" placeholder="${this.isChinese() ? "导演模板名称" : "Director template name"}">
                <select data-direction-template-select><option value="">${this.isChinese() ? "选择导演模板" : "Select director template"}</option>${templateOptions}</select>
                <button data-action="save-direction-template" data-id="${esc(shot.id)}">Save template</button>
                <button data-action="load-direction-template" data-id="${esc(shot.id)}">Load template</button>
                <button data-action="delete-direction-template">Delete template</button>
            </div><small class="h3d-template-message">${esc(this.directionTemplateMessage || "")}</small>
            ${master ? `<div class="h3d-tip h3d-direction-tip">Later shots inherit these settings automatically.</div>` : `<label class="h3d-direction-source">Direction source<select data-target="shot" data-id="${esc(shot.id)}" data-field="directionMode">${options(["inherit", "custom"], shot.directionMode === "custom" ? "custom" : "inherit", { inherit: "Inherit Shot 1", custom: "Custom override" })}</select></label>${custom ? "" : `<div class="h3d-tip h3d-direction-tip">This shot currently follows Shot 1. Choose Custom override to change it.</div>`}`}
            <div class="h3d-grid h3d-direction">
                ${master ? this.textarea("base", "", "value", "Creative brief", this.basePromptWidget?.value || "", "What should the finished clip be?") : ""}
                ${master ? `<label>Prompt detail<select data-target="settings" data-field="promptMode">${options(["director", "compact"], this.data.settings.promptMode, { director: "Director / detailed", compact: "Compact" })}</select></label>` : ""}
                ${input("format", "Output format", values.format)}
                ${textarea("scene", "Scene / world", values.scene)}
                ${textarea("visualStyle", "Visual style / lighting / materials", values.visualStyle)}
                ${textarea("characterRules", "Identity / subject rules", values.characterRules)}
                ${textarea("cameraRules", "Global camera rules", values.cameraRules)}
                ${textarea("audioRules", "Global ambience / physical sound rules", values.audioRules)}
                ${textarea("musicRules", "Non-diegetic music rules", values.musicRules)}
                ${textarea("continuity", "Continuity bible", values.continuity)}
                ${textarea("avoid", "Avoid", values.avoid)}
            </div>
        </details>`;
    }

    shotSettingsPane(shot) {
        const refChecks = this.promptReferences().map((ref) => `<label><input type="checkbox" data-shot-ref data-shot="${esc(shot.id)}" data-ref="${esc(ref.id)}" ${(shot.referenceIds || []).includes(ref.id) ? "checked" : ""}> @${esc(ref.name)}</label>`).join("");
        const templates = this.shotTemplates();
        const templateOptions = templates.length
            ? templates.map((item) => `<option value="${esc(item.name)}" ${item.name === this.selectedTemplate ? "selected" : ""}>${esc(item.name)}</option>`).join("")
            : `<option value="">${this.isChinese() ? "没有已保存模板" : "No saved templates"}</option>`;
        return `<section class="h3d-shot-pane h3d-shot-settings">
            <div class="h3d-pane-title"><b>Shot controls</b><small>${esc(shot.title || "Shot")}</small><span class="h3d-spacer"></span><button class="danger" data-action="remove" data-kind="shot" data-id="${esc(shot.id)}">Delete</button></div>
            <div class="h3d-template-bar">
                <input type="text" data-template-name value="${esc(this.selectedTemplate || "")}" placeholder="${this.isChinese() ? "模板名称" : "Template name"}">
                <select data-template-select><option value="">${this.isChinese() ? "已保存模板" : "Saved templates"}</option>${templateOptions}</select>
                <button data-action="save-shot-template" data-id="${esc(shot.id)}">Save template</button>
                <button data-action="load-shot-template" data-id="${esc(shot.id)}">Load template</button>
                <button data-action="delete-shot-template">Delete template</button>
            </div><small class="h3d-template-message">${esc(this.templateMessage || "")}</small>
            <div class="h3d-shot-time-grid">
                ${this.input("shot", shot.id, "title", "Shot label", shot.title)}
                ${this.input("shot", shot.id, "start", "Start (s)", shot.start, false, "number")}
                ${this.input("shot", shot.id, "end", "End (s)", shot.end, false, "number")}
            </div>
            <section class="h3d-setting-module">
                <div class="h3d-setting-module-head"><b>Camera settings</b><label><input type="checkbox" data-target="shot" data-id="${esc(shot.id)}" data-field="cameraAuto" ${shot.cameraAuto ? "checked" : ""}> Auto design</label></div>
                ${shot.cameraAuto ? `<div class="h3d-module-auto-note">Let the model design this entire section.</div>` : `<div class="h3d-grid h3d-left-settings">
                    ${this.presetInput(shot.id, "shotType", "Shot type", shot.shotType, true, "close-up / wide / macro")}
                    ${this.presetInput(shot.id, "lens", "Lens", shot.lens, true, "50mm standard lens")}
                    ${this.presetInput(shot.id, "depth", "Depth of field", shot.depth, true, "shallow depth of field")}
                    ${this.presetInput(shot.id, "camera", "Camera movement", shot.camera, true, "slow dolly, pan right, handheld follow")}
                    ${this.presetInput(shot.id, "cameraAngle", "Camera angle", shot.cameraAngle, true, "eye-level camera angle")}
                    ${this.presetInput(shot.id, "composition", "Composition / screen direction", shot.composition, true, "rule-of-thirds composition")}
                    ${this.presetInput(shot.id, "lighting", "Shot lighting", shot.lighting, true, "soft natural daylight")}
                    ${this.presetInput(shot.id, "motionPace", "Motion pace", shot.motionPace, true, "natural real-time motion")}
                </div>`}
            </section>
            <section class="h3d-setting-module h3d-sound-module">
                <div class="h3d-setting-module-head"><b>Sound settings</b><label><input type="checkbox" data-target="shot" data-id="${esc(shot.id)}" data-field="audioAuto" ${shot.audioAuto ? "checked" : ""}> Auto design</label></div>
                ${shot.audioAuto ? `<div class="h3d-module-auto-note">Let the model design this entire section.</div>` : `<div class="h3d-grid h3d-left-settings">
                    ${this.input("shot", shot.id, "ambience", "Ambience", shot.ambience, true)}
                    ${this.input("shot", shot.id, "music", "Music", shot.music, true)}
                    ${this.input("shot", shot.id, "sfx", "Sound effects", shot.sfx, true)}
                    <small class="wide h3d-silence-note">Blank sound fields mean silence.</small>
                </div>`}
            </section>
            <section class="h3d-setting-module h3d-transition-module">
                <div class="h3d-setting-module-head"><b>Transition settings</b><label><input type="checkbox" data-target="shot" data-id="${esc(shot.id)}" data-field="transitionAuto" ${shot.transitionAuto ? "checked" : ""}> Auto design</label></div>
                ${shot.transitionAuto ? `<div class="h3d-module-auto-note">Let the model design this entire section.</div>` : `<div class="h3d-grid h3d-left-settings">
                    ${this.presetInput(shot.id, "transition", "Transition", shot.transition, true, "cut / match cut / continuous shot")}
                    ${this.input("shot", shot.id, "continuity", "Continuity handoff", shot.continuity, true)}
                </div>`}
            </section>
            <fieldset class="h3d-shot-references"><legend>Shot references</legend><div class="h3d-checks">${refChecks || "No enabled references"}</div><small>Only materials mentioned by an effective @alias are sent to H3. Manually placed timeline blocks are planning aids only.</small></fieldset>
        </section>`;
    }

    shotPromptPane(shot) {
        const promptFields = shot.promptOverrideEnabled ? `
            <div class="h3d-tip h3d-override-tip">This replaces all automatically generated content for this Shot. Use @aliases for references; the Director still supplies the H3 global structure and reference definitions.</div>
            <label class="h3d-override-field">Complete Shot prompt override<textarea data-target="shot" data-id="${esc(shot.id)}" data-field="promptOverride" placeholder="[Shot] Describe the complete visual action, camera, performance, dialogue, sound, timing, and transition for this Shot.">${esc(shot.promptOverride)}</textarea></label>` : `
            <div class="h3d-grid h3d-right-prompts">
                ${this.input("shot", shot.id, "subjects", "Subjects", shot.subjects, true, "text", "@Character_A, @Product")}
                ${this.presetInput(shot.id, "expression", "Performance emotion (optional)", shot.expression, true, "joyful / sad / angry / fearful / surprised / disgusted / contemptuous")}
                <label class="wide h3d-action-field">Action, performance and dialogue<textarea data-target="shot" data-id="${esc(shot.id)}" data-field="action" placeholder="Write the complete shot flow here. For dialogue use: @Subject (S1) says, <d>[Chinese] 台词。</d>">${esc(shot.action)}</textarea><small>Dialogue written here stays in the shot description; use stable Sx IDs and wrap exact words in &lt;d&gt;[Language] ...&lt;/d&gt;.</small></label>
                <details class="wide h3d-collapsible" data-fold="${esc(shot.id)}:narration"${this.sectionOpen(shot, "narration")}><summary>Narration settings</summary><fieldset class="h3d-voice-panel h3d-narration-panel"><div class="h3d-grid">
                    ${this.input("shot", shot.id, "narrator", "Narrator", shot.narrator)}
                    ${this.input("shot", shot.id, "narrationVoice", "Narration voice direction / @Audio", shot.narrationVoice)}
                    ${this.languageInput(shot, "narrationLanguage", "Narration language")}
                    ${this.vocalTimingInput(shot, "narrationStart", "Narration start (s)", "Auto: shot start")}
                    ${this.vocalTimingInput(shot, "narrationEnd", "Narration end (s)", "Auto: shot end")}
                    <label>Narration ending<select data-target="shot" data-id="${esc(shot.id)}" data-field="narrationCutoff">${options([false, true], shot.narrationCutoff === true, { false: "Complete line", true: "Cut off at event end" })}</select></label>
                    <label class="wide h3d-dialogue-field">Exact narration<textarea data-target="shot" data-id="${esc(shot.id)}" data-field="narration" placeholder="Only enter off-screen narration or voiceover words.">${esc(shot.narration)}</textarea></label>
                </div><small class="h3d-language-note">Stable support: Arabic, Chinese, English, French, German, Italian, Japanese, Korean, Portuguese, Russian, and Spanish. Other languages may vary.</small></fieldset></details>
            </div>`;
        return `<section class="h3d-shot-pane h3d-shot-prompts">
            <div class="h3d-pane-title"><b>Prompt fields</b><small>Type @ in a text field to choose a named reference.</small><span class="h3d-spacer"></span><button data-action="preview-prompt">Preview compiled prompt</button></div>
            <label class="h3d-prompt-source">Shot prompt source<select data-target="shot" data-id="${esc(shot.id)}" data-field="promptOverrideEnabled">${options([false, true], shot.promptOverrideEnabled === true, { false: "Director fields", true: "External prompt override" })}</select></label>
            ${promptFields}
            ${this.directorEditor(shot)}
        </section>`;
    }

    referencesView() {
        const presentation = this.referencePresentation();
        const rows = this.data.references.map((ref, index) => {
            const info = presentation.get(ref.id) || { tag: "Library only", socket: "not on timeline" };
            return `<div class="h3d-ref-row ${ref.enabled === false ? "disabled" : ""}">
                <span class="h3d-ref-tag ${ref.type}">${esc(info.tag)}${info.audioTag ? ` + ${esc(info.audioTag)}` : ""}</span>
                <div><b>@${esc(ref.name)}</b><small>${esc(ref.type)} · ${esc(ref.purpose)} · ${esc(ref.mode)} · ${esc(ref.fidelity)}</small></div>
                <code>${esc(info.socket)}${info.audioSocket ? ` + ${esc(info.audioSocket)}` : ""}</code><span class="h3d-spacer"></span>
                <button data-action="edit-ref" data-id="${esc(ref.id)}">Edit</button>
                <button data-action="move-ref" data-id="${esc(ref.id)}" data-direction="-1">&uarr;</button>
                <button data-action="move-ref" data-id="${esc(ref.id)}" data-direction="1">&darr;</button>
                <button class="danger" data-action="remove" data-kind="ref" data-id="${esc(ref.id)}">&times;</button>
            </div>`;
        }).join("");
        return `<div class="h3d-tip"><b>Presentation order is part of the prompt.</b> Direct mode builds these native H3 connections automatically. In compiler mode, use the sockets shown below. Tags are 1-based; socket names are 0-based.</div>
            <div class="h3d-addbar"><button data-action="add-ref" data-type="image">+ Picture</button><button data-action="add-ref" data-type="video">+ Video</button><button data-action="add-ref" data-type="audio">+ Audio</button></div>
            <div class="h3d-ref-list">${rows || '<div class="h3d-empty">No references.</div>'}</div>`;
    }

    guideView() {
        return `<div class="h3d-guide">
            <h3>What Ref2VA can direct</h3>
            <div class="h3d-use-grid">
                <div><b>Identity & products</b><span>Pictures preserve characters, wardrobe, props, products, logos, scenes, composition, and style.</span></div>
                <div><b>Motion & camera</b><span>Videos can provide body motion, object interaction, camera movement, timing, edit structure, or a source to regenerate.</span></div>
                <div><b>Voice & sound</b><span>Choose audio reuse to copy a signal or audio reference to borrow timbre, delivery, content, music style, beat, SFX texture, or continuity. Bind voice audio to a visual subject so its global Sx speaker ID is reused.</span></div>
                <div><b>Multi-shot & editing</b><span>Describe shot boundaries, relationships, replacements, continuity, dialogue, text, and transitions in natural language.</span></div>
            </div>
            <h3>Important limits</h3>
            <ul><li>Output-timeline timing and fidelity are prompt instructions, not per-frame weights or masks.</li><li>Source Media crop is real: the node decodes only that portion in direct mode.</li><li>Use 9 pictures, 3 videos, 3 audio references, and 12 files total as practical limits. Reference video guidance is strongest around 2–15 seconds.</li><li>H3 outputs at 24 fps and the Director's <code>length</code> output snaps to the required 17k+5 frame grid.</li></ul>
            <h3>Recommended graph</h3>
            <p><b>Direct mode:</b> connect CLIP, video VAE, and audio VAE here, then use positive and latent.<br><b>Compiler mode:</b> leave those inputs empty and route compiled_prompt / length into the official H3 node.</p>
        </div>`;
    }

    bind() {
        this.host.querySelector("[data-output-duration]")?.addEventListener("change", (event) => {
            this.setDuration(event.currentTarget.value);
            this.write();
            this.render();
        });
        this.host.querySelector("[data-ui-font-size]")?.addEventListener("change", (event) => {
            this.data.settings.uiFontSize = clamp(Number(event.currentTarget.value || 12), 10, 18);
            this.write();
            this.render();
        });
        this.host.querySelectorAll("details[data-fold]").forEach((details) => details.addEventListener("toggle", () => {
            if (details.open) this.expandedSections.add(details.dataset.fold);
            else this.expandedSections.delete(details.dataset.fold);
        }));
        this.host.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => {
            this.tab = button.dataset.tab;
            this.render();
        }));
        this.host.querySelectorAll("input[data-field],textarea[data-field],select[data-field]:not([data-shot-preset])").forEach((element) => {
            const eventName = element.tagName === "TEXTAREA" || (element.tagName === "INPUT" && element.type === "text") ? "input" : "change";
            element.addEventListener(eventName, () => this.updateField(element));
            if (eventName === "input") element.addEventListener("change", () => this.render());
        });
        this.host.querySelectorAll("[data-shot-preset]").forEach((select) => select.addEventListener("change", () => {
            if (!select.value) return;
            const input = select.parentElement.querySelector(`input[data-field="${select.dataset.field}"]`);
            const custom = select.value === "__custom__";
            if (input) input.value = custom ? "" : select.value;
            const shot = this.find("shot", select.dataset.id);
            if (shot) shot[select.dataset.field] = custom ? "" : select.value;
            this.write();
            if (custom) input?.focus();
        }));
        this.host.querySelectorAll("[data-language-select]").forEach((select) => select.addEventListener("change", () => {
            const shot = this.find("shot", select.dataset.id);
            if (!shot) return;
            shot[select.dataset.languageField] = select.value === "__custom__" ? "" : select.value;
            this.write();
            this.render();
        }));
        this.host.querySelectorAll('input[data-target="shot"][type="text"],textarea[data-target="shot"],input[data-target="shot-global"][type="text"],textarea[data-target="shot-global"]').forEach((element) => {
            element.addEventListener("input", () => this.showAliasMenu(element));
            element.addEventListener("click", () => this.showAliasMenu(element));
            element.addEventListener("keydown", (event) => {
                if (event.key === "Escape") this.closeAliasMenu();
                else if (this.aliasMenu && ["ArrowDown", "ArrowUp"].includes(event.key)) {
                    event.preventDefault();
                    const buttons = [...this.aliasMenu.querySelectorAll("button")];
                    this.aliasIndex = (this.aliasIndex + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
                    buttons.forEach((button, index) => button.classList.toggle("active", index === this.aliasIndex));
                    buttons[this.aliasIndex]?.scrollIntoView({ block: "nearest" });
                } else if (this.aliasMenu && event.key === "Enter") {
                    event.preventDefault();
                    this.aliasChoose?.(this.aliasChoices[this.aliasIndex]);
                }
            });
            element.addEventListener("blur", () => setTimeout(() => this.closeAliasMenu(), 120));
        });
        this.host.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => {
            const action = button.dataset.action;
            if (action === "add-ref") this.addReference(button.dataset.type, button.dataset.timeline === "true");
            else if (action === "add-shot") this.addShot();
            else if (action === "remove") this.remove(button.dataset.kind, button.dataset.id);
            else if (action === "edit-ref") { this.tab = "timeline"; this.select("ref", button.dataset.id); }
            else if (action === "move-ref") this.moveReference(button.dataset.id, Number(button.dataset.direction));
            else if (action === "upload-new") this.chooseMedia(button.dataset.type);
            else if (action === "upload-ref") this.chooseMedia(button.dataset.type, button.dataset.id);
            else if (action === "attach-audio") this.chooseMedia("audio", button.dataset.id, true);
            else if (action === "clear-media") this.clearMedia(button.dataset.id);
            else if (action === "preview-media") this.previewMedia(button.dataset.id);
            else if (action === "unpin-ref") this.unpinReference(button.dataset.id);
            else if (action === "clear-attached") this.clearMedia(button.dataset.id, true);
            else if (action === "language") this.toggleLanguage();
            else if (action === "save-shot-template") this.saveShotTemplate(button.dataset.id);
            else if (action === "load-shot-template") this.loadShotTemplate(button.dataset.id);
            else if (action === "delete-shot-template") this.deleteShotTemplate();
            else if (action === "save-direction-template") this.saveDirectorTemplate(button.dataset.id);
            else if (action === "load-direction-template") this.loadDirectorTemplate(button.dataset.id);
            else if (action === "delete-direction-template") this.deleteDirectorTemplate();
            else if (action === "preview-prompt") void this.previewCompiledPrompt();
            else if (action === "apply-narration") {
                const card = button.closest(".h3d-simple-shot");
                this.applySimpleNarration(
                    button.dataset.id,
                    card?.querySelector("[data-narration-source]")?.value || "custom",
                    card?.querySelector("[data-narration-voice]")?.value,
                    card?.querySelector("[data-narration-language]")?.value,
                    card?.querySelector("[data-narration-line]")?.value,
                    card?.querySelector("[data-narration-start]")?.value ?? "",
                    card?.querySelector("[data-narration-end]")?.value ?? "",
                );
            }
        }));
        this.host.querySelectorAll("[data-block]").forEach((block) => {
            block.addEventListener("click", () => this.select(block.dataset.kind, block.dataset.id));
            block.addEventListener("pointerdown", (event) => {
                if (block.dataset.locked === "true") return;
                const edge = event.target.dataset.edge || "move";
                this.startDrag(event, block.dataset.kind, block.dataset.id, edge, block);
            });
        });
        this.host.querySelectorAll("[data-shot-ref]").forEach((input) => input.addEventListener("change", () => this.toggleShotReference(input.dataset.shot, input.dataset.ref, input.checked)));
        this.host.querySelectorAll("[data-audio-role]").forEach((input) => input.addEventListener("change", () => this.toggleAudioRole(input.dataset.ref, input.dataset.audioRole, input.checked)));
        const templateSelect = this.host.querySelector("[data-template-select]");
        templateSelect?.addEventListener("change", () => {
            this.selectedTemplate = templateSelect.value;
            const nameInput = this.host.querySelector("[data-template-name]");
            if (nameInput && templateSelect.value) nameInput.value = templateSelect.value;
        });
        const directionTemplateSelect = this.host.querySelector("[data-direction-template-select]");
        directionTemplateSelect?.addEventListener("change", () => {
            this.selectedDirectionTemplate = directionTemplateSelect.value;
            const nameInput = this.host.querySelector("[data-direction-template-name]");
            if (nameInput && directionTemplateSelect.value && !directionTemplateSelect.value.startsWith("builtin:")) nameInput.value = directionTemplateSelect.value;
        });
        this.host.querySelectorAll("[data-source-card]").forEach((card) => {
            card.addEventListener("click", (event) => {
                if (!event.target.closest("button,audio,video")) this.select("ref", card.dataset.id);
            });
            card.addEventListener("dragstart", (event) => {
                if (event.target.closest("button,audio,video")) {
                    event.preventDefault();
                    return;
                }
                event.dataTransfer.effectAllowed = "copy";
                event.dataTransfer.setData("application/x-lh-h3-reference", card.dataset.id);
                card.classList.add("dragging");
            });
            card.addEventListener("dragend", () => card.classList.remove("dragging"));
        });
        this.host.querySelectorAll("[data-trim-edge]").forEach((handle) => handle.addEventListener("pointerdown", (event) => {
            const bar = handle.closest("[data-source-crop]");
            this.startSourceTrim(event, bar.dataset.id, handle.dataset.trimEdge, bar);
        }));
        const dropZone = this.host.querySelector("[data-drop-zone]");
        dropZone?.addEventListener("dragover", (event) => { event.preventDefault(); dropZone.classList.add("over"); });
        dropZone?.addEventListener("dragleave", () => dropZone.classList.remove("over"));
        dropZone?.addEventListener("drop", async (event) => {
            event.preventDefault();
            dropZone.classList.remove("over");
            if (event.dataTransfer?.getData("application/x-lh-h3-reference")) return;
            await this.acceptFiles([...(event.dataTransfer?.files || [])]);
        });
        const timelineDrop = this.host.querySelector("[data-timeline-drop]");
        timelineDrop?.addEventListener("dragover", (event) => {
            if (![...(event.dataTransfer?.types || [])].includes("application/x-lh-h3-reference")) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
            timelineDrop.classList.add("drop-target");
        });
        timelineDrop?.addEventListener("dragleave", () => timelineDrop.classList.remove("drop-target"));
        timelineDrop?.addEventListener("drop", (event) => {
            const refId = event.dataTransfer?.getData("application/x-lh-h3-reference");
            if (!refId) return;
            event.preventDefault();
            timelineDrop.classList.remove("drop-target");
            const lane = timelineDrop.querySelector(".h3d-lane");
            const rect = lane?.getBoundingClientRect();
            const time = rect ? clamp((event.clientX - rect.left) / Math.max(1, rect.width) * this.timelineDuration(), 0, this.timelineDuration()) : null;
            this.pinReference(refId, time);
        });
        this.host.onpaste = async (event) => {
            if (event.target.matches("input,textarea")) return;
            const files = [...(event.clipboardData?.files || [])];
            if (files.length) { event.preventDefault(); await this.acceptFiles(files); }
        };
        const preset = this.host.querySelector("[data-preset]");
        preset?.addEventListener("change", () => this.applyPreset(preset.value));
    }

    render() {
        this.closeAliasMenu();
        const warnings = this.clientWarnings();
        const enabled = this.data.references.filter((ref) => ref.enabled !== false).length;
        const uiFontSize = clamp(Number(this.data.settings.uiFontSize || 12), 10, 18);
        const simpleMode = this.data.settings.uiMode === "simple";
        const workflowPresets = simpleMode
            ? `<option value="simple_single">Single-character performance</option><option value="simple_dual">Two-person dialogue</option><option value="simple_silent">Silent action</option><option value="simple_scene">Environment showcase</option><option value="simple_product">Product showcase</option><option value="simple_multi">Three-shot short</option>`
            : `<option value="performance">Character + voice performance</option><option value="motion">Identity + motion transfer</option><option value="product">Product advertisement</option><option value="remix">Video edit / replacement</option>`;
        this.host.innerHTML = `<style>
            .h3d{position:relative;width:100%;height:auto;min-height:0;box-sizing:border-box;overflow:visible;background:#111419;color:#e5e7eb;font:${uiFontSize}px system-ui,sans-serif;padding:8px}.h3d *{box-sizing:border-box}.h3d button,.h3d select,.h3d input,.h3d textarea{font-family:inherit;font-size:inherit}
            .h3d-toolbar,.h3d-addbar,.h3d-inspector-head,.h3d-row{display:flex;align-items:center;gap:6px}.h3d-toolbar{position:sticky;top:0;z-index:20;background:#1d222b;border:1px solid #343c49;border-radius:8px;padding:6px;margin-bottom:8px}.h3d-font-control{display:flex;align-items:center;gap:5px;color:#aeb8c5;white-space:nowrap}.h3d-font-control select{padding:4px 6px}.h3d .h3d-font-control input{width:76px;padding:5px 6px}
            .h3d button,.h3d select{border:1px solid #465160;background:#262d38;color:#e8edf5;border-radius:5px;padding:5px 8px}.h3d button{cursor:pointer}.h3d button:hover{background:#343e4c}.h3d button.active{background:#6651a4;border-color:#a78bfa}.h3d button.danger{color:#fca5a5}.h3d-spacer{flex:1}
            .h3d-status{font-size:11px;color:#9aa5b3}.h3d-status.warn{color:#fbbf24}.h3d-tip{padding:8px 10px;border:1px solid #344152;border-left:3px solid #7c6ad6;border-radius:6px;background:#19202a;color:#b9c3d0;line-height:1.45;margin-bottom:8px}.h3d-addbar{margin:6px 0 8px}.h3d-addbar label{display:flex;align-items:center;gap:5px;color:#9eabb9}
            .h3d-source-panel{border:1px dashed #425364;border-radius:7px;background:#121922;padding:8px;margin-bottom:8px}.h3d-source-panel.over{border-color:#7dd3fc;background:#172536}.h3d-source-title,.h3d-source-buttons,.h3d-source-head,.h3d-source-actions,.h3d-media-row,.h3d-attached{display:flex;align-items:center;gap:6px}.h3d-source-title span{color:#8190a0}.h3d-source-title em{font-style:normal;color:#d7b77a;font-size:10px}.h3d-source-buttons{margin:7px 0}.h3d-source-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:7px}.h3d-source-card{min-width:0;border:1px solid #344152;border-radius:6px;background:#191f28;padding:6px;cursor:grab}.h3d-source-card.dragging{opacity:.55}.h3d-source-card.selected{outline:2px solid #a78bfa}.h3d-source-head{flex-wrap:wrap}.h3d-source-head b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.h3d-source-type{margin-left:auto;color:#7f8b99}.h3d-timeline-state{flex-basis:100%;color:#73d19c!important}.h3d-mode-badge{padding:1px 4px;border-radius:3px;background:#5b3d75;color:#ead7ff!important;font-size:9px}.h3d-source-preview{height:108px;margin:5px 0;background:#090d12;border-radius:4px;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center}.h3d-source-preview img,.h3d-source-preview video{width:100%;height:100%;object-fit:contain}.h3d-source-preview audio{width:96%;height:30px}.h3d-source-empty{color:#687687;text-align:center}.h3d-wave{height:60px;width:96%;display:flex;align-items:center;gap:1px;color:#687687;font-size:10px}.h3d-wave i{flex:1;min-height:2px;background:#73d19c}.h3d-source-crop{height:16px;position:relative;background:#0b1015;margin:5px 0}.h3d-source-crop .shade{position:absolute;top:0;bottom:0;background:#0009}.h3d-source-crop .shade.left{left:0}.h3d-source-crop .shade.right{right:0}.h3d-source-crop .selected{position:absolute;top:2px;bottom:2px;background:#765ba0aa}.h3d-source-crop b{position:absolute;top:-2px;bottom:-2px;width:7px;transform:translateX(-3px);background:#eee;cursor:ew-resize;z-index:2}.h3d-source-crop b.start{background:#f2c66f}.h3d-source-crop b.end{background:#79d2f5}.h3d-source-actions{margin-top:5px}.h3d-media-row,.h3d-attached{border:1px solid #344152;border-radius:5px;background:#121820;padding:6px;margin-bottom:8px}.h3d-media-row code{overflow:hidden;text-overflow:ellipsis}.h3d-attached small{margin-left:8px}
            .h3d-source-cards{grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:9px}.h3d-source-card{padding:7px}.h3d-source-preview{height:190px;margin:7px 0;border-radius:5px}.h3d-source-preview audio{height:34px}.h3d-wave{height:110px}.h3d-source-actions{margin-top:6px}
            .h3d-timeline{position:relative;--h3d-grid-step:16.666667%;border:1px solid #303946;border-radius:7px;overflow:hidden;background:#0e1116}.h3d-timeline.drop-target{border-color:#7dd3fc;box-shadow:inset 0 0 0 2px #38bdf866;background:#12202b}.h3d-ruler-label,.h3d-track-label{width:102px;flex:0 0 102px;padding:0 8px;display:flex;align-items:center;font-size:10px;font-weight:700;letter-spacing:.06em;color:#98a4b3;border-right:1px solid #303946}.h3d-ruler-label{height:28px;float:left}.h3d-ruler{position:relative;margin-left:102px;height:28px;border-bottom:1px solid #303946;background:repeating-linear-gradient(90deg,transparent 0,transparent calc(var(--h3d-grid-step) - 1px),#28313d var(--h3d-grid-step))}.h3d-ruler span{position:absolute;top:5px;transform:translateX(-50%);font-size:10px;color:#7f8a98}.h3d-ruler span:first-child{transform:none}.h3d-ruler span:last-child{transform:translateX(-100%)}.h3d-track{display:flex;min-height:58px;border-bottom:1px solid #252d37}.h3d-track:last-of-type{border-bottom:0}.h3d-track-label.shot-label{color:#c4b5fd}.h3d-track-label.image-label{color:#7dd3fc}.h3d-track-label.video-label{color:#86efac}.h3d-track-label.audio-label{color:#f9a8d4}.h3d-lane{position:relative;flex:1;min-width:0;overflow:hidden;background:repeating-linear-gradient(90deg,transparent 0,transparent calc(var(--h3d-grid-step) - 1px),#1b222b var(--h3d-grid-step))}
            .h3d-lane-rows{background-image:repeating-linear-gradient(180deg,transparent 0,transparent 48px,#27313c 48px,#27313c 49px),repeating-linear-gradient(90deg,transparent 0,transparent calc(var(--h3d-grid-step) - 1px),#1b222b var(--h3d-grid-step))}
            .h3d-block{position:absolute;top:8px;height:41px;min-width:8px;border:1px solid;border-radius:5px;padding:3px 8px;overflow:hidden;cursor:grab;user-select:none;box-shadow:0 2px 5px #0006}.h3d-block.locked{cursor:pointer}.h3d-block.shot{background:#4e3d7d;border-color:#9078d1}.h3d-block.image{background:#174761;border-color:#38a9d4}.h3d-block.video{background:#17523a;border-color:#36b77a}.h3d-block.audio{background:#5b244b;border-color:#d455a9}.h3d-block.selected{outline:2px solid #fff;z-index:4}.h3d-block-title,.h3d-block-time{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.h3d-block-title{font-size:clamp(11px,.78em,14px);font-weight:700;line-height:1.12}.h3d-block-time{font-size:clamp(9px,.62em,11px);line-height:1.12;opacity:.8}.h3d-handle{position:absolute;top:0;bottom:0;width:7px;cursor:ew-resize}.h3d-handle.start{left:0}.h3d-handle.end{right:0}.h3d-playhead{position:absolute;top:28px;bottom:0;width:1px;background:#ef4444;pointer-events:none;z-index:5}
            .h3d-inspector{margin-top:8px;border:1px solid #343e4b;border-radius:7px;background:#191e26;padding:9px}.h3d-inspector-head{margin-bottom:8px}.h3d-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.h3d-grid label{display:flex;flex-direction:column;gap:3px;color:#aeb8c5}.h3d-grid .wide,.h3d-grid fieldset.wide{grid-column:1/-1}.h3d input,.h3d textarea,.h3d-grid select{width:100%;min-width:0;border:1px solid #465160;border-radius:4px;padding:6px;background:#0f1318;color:#f3f4f6}.h3d textarea{min-height:54px;resize:vertical;font:inherit;line-height:1.4}.h3d fieldset{border:1px solid #394553;border-radius:5px}.h3d-checks{display:flex;flex-wrap:wrap;gap:7px}.h3d-checks label{display:flex;flex-direction:row;align-items:center}.h3d-checks input{width:auto}.h3d small{color:#7f8b99}
            .h3d-audio-box{border:1px solid #6b3a61;border-radius:7px;background:#211722;padding:8px}.h3d-audio-title{display:flex;align-items:center;gap:8px;margin-bottom:7px;color:#f9a8d4}.h3d-audio-title small{margin-left:auto}.h3d-audio-roles{display:flex;flex-wrap:wrap;align-items:center;gap:8px;border:1px solid #493244;border-radius:5px;padding:7px}.h3d-audio-roles>b{width:100%;color:#f9a8d4}.h3d-audio-roles label{display:flex;flex-direction:row;align-items:center;gap:4px}.h3d-audio-roles input{width:auto}
            .h3d-workspace{display:grid;grid-template-columns:minmax(320px,22%) minmax(0,1fr);gap:9px;align-items:stretch}.h3d-work-main{min-width:0;display:grid;grid-template-rows:auto auto auto;align-content:start;gap:9px}.h3d-camera-sound-zone,.h3d-material-zone,.h3d-timeline-zone,.h3d-prompt-zone{min-width:0}.h3d-camera-sound-zone>.h3d-shot-pane{height:100%}.h3d-material-zone .h3d-source-panel{margin:0}.h3d-timeline-zone{border:1px solid #303946;border-radius:7px;background:#11161d;padding:8px}.h3d-timeline-zone>.h3d-tip{margin-bottom:6px}.h3d-prompt-zone>.h3d-shot-pane,.h3d-prompt-zone>.h3d-inspector{margin:0}.h3d-reference-prompt{height:100%}.h3d-shot-pane{min-width:0;border:1px solid #354150;border-radius:7px;background:#141a22;padding:8px}.h3d-pane-title{display:flex;align-items:center;gap:7px;margin:-8px -8px 8px;padding:7px 9px;border-bottom:1px solid #354150;background:#1b2430;color:#dbe6f2}.h3d-pane-title small{color:#8f9cab}.h3d-template-bar{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:4px}.h3d-template-bar button{font-size:10px}.h3d-template-message{display:block;min-height:14px;color:#d4b574!important}.h3d-shot-time-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:6px 0}.h3d-shot-time-grid label{display:flex;flex-direction:column;gap:3px;color:#aeb8c5}.h3d-shot-time-grid label:first-child{grid-column:1/-1}.h3d-left-settings{grid-template-columns:1fr}.h3d-left-settings .h3d-preset-control{grid-template-columns:1fr}.h3d-right-prompts{grid-template-columns:repeat(3,minmax(0,1fr))}.h3d-action-field textarea{min-height:300px}.h3d-dialogue-field textarea{min-height:145px}.h3d-collapsible{border:1px solid #3e6071;border-radius:7px;background:#111c24}.h3d-collapsible>summary{cursor:pointer;padding:8px;color:#7dd3fc;font-weight:700}.h3d-collapsible[open]>summary{border-bottom:1px solid #3e6071}.h3d-collapsible>.h3d-voice-panel{margin:8px}.h3d-voice-panel{padding:8px;background:#111720}.h3d-voice-panel>legend{padding:0 6px;font-weight:700}.h3d-voice-panel>.h3d-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.h3d-narration-panel{border-color:#3e6071;background:#111c24}.h3d-language-note{display:block;padding:3px 5px;color:#9aa8b8!important}.h3d-voice-panel select+input{margin-top:3px}.h3d-direction-editor{margin-top:10px;border:1px solid #354150;border-radius:7px;background:#111720;padding:8px;overflow:hidden}.h3d-direction-editor>.h3d-pane-title{margin:-8px -8px 8px;display:flex;align-items:center;gap:8px;cursor:pointer}.h3d-direction-editor:not([open])>.h3d-pane-title{margin-bottom:-8px;border-bottom:0}.h3d-direction-editor>.h3d-pane-title small{margin-left:auto}.h3d-direction-template-bar{grid-template-columns:1fr 1fr}.h3d-direction-source{display:flex;align-items:center;gap:8px;margin:7px 0;color:#aeb8c5}.h3d-direction-source select{flex:1}.h3d-direction-tip{margin:6px 0}.h3d-direction-editor textarea:disabled,.h3d-direction-editor input:disabled{opacity:.65;background:#0b0f14}.h3d-preview-modal{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:4vh 4vw;background:#05080dc7}.h3d-preview-dialog{display:flex;flex-direction:column;width:min(1180px,92vw);height:min(850px,90vh);border:1px solid #607086;border-radius:9px;background:#121820;color:#e7edf5;box-shadow:0 20px 60px #000;padding:10px;font:12px system-ui,sans-serif}.h3d-preview-head{display:flex;align-items:center;gap:7px;margin-bottom:7px}.h3d-preview-head button{border:1px solid #526071;border-radius:5px;background:#27313d;color:#fff;padding:5px 10px}.h3d-preview-meta{color:#d4b574;margin-bottom:7px;white-space:pre-wrap}.h3d-preview-dialog pre{flex:1;overflow:auto;white-space:pre-wrap;margin:0;border:1px solid #394656;border-radius:6px;background:#0a0f15;color:#e6edf5;padding:12px;font:12px/1.55 ui-monospace,Consolas,monospace}
            .h3d-media-preview-dialog{display:flex;flex-direction:column;width:min(1400px,94vw);height:min(920px,92vh);border:1px solid #607086;border-radius:9px;background:#121820;color:#e7edf5;box-shadow:0 20px 60px #000;padding:10px}.h3d-media-preview-stage{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;overflow:hidden;border:1px solid #394656;border-radius:6px;background:#05080c;padding:10px}.h3d-media-preview-stage img,.h3d-media-preview-stage video{display:block;width:100%;height:100%;object-fit:contain}.h3d-media-preview-stage.audio audio{width:min(900px,90%)}
            .h3d-preset-control{display:grid;grid-template-columns:minmax(190px,.8fr) minmax(240px,1.2fr);gap:5px}.h3d-preset-field small{font-size:9px}.h3d-alias-menu{position:absolute;z-index:1000;max-height:240px;overflow:auto;padding:4px;border:1px solid #697889;border-radius:6px;background:#10161e;box-shadow:0 8px 22px #000b}.h3d-alias-menu button{display:grid;width:100%;grid-template-columns:minmax(120px,1fr) auto;gap:3px 8px;text-align:left;background:transparent;border:0;border-radius:4px;padding:6px}.h3d-alias-menu button:hover,.h3d-alias-menu button.active{background:#2c3948;outline:1px solid #65778b}.h3d-alias-menu b{color:#e9ddff}.h3d-alias-menu span{color:#7dd3fc}.h3d-alias-menu small{grid-column:1/-1;color:#8794a3}
            .h3d-ref-list{display:flex;flex-direction:column;gap:6px}.h3d-ref-row{display:flex;align-items:center;gap:9px;border:1px solid #343e4b;border-radius:6px;padding:8px;background:#191e26}.h3d-ref-row.disabled{opacity:.45}.h3d-ref-row>div{min-width:160px}.h3d-ref-row small{display:block}.h3d-ref-row code{color:#c4b5fd}.h3d-ref-tag{min-width:84px;padding:5px;border-radius:4px;text-align:center;font-weight:700}.h3d-ref-tag.image{background:#174761}.h3d-ref-tag.video{background:#17523a}.h3d-ref-tag.audio{background:#5b244b}
            .h3d-direction textarea{min-height:72px}.h3d-empty{text-align:center;color:#8793a2;padding:24px}.h3d-guide{line-height:1.5;color:#bac4d0}.h3d-guide h3{color:#eceff4;margin:14px 0 6px}.h3d-guide code{color:#c4b5fd}.h3d-use-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.h3d-use-grid>div{border:1px solid #34404d;border-radius:6px;background:#191e26;padding:9px}.h3d-use-grid b,.h3d-use-grid span{display:block}.h3d-use-grid span{color:#9eabb9;margin-top:3px}.h3d-guide li{margin:4px 0}
            .h3d-prompt-source{display:grid;grid-template-columns:minmax(150px,.25fr) minmax(240px,.75fr);align-items:center;gap:8px;margin-bottom:8px;color:#c8d2de}.h3d-prompt-source select{width:100%}.h3d-override-tip{border-left-color:#f59e0b;background:#241d12}.h3d-override-field{display:flex;flex-direction:column;gap:5px;color:#f4d38a}.h3d-override-field textarea{min-height:420px}
            .h3d-setting-module{margin-top:8px;border:1px solid #354150;border-radius:7px;background:#111720;overflow:hidden}.h3d-setting-module-head{display:flex;align-items:center;gap:8px;padding:8px 9px;border-bottom:1px solid #354150;background:#1a222c}.h3d-setting-module-head>b{color:#dbe6f2}.h3d-setting-module-head>label{display:flex;align-items:center;gap:5px;margin-left:auto;color:#c4b5fd}.h3d-setting-module-head input{width:auto}.h3d-setting-module>.h3d-grid{padding:8px}.h3d-module-auto-note{padding:11px;color:#aeb8c5;font-style:italic}.h3d-silence-note{color:#d7b77a!important}.h3d-shot-references{margin-top:8px}.h3d-sound-module{border-color:#60445b}.h3d-sound-module>.h3d-setting-module-head{border-color:#60445b}.h3d-transition-module{border-color:#4b5364}.h3d-transition-module>.h3d-setting-module-head{border-color:#4b5364}
            .h3d-simple-view{display:flex;flex-direction:column;gap:9px}.h3d-simple-top{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,3fr);gap:9px}.h3d-simple-panel{min-width:0;border:1px solid #354150;border-radius:7px;background:#141a22;padding:8px}.h3d-simple-panel-title,.h3d-simple-card-head{display:flex;align-items:center;gap:7px}.h3d-simple-panel-title{margin:-8px -8px 8px;padding:8px 9px;border-bottom:1px solid #354150;background:#1b2430}.h3d-simple-panel-title small,.h3d-simple-card-head small{color:#8f9cab}.h3d-simple-subjects{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:8px}.h3d-simple-subject,.h3d-simple-shot{border:1px solid #354150;border-radius:7px;background:#111720;padding:8px}.h3d-simple-subject-fields{margin-top:8px}.h3d-simple-shot+.h3d-simple-shot{margin-top:9px}.h3d-simple-card-head{margin:-8px -8px 8px;padding:7px 9px;border-bottom:1px solid #354150;background:#1a222c}.h3d-simple-card-head>label{display:flex;align-items:center;gap:6px;color:#aeb8c5}.h3d-simple-shot-main{grid-template-columns:2fr 1fr 1fr}.h3d-simple-action textarea{min-height:220px}.h3d-narration-helper{display:grid;grid-template-columns:auto minmax(180px,.8fr) minmax(180px,.8fr) minmax(140px,.6fr) 100px 100px;align-items:end;gap:7px;margin-top:8px;border:1px solid #514467;border-radius:6px;background:#181525;padding:8px}.h3d-narration-helper>b{align-self:center;color:#c4b5fd}.h3d-narration-helper label{display:flex;flex-direction:column;gap:3px;color:#aeb8c5}.h3d-narration-helper input,.h3d-narration-helper select{width:100%}.h3d-narration-line{grid-column:2/6}.h3d-simple-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:8px}.h3d-simple-controls>div{min-width:0;border:1px solid #354150;border-radius:6px;background:#121820;padding:8px}.h3d-simple-auto{display:flex;align-items:center;gap:6px;color:#dbe6f2;font-weight:700}.h3d-simple-auto input{width:auto}.h3d-simple-control-fields{display:flex;flex-direction:column;gap:7px;margin-top:8px}.h3d-simple-control-fields>label{display:flex;flex-direction:column;gap:3px;color:#aeb8c5}.h3d-simple-control-fields small{color:#d7b77a}
            @media(max-width:1100px){.h3d-workspace{grid-template-columns:1fr}.h3d-camera-sound-zone>.h3d-shot-pane{height:auto}.h3d-right-prompts,.h3d-voice-panel>.h3d-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.h3d-simple-top,.h3d-simple-controls{grid-template-columns:1fr}.h3d-narration-helper{grid-template-columns:1fr 1fr}.h3d-narration-helper>b,.h3d-narration-line{grid-column:1/-1}}@media(max-width:760px){.h3d-grid,.h3d-voice-panel>.h3d-grid,.h3d-simple-shot-main{grid-template-columns:1fr}.h3d-preset-control{grid-template-columns:1fr}.h3d-use-grid{grid-template-columns:1fr}.h3d-ref-row code{display:none}.h3d-prompt-source{grid-template-columns:1fr}.h3d-simple-subjects,.h3d-narration-helper{grid-template-columns:1fr}.h3d-narration-helper>*{grid-column:1!important}}
        </style><div class="h3d">
            <div class="h3d-toolbar">
                <button data-tab="timeline" class="${this.tab === "timeline" ? "active" : ""}">Timeline</button>
                <button data-tab="references" class="${this.tab === "references" ? "active" : ""}">References (${enabled})</button>
                <button data-tab="guide" class="${this.tab === "guide" ? "active" : ""}">R2V Guide</button>
                <button data-action="language" class="h3d-language" title="中文 / English">中 / EN</button>
                <label class="h3d-font-control">Interface mode <select data-target="settings" data-field="uiMode">${options(["simple", "director"], simpleMode ? "simple" : "director", { simple: "Simple", director: "Director" })}</select></label>
                <label class="h3d-font-control">Output duration (s) <input type="number" min="0.01" max="60" step="0.1" data-output-duration value="${esc(this.duration())}"></label>
                <label class="h3d-font-control">Font size <select data-ui-font-size>${options([10, 11, 12, 13, 14, 16, 18], uiFontSize, { 10: "10px", 11: "11px", 12: "12px", 13: "13px", 14: "14px", 16: "16px", 18: "18px" })}</select></label>
                <span class="h3d-spacer"></span>
                <select data-preset><option value="">Apply workflow preset…</option>${workflowPresets}</select>
                <span class="h3d-status ${warnings.length ? "warn" : ""}" title="${esc(warnings.join("\n"))}">${warnings.length ? `⚠ ${warnings.length}` : "Ready"}</span>
            </div>
            ${this.tab === "timeline" ? simpleMode ? this.simpleView() : this.timelineView() : this.tab === "references" ? this.referencesView() : this.guideView()}
        </div>`;
        this.localize();
        this.bind();
        this.scheduleLayout();
    }
}

app.registerExtension({
    name: "LH.MiniMaxH3DirectorTimelineV3",
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== NODE_NAME) return;
        const created = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            const result = created?.apply(this, arguments);
            this.size = [Math.max(1200, this.size?.[0] || 0), Math.max(980, this.size?.[1] || 0)];
            for (const name of ["director_data", "base_prompt"]) hideWidget(widget(this, name));
            const host = document.createElement("div");
            const uiWidget = this.addDOMWidget("h3_director_ui", "h3_director_ui", host, {
                getValue: () => "",
                setValue: () => {},
                hideOnZoom: false,
            });
            uiWidget.computeSize = (width) => [width, 790];
            setTimeout(() => {
                this._lhH3Director?.destroy();
                this._lhH3Director = new DirectorUI(this, host, uiWidget);
            }, 0);
            return result;
        };
        const configured = nodeType.prototype.onConfigure;
        nodeType.prototype.onConfigure = function () {
            const result = configured?.apply(this, arguments);
            setTimeout(() => {
                for (const name of ["director_data", "base_prompt"]) hideWidget(widget(this, name));
                if (!this._lhH3Director) return;
                this._lhH3Director.data = initialData(this);
                this._lhH3Director.render();
            }, 0);
            return result;
        };
        const removed = nodeType.prototype.onRemoved;
        nodeType.prototype.onRemoved = function () {
            this._lhH3Director?.destroy();
            return removed?.apply(this, arguments);
        };
    },
});
