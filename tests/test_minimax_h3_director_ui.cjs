const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { randomUUID } = require('node:crypto');
const { test } = require('node:test');
const vm = require('node:vm');

const context = vm.createContext({
    app: { registerExtension() {} }, api: { apiURL: (path) => path },
    crypto: { randomUUID }, URLSearchParams,
});
const source = readFileSync(join(__dirname, '../js/lh_minimax_h3_director.js'), 'utf8');
vm.runInContext(source.replace(/^import .*;\r?\n/gm, '')
    + '\nglobalThis.exports = { DirectorUI, presetPlan, normalizeData };', context);
const { DirectorUI, presetPlan, normalizeData } = context.exports;
vm.runInContext('uploadFile = async (file) => file.name; probeDuration = async () => 0;', context);

function editor() {
    const ui = Object.create(DirectorUI.prototype);
    ui.data = normalizeData(presetPlan('remix', 5), 5);
    Object.assign(ui.data.references[0], { sourcePath: 'source.mp4', sourceDuration: 12, trimStart: 2, trimEnd: 9 });
    Object.assign(ui.data.references[1], { sourcePath: 'character.png' });
    ui.durationWidget = { name: 'duration_seconds', value: 5 };
    ui.basePromptWidget = { name: 'base_prompt', value: 'OLD PROMPT' };
    ui.node = { widgets: [ui.durationWidget, ui.basePromptWidget, { name: 'director_data', value: '' }], setDirtyCanvas() {} };
    ui.host = { innerHTML: '' };
    ui.tab = 'timeline';
    for (const method of ['closeAliasMenu', 'localize', 'bind', 'scheduleLayout']) ui[method] = () => {};
    return ui;
}

test('edit workspace follows source crop without rendering shot controls', () => {
    const ui = editor();
    ui.data.edit.replacements[0].target = 'woman on the right';
    ui.render();
    assert.equal(ui.duration(), 7);
    assert.match(ui.host.innerHTML, /24fps目标 168 帧；H3生成 175 帧/);
    assert.match(ui.host.innerHTML, /人物替换 1/);
    assert.match(ui.host.innerHTML, /角色卡／多视图/);
    assert.doesNotMatch(ui.host.innerHTML, /<b>Shot controls<\/b>/);
    assert.doesNotMatch(ui.host.innerHTML, /<b>Prompt fields<\/b>/);
    assert.match(ui.host.innerHTML, /class="h3d-edit-source"/);
    assert.match(ui.host.innerHTML, /h3d-edit-source\{display:flex;flex-direction:column/);
    const panel = ui.editView();
    assert.ok(panel.indexOf('<video ') < panel.indexOf('data-field="trimStart"'));
    assert.ok(panel.indexOf('<video ') < panel.indexOf('data-field="mediaMode"'));
    const saved = JSON.parse(ui.node.widgets[2].value);
    const restored = normalizeData(saved, 7);
    assert.equal(restored.settings.uiMode, 'edit');
    assert.equal(restored.edit.replacements[0].target, 'woman on the right');
    assert.equal(restored.shots.length, 1);
});

test('manual sound layers render independently and retain descriptions', () => {
    const ui = editor();
    ui.data.edit.sfxMode = 'manual';
    ui.data.edit.sfx = 'A single door closes.';
    ui.render();
    assert.match(ui.host.innerHTML, /data-field="sfx"[^>]*>A single door closes\./);
    assert.doesNotMatch(ui.host.innerHTML, /<textarea[^>]*data-field="ambience"/);
    ui.data.edit.followSource = false;
    ui.durationWidget.value = 4;
    ui.render();
    assert.equal(ui.duration(), 4);
    assert.equal(ui.data.edit.sfx, 'A single door closes.');
});

test('source crop changes update output duration and replacement selection stays explicit', () => {
    const ui = editor();
    const row = ui.data.edit.replacements[0];
    assert.equal(ui.promptReferences().length, 1);
    row.target = 'woman on the right';
    assert.equal(ui.promptReferences().length, 2);
    ui.updateField({ dataset: { target: 'ref', id: ui.data.edit.sourceRefId, field: 'trimEnd' }, type: 'number', value: '8', hasAttribute: () => false });
    assert.equal(ui.duration(), 6);
    assert.equal(row.target, 'woman on the right');
});

test('top-level image upload fills placeholder row and displays its preview', async () => {
    const ui = editor();
    const ref = ui.data.references[1];
    ref.sourcePath = '';
    const row = ui.data.edit.replacements[0];
    row.target = 'woman on the right';
    await ui.acceptFiles([{ name: 'uploaded.png', type: 'image/png' }], { type: 'image' });
    assert.equal(ui.data.references.length, 2);
    assert.equal(row.refId, ref.id);
    assert.equal(ref.sourcePath, 'uploaded.png');
    assert.equal(row.target, 'woman on the right');
    assert.match(ui.editView(), /<img[^>]*uploaded.png/);
});

test('batch image upload creates rows without overwriting existing characters', async () => {
    const ui = editor();
    await ui.acceptFiles([{ name: 'second.png', type: 'image/png' }, { name: 'third.png', type: 'image/png' }], { type: 'image' });
    assert.equal(ui.data.edit.replacements.length, 3);
    assert.equal(ui.data.references[1].sourcePath, 'character.png');
    const paths = ui.data.edit.replacements.map((row) => ui.find('ref', row.refId).sourcePath);
    assert.equal(paths.join(','), 'character.png,second.png,third.png');
});

test('row upload creates its missing image and later replaces only that row', async () => {
    const ui = editor();
    const row = { id: 'empty-row', refId: '', target: 'man on the left', scope: 'face' };
    ui.data.edit.replacements.push(row);
    assert.match(ui.editView(), /data-action="upload-replacement" data-id="empty-row"/);
    await ui.acceptFiles([{ name: 'new.png', type: 'image/png' }], { type: 'image', replacementId: row.id });
    const refId = row.refId;
    await ui.acceptFiles([{ name: 'updated.png', type: 'image/png' }], { type: 'image', refId, replacementId: row.id });
    assert.equal(row.refId, refId);
    assert.equal(ui.find('ref', refId).sourcePath, 'updated.png');
    assert.equal(ui.data.references.length, 3);
    assert.equal(ui.data.edit.replacements.length, 2);
    assert.equal(row.target, 'man on the left');
    assert.equal(ui.data.references[1].sourcePath, 'character.png');
});
