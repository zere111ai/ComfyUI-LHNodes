import { Director } from "./wanani_director.js";

const { app } = window.comfyAPI.app;

class Animate2Director extends Director {
  get requiresPositivePrompt() { return false; }
  minSegmentFrames() { return 1; }

  t(key) {
    const labels = this.lang === "zh" ? {
      positive: "角色外观 / 背景提示词", promptRequired: "可留空；建议描述角色外观和背景，动作写在下方动作提示词中",
      singleWarning: "模型使用本段第一张参考图。可点击“设为参考图”切换，或用合成器将多个人物合成一张图。",
      refTip: "第一张为模型参考图，其余保留作编辑素材", uploadTip: "保留逐段参考图与图片编辑",
    } : {
      positive: "Appearance / background prompt", promptRequired: "Optional: describe appearance and background; enter motion separately below",
      singleWarning: "The first reference drives the model. Select another image or compose multiple characters into one image.",
      refTip: "First image is active; other images are editing assets", uploadTip: "Per-segment reference images and editing",
    };
    return labels[key] || super.t(key);
  }

  build() {
    super.build();
    this.root.querySelector(".wad2-title").textContent = "WAN ANI 2 DIRECTOR";
    this.topTools.querySelector('[data-mode="replacement"]').remove();
    // The shared renderer updates this control; Animate 2 has no multi-ref mode.
    this.topTools.querySelector("[data-multi]").style.display = "none";
    const sam = this.root.querySelector('[data-a="sam3"]');
    sam.parentElement.querySelector(".wad2-muted").textContent = this.lang === "zh"
      ? "原始视频驱动动作；过渡使用上一段末帧，自动移除重复帧"
      : "Raw video motion; continuation uses the previous last frame and removes the overlap";
    sam.remove();
    const wrap = document.createElement("div");
    wrap.className = "wad2-prompt-wrap";
    const label = document.createElement("b");
    label.textContent = this.lang === "zh" ? "动作提示词（空白沿用上一段）" : "Motion prompt (blank inherits)";
    this.poseInput = document.createElement("textarea");
    this.poseInput.className = "wad2-prompt";
    this.poseInput.placeholder = "A person dancing with rhythmic steps and dynamic arm gestures.";
    this.poseInput.oninput = () => {
      this.state.segments[this.selected].positive_pose = this.poseInput.value;
      this.persist();
    };
    wrap.append(label, this.poseInput);
    this.promptWrap.after(wrap);
    this.renderPrompt();
  }

  renderPrompt() {
    super.renderPrompt();
    if (this.poseInput && document.activeElement !== this.poseInput)
      this.poseInput.value = this.state.segments[this.selected]?.positive_pose || "";
  }

  resizePreview() {
    super.resizePreview();
    if (this.root && this.widget)
      this.widget.computeSize = width => [width, this.root.scrollHeight + 20];
  }

  renderLeft() {
    super.renderLeft();
    const segment = this.state.segments[this.selected];
    this.left.querySelectorAll(".wad2-ref[data-r]").forEach(card => {
      const index = Number(card.dataset.r);
      const select = document.createElement("button");
      select.textContent = this.lang === "zh" ? (index ? "设为参考图" : "当前参考图") : (index ? "Use reference" : "Active reference");
      select.disabled = index === 0;
      select.onclick = event => {
        event.stopPropagation();
        segment.references.unshift(segment.references.splice(index, 1)[0]);
        this.persist();
        this.render();
      };
      card.parentElement.append(select);
    });
  }

  persist() {
    for (const segment of this.state.segments) {
      segment.mode = "transfer";
      segment.multi_ref = false;
      delete segment.sam3_marking;
    }
    super.persist();
  }
}

app.registerExtension({
  name: "WanAni2Director.UI",
  async beforeRegisterNodeDef(nodeType, nodeData) {
    if (nodeData.name !== "WanAni2Director") return;
    const created = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function () {
      const result = created?.apply(this, arguments);
      for (const widget of this.widgets || []) {
        widget.hidden = true;
        widget.computeSize = () => [0, -4];
        widget.draw = () => {};
        if (widget.element) widget.element.style.display = "none";
      }
      this.size = [Math.max(900, this.size?.[0] || 0), 900];
      const host = document.createElement("div");
      const widget = this.addDOMWidget("wanani2_director", "wanani2_director", host, { getValue: () => "", setValue: () => {} });
      setTimeout(() => {
        this._wad2?.destroy();
        this._wad2 = new Animate2Director(this, host, widget);
      }, 0);
      return result;
    };
    const removed = nodeType.prototype.onRemoved;
    nodeType.prototype.onRemoved = function () {
      this._wad2?.destroy();
      return removed?.apply(this, arguments);
    };
  },
});
