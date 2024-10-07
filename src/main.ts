import { Plugin, Notice, TFile, WorkspaceLeaf } from 'obsidian';
import { SnapshotSettingTab } from './settings';
import { SnapshotPanelView } from './ui';

interface MyPluginSettings {
    snapshotFolder: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
    snapshotFolder: 'Snapshots'
};

export default class MyPlugin extends Plugin {
    settings!: MyPluginSettings;

    async onload() {
        // 설정 불러오기
        await this.loadSettings();

        // 설정 탭 추가
        this.addSettingTab(new SnapshotSettingTab(this.app, this));

        // 스냅샷 저장 명령어 추가
        this.addCommand({
            id: 'save-snapshot',
            name: 'Save Snapshot',
            callback: () => this.saveSnapshot(),
        });

        // "스냅샷 목록 보기" 명령어 추가
        this.addCommand({
            id: 'show-snapshot-panel',
            name: 'Show Snapshot Panel',
            callback: () => this.activateSnapshotView(),
        });

        // 스냅샷 패널을 오른쪽에 추가
        this.registerView('snapshot-view', (leaf: WorkspaceLeaf) =>
            new SnapshotPanelView(leaf, this)
        );

        // 앱 로드 시 스냅샷 패널 자동 표시
        this.activateSnapshotView();

        // 파일 변경 이벤트 처리
        this.registerEvent(
            this.app.workspace.on('file-open', () => this.updateSnapshotPanel())
        );
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async saveSnapshot() {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice("No active file to snapshot");
            return;
        }
    
        const snapshotFolderBase = this.settings.snapshotFolder;
        const fileNameWithoutExtension = activeFile.name.replace('.md', '');
    
        // 원본 파일 경로가 없으면 루트 디렉토리로 처리
        const originalPath = activeFile.parent ? activeFile.parent.path : '';
    
        // 루트 디렉토리와 비루트 디렉토리의 경로를 각각 처리
        console.log(originalPath);
        let snapshotFolder = ((originalPath.length) > 1)
            ? `${snapshotFolderBase}/${originalPath}/${fileNameWithoutExtension}`
            : `${snapshotFolderBase}/${fileNameWithoutExtension}`;
    
        const timestamp = new Date().toISOString().replace(/[:.-]/g, "");
        const snapshotFileName = `${timestamp}.md`;
    
        const content = await this.app.vault.read(activeFile);
    
        // 스냅샷 폴더가 존재하지 않으면 생성
        if (!(await this.app.vault.adapter.exists(snapshotFolder))) {
            await this.app.vault.adapter.mkdir(snapshotFolder);
        }
    
        const snapshotFilePath = `${snapshotFolder}/${snapshotFileName}`;
        await this.app.vault.create(snapshotFilePath, content);
        new Notice(`Snapshot saved: ${snapshotFilePath}`);
    
        // 스냅샷 패널이 열려 있으면 업데이트
        const leaf = this.app.workspace.getLeavesOfType('snapshot-view')[0];
        if (leaf) {
            const view = leaf.view as SnapshotPanelView;
            view.updateSnapshots();  // 스냅샷 패널 업데이트
        }
    }
    
    

    async activateSnapshotView() {
        const leaf = this.app.workspace.getRightLeaf(false);
        await leaf!.setViewState({
            type: 'snapshot-view',
            active: true
        });
        this.app.workspace.revealLeaf(leaf!);
    }

    async updateSnapshotPanel() {
        const leaves = this.app.workspace.getLeavesOfType('snapshot-view');
        if (leaves.length > 1) {
            const leaf = leaves[0];
            const view = leaf.view as SnapshotPanelView;
            if (view) {
                view.updateSnapshots(); // 현재 열려 있는 파일의 스냅샷 목록을 업데이트
            }
        }
    }
    

    onunload() {
        this.app.workspace.getLeavesOfType('snapshot-view').forEach(leaf => leaf.detach());
    }
}
