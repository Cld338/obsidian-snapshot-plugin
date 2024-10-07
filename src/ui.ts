import { ItemView, TFile, WorkspaceLeaf, MarkdownRenderer } from 'obsidian';
import MyPlugin from './main';

export class SnapshotPanelView extends ItemView {
    plugin: MyPlugin;

    constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
        super(leaf);
        this.plugin = plugin;
        this.icon = 'camera'; // 스냅샷 아이콘
    }

    getViewType() {
        return 'snapshot-view';
    }

    getDisplayText() {
        return 'Snapshot View';
    }

    async onOpen() {
        // 스냅샷 목록을 한 번만 로드
        await this.updateSnapshots();
        this.applyThemeColors(); // 테마 색상 적용

        // 테마 변경 감지 및 색상 업데이트
        this.app.workspace.on("layout-change", () => {
            this.applyThemeColors();
        });

        this.containerEl.style.overflowY = 'auto'; // 세로 스크롤 허용
        this.containerEl.style.maxHeight = '100%'; // 패널이 윈도우를 넘어가지 않도록 설정
        this.containerEl.style.padding = '10px'; // 패널 내부의 여백 추가
    }

    applyThemeColors() {
        // 현재 테마의 CSS 변수에서 배경 및 텍스트 색상 가져오기
        const computedStyle = getComputedStyle(document.body);
        const backgroundColor = computedStyle.getPropertyValue('--background-primary').trim();
        const textColor = computedStyle.getPropertyValue('--text-normal').trim();

        // 테마에 따른 배경색과 텍스트 색상 적용
        this.containerEl.style.backgroundColor = backgroundColor || 'transparent';
        this.containerEl.style.color = textColor || '#ffffff';
    }

    async updateSnapshots() {
        const container = this.containerEl;
        container.empty(); // 기존의 스냅샷 목록을 비움

        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            container.createEl('p', { text: 'No file selected.' });
            return;
        }

        const snapshots = await this.getSnapshotFilesForFile(activeFile);

        if (snapshots.length === 0) {
            container.createEl('p', { text: `No snapshots found for ${activeFile.name}` });
            return;
        }

        container.createEl('h3', { text: `Snapshots for ${activeFile.name}` });

        snapshots.forEach(snapshotFile => {
            const snapshotContainer = container.createEl('div', { cls: 'snapshot-item' });

            // 스냅샷 파일 이름 표시
            const title = snapshotContainer.createEl('div', {
                text: snapshotFile.split('/').pop(), // 파일 이름만 표시
                cls: 'snapshot-title'
            });

            // 스냅샷 파일의 내용 렌더링할 영역
            const contentContainer = snapshotContainer.createEl('div', {
                cls: 'snapshot-content',
                attr: { style: 'display: none;' }
            });

            title.addEventListener('click', async () => {
                if (contentContainer.style.display === 'none') {
                    const fileContent = await this.app.vault.adapter.read(snapshotFile);
            
                    // 기존 내용을 마크다운 형식으로 렌더링
                    contentContainer.empty(); // 기존 컨텐츠를 비움
            
                    // "Open in New Tab" 링크 추가
                    const openInNewTabLink = contentContainer.createEl('span', { text: 'Open in New Tab' });
                    openInNewTabLink.style.display = 'block';
                    openInNewTabLink.style.marginBottom = '10px'; // 링크 아래에 약간의 마진 추가
                    openInNewTabLink.style.cursor = 'pointer';
                    openInNewTabLink.style.fontWeight = 'bold'; // 볼드체
                    openInNewTabLink.style.textDecoration = 'underline'; // 밑줄
            
                    // 새 탭에서 열기 기능 구현
                    openInNewTabLink.addEventListener('click', async () => {
                        const newLeaf = this.app.workspace.getLeaf(true); // 새 편집기 탭 생성
                        const file = this.app.vault.getAbstractFileByPath(snapshotFile);
            
                        if (file instanceof TFile) {
                            await newLeaf.openFile(file); // 새 편집기 탭에서 파일 열기
                        }
                    });
            
            
                    await MarkdownRenderer.renderMarkdown(
                        fileContent, // 렌더링할 마크다운 내용
                        contentContainer, // 렌더링할 컨테이너
                        snapshotFile, // 스냅샷 파일 경로
                        this // 뷰어 컨텍스트
                    );
            
                    // 테마 색상을 적용
                    const computedStyle = getComputedStyle(document.body);
                    contentContainer.style.backgroundColor = computedStyle.getPropertyValue('--background-primary').trim();
            
                    contentContainer.style.display = 'block';
                } else {
                    contentContainer.style.display = 'none';
                }
            });
            
            
        });
    }

    async getSnapshotFilesForFile(file: TFile): Promise<string[]> {
        const originalPath = file.parent!.path; // 원본 파일 경로
        const snapshotFolder = `${this.plugin.settings.snapshotFolder}/${originalPath}`; // 스냅샷 폴더 경로
        const snapshotFiles: string[] = [];

        // 스냅샷 폴더가 있는지 확인
        if (await this.app.vault.adapter.exists(snapshotFolder)) {
            const files = await this.app.vault.adapter.list(snapshotFolder);
            snapshotFiles.push(...files.files); // 폴더 내 모든 파일을 배열에 추가
        }

        return snapshotFiles;
    }

    async onClose() {
        // 패널이 닫힐 때 필요한 정리 작업
    }
}
