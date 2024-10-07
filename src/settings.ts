import { App, PluginSettingTab, Setting } from 'obsidian';
import MyPlugin from './main';

export class SnapshotSettingTab extends PluginSettingTab {
    plugin: MyPlugin;

    constructor(app: App, plugin: MyPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();
        containerEl.createEl('h2', { text: 'Snapshot Plugin Settings' });

        new Setting(containerEl)
            .setName('Snapshot Folder')
            .setDesc('Choose the folder where snapshots will be saved.')
            .addText(text => text
                .setPlaceholder('Enter folder path')
                .setValue(this.plugin.settings.snapshotFolder)
                .onChange(async (value) => {
                    this.plugin.settings.snapshotFolder = value.trim();
                    await this.plugin.saveSettings();  // 저장된 설정을 다시 저장
                }));
    }
}
