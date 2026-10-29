const { Modal, Notice, addIcon, setIcon } = require('obsidian');
const AnimeProgressPlugin = require('./anime-runtime').default;
const {
	isGameNote,
	parseChecklist,
	readInitialProgress,
	updateChecklist,
	applyCompletionMetadata,
} = require('./game-progress');

const PROGRESS_ICON_ID = 'obsidian-progress-tracker-checklist';
const PROGRESS_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 6 1.5 1.5L7 5"/><path d="M10 6h11"/><path d="m3 12 1.5 1.5L7 11"/><path d="M10 12h11"/><path d="m3 18 1.5 1.5L7 17"/><path d="M10 18h11"/></svg>';

function frontmatterText(value) {
	const first = Array.isArray(value) ? value[0] : value;
	if (typeof first !== 'string') return '';
	const match = first.trim().match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/);
	return match ? (match[2] || match[1]).trim() : first.trim();
}

function todayDate() {
	if (window.moment) return window.moment().format('YYYY-MM-DD');
	const now = new Date();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `${now.getFullYear()}-${month}-${day}`;
}

function isBookNote(frontmatter) {
	const rawTypes = frontmatter && frontmatter.type;
	const types = Array.isArray(rawTypes) ? rawTypes : [rawTypes];
	return types.some((rawType) => {
		if (rawType == null) return false;
		const type = String(rawType)
			.replace(/^\[\[/, '')
			.replace(/\]\]$/, '')
			.split('|', 1)[0]
			.trim();
		return type === '\u{1F4DA}' || /^book$/i.test(type);
	});
}

class GameProgressModal extends Modal {
	constructor(app, title, cover, items, initialProgress, onSave, total = items.length, isBook = false) {
		super(app);
		this.title = title;
		this.cover = cover;
		this.items = items;
		this.total = total;
		this.progress = initialProgress;
		this.onSaveProgress = onSave;
		this.isBook = isBook;
	}

	onOpen() {
		this.modalEl.addClass('wpm-modal');
		this.contentEl.addClass('watch-progress-modal');

		const header = this.contentEl.createDiv({ cls: 'wpm-header' });
		header.createDiv({ cls: 'wpm-title', text: this.title });
		if (this.cover) header.createEl('img', { cls: 'wpm-cover', attr: { src: this.cover, alt: '' } });

		const progressBar = this.contentEl.createDiv({ cls: 'wpm-bar-wrap' });
		const track = progressBar.createDiv({ cls: 'wpm-bar-track' });
		const fill = track.createDiv({ cls: 'wpm-bar-fill' });
		const percentage = progressBar.createDiv({ cls: 'wpm-percent-label' });

		const numberRow = this.contentEl.createDiv({ cls: 'wpm-number-row' });
		const decrement = numberRow.createEl('button', { cls: 'wpm-step-btn', text: '-' });
		const readout = numberRow.createDiv({ cls: 'wpm-readout' });
		const input = readout.createEl('input', {
			type: 'number',
			cls: 'wpm-progress-input',
			attr: { min: '0', max: String(this.total), step: '1' },
		});
		readout.createSpan({ cls: 'wpm-slash', text: '/' });
		readout.createSpan({ cls: 'wpm-total-display', text: String(this.total) });
		const increment = numberRow.createEl('button', { cls: 'wpm-step-btn', text: '+' });

		const current = this.contentEl.createDiv({ cls: 'wpm-episode-title' });
		const actions = this.contentEl.createDiv({ cls: 'wpm-btn-row' });
		actions.createEl('button', { text: 'Cancel' }).addEventListener('click', () => this.close());
		const save = actions.createEl('button', { text: 'Save', cls: 'mod-cta' });

		const render = () => {
			const percent = this.total > 0 ? Math.round((this.progress / this.total) * 100) : 0;
			input.value = String(this.progress);
			fill.style.width = `${percent}%`;
			percentage.setText(`${percent}%`);
			current.setText(this.progress > 0 && this.items[this.progress - 1]
				? `${this.progress}. ${this.items[this.progress - 1].title}`
				: this.isBook && this.progress > 0 ? `Chapter ${this.progress}` : '');
		};

		const set = (value) => {
			this.progress = Math.max(0, Math.min(this.total, Math.round(Number(value) || 0)));
			render();
		};

		decrement.addEventListener('click', () => set(this.progress - 1));
		increment.addEventListener('click', () => set(this.progress + 1));
		input.addEventListener('change', () => set(input.value));
		save.addEventListener('click', async () => {
			save.disabled = true;
			try {
				await this.onSaveProgress(this.progress);
				this.close();
			} catch (error) {
				console.error(error);
				new Notice(`Could not save progress: ${error instanceof Error ? error.message : error}`);
				save.disabled = false;
			}
		});

		render();
	}

	onClose() {
		this.contentEl.empty();
	}
}

module.exports = class ProgressTrackerPlugin extends AnimeProgressPlugin {
	addRibbonIcon(icon, title, callback) {
		if (icon === 'clapperboard') icon = PROGRESS_ICON_ID;
		return super.addRibbonIcon(icon, title, callback);
	}

	async onload() {
		addIcon(PROGRESS_ICON_ID, PROGRESS_ICON_SVG);
		await super.onload();
		this.addCommand({
			id: 'update-active-note-progress',
			icon: PROGRESS_ICON_ID,
			name: 'Update progress for active anime, game, or book note',
			checkCallback: (checking) => {
				const file = this.app.workspace.getActiveFile();
				if (!file || file.extension !== 'md') return false;
				if (!checking) void this.syncAndOpen(file);
				return true;
			},
		});
	}

	async syncAndOpen(file) {
		const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter || {};
		if (isBookNote(frontmatter)) return this.openBookProgress(file, frontmatter);
		if (!isGameNote(frontmatter)) return this.openAnimeWithEpisodeUpdate(file);

		try {
			const content = await this.app.vault.read(file);
			const items = parseChecklist(content);
			if (!items.length) {
				new Notice('Add numbered checkboxes under "## Chapters" to track this game.');
				return;
			}

			const title = frontmatterText(frontmatter.title) || file.basename;
			const cover = frontmatterText(frontmatter.cover);
			const initialProgress = readInitialProgress(items, frontmatter.progress);
			new GameProgressModal(this.app, title, cover, items, initialProgress, async (progress) => {
				const latestContent = await this.app.vault.read(file);
				const latestItems = parseChecklist(latestContent);
				if (latestItems.length !== items.length) {
					throw new Error('The checklist changed while the progress window was open. Reopen it and try again.');
				}
				const updatedContent = updateChecklist(latestContent, progress);
				if (updatedContent !== latestContent) await this.app.vault.modify(file, updatedContent);
				await this.app.fileManager.processFrontMatter(file, (properties) => {
					properties.chapters = items.length;
					properties.progress = progress;
					if (progress >= items.length) {
						applyCompletionMetadata(properties, todayDate());
					}
				});
				new Notice(`Progress saved: ${progress}/${items.length}`);
			}).open();
		} catch (error) {
			console.error(error);
			new Notice(`Could not open game progress: ${error instanceof Error ? error.message : error}`);
		}
	}

	async openBookProgress(file, frontmatter) {
		try {
			const content = await this.app.vault.read(file);
			const items = parseChecklist(content);
			const chaptersValue = Number(Array.isArray(frontmatter.chapters)
				? frontmatter.chapters[0]
				: frontmatter.chapters);
			const propertyChapters = Number.isFinite(chaptersValue) && chaptersValue > 0
				? Math.floor(chaptersValue)
				: 0;
			const chapters = items.length > 0 ? items.length : propertyChapters;
			if (chapters < 1) {
				new Notice('Add numbered checkboxes under "## Chapters" or set the chapters property to track this book.');
				return;
			}

			const title = frontmatterText(frontmatter.title) || file.basename;
			const cover = frontmatterText(frontmatter.cover);
			const initialProgress = items.length > 0
				? readInitialProgress(items, frontmatter.progress)
				: Math.max(0, Math.min(chapters, Math.round(Number(frontmatter.progress) || 0)));
			new GameProgressModal(
				this.app,
				title,
				cover,
				items,
				initialProgress,
				async (progress) => {
					if (items.length > 0) {
						const latestContent = await this.app.vault.read(file);
						const latestItems = parseChecklist(latestContent);
						if (latestItems.length !== items.length) {
							throw new Error('The chapter checklist changed while the progress window was open. Reopen it and try again.');
						}
						const updatedContent = updateChecklist(latestContent, progress);
						if (updatedContent !== latestContent) await this.app.vault.modify(file, updatedContent);
					}
					await this.app.fileManager.processFrontMatter(file, (properties) => {
						properties.chapters = chapters;
						properties.progress = progress;
						if (progress >= chapters) {
							applyCompletionMetadata(properties, todayDate());
						}
					});
					new Notice(`Reading progress saved: ${progress}/${chapters} chapters`);
				},
				chapters,
				true
			).open();
		} catch (error) {
			console.error(error);
			new Notice(`Could not open book progress: ${error instanceof Error ? error.message : error}`);
		}
	}

	async openAnimeWithEpisodeUpdate(file) {
		const plugin = this;
		const originalOpen = Modal.prototype.open;
		const originalSyncEpisodes = this.syncEpisodes;
		let progressModal;
		let updateButton;

		Modal.prototype.open = function (...args) {
			const result = originalOpen.apply(this, args);
			if (
				this.contentEl?.hasClass('watch-progress-modal') &&
				this.contentEl.querySelector('.wpm-total-display')
			) {
				progressModal = this;
				if (typeof this.save === 'function') {
					const originalSave = this.save;
					this.save = async function (...saveArgs) {
						await originalSave.apply(this, saveArgs);
						if (this.episodeTotal > 0 && this.progress >= this.episodeTotal) {
							try {
								await plugin.app.fileManager.processFrontMatter(this.file, (properties) => {
									applyCompletionMetadata(properties, todayDate());
								});
							} catch (error) {
								console.error(error);
								new Notice(`Could not update completion status: ${error instanceof Error ? error.message : error}`);
							}
						}
					};
				}
				const tools = this.contentEl.createDiv({ cls: 'wpm-modal-tools' });
				this.contentEl.insertBefore(tools, this.contentEl.firstChild);
				updateButton = tools.createEl('button', {
					cls: 'wpm-refresh-button mod-quiet',
					attr: { 'aria-label': 'Update episodes', title: 'Update episodes' },
				});
				setIcon(updateButton, 'refresh-cw');
				updateButton.disabled = true;
				updateButton.addEventListener('click', async () => {
					updateButton.disabled = true;
					updateButton.title = 'Updating episodes...';
					updateButton.addClass('is-loading');
					try {
						await plugin.syncEpisodes(file);
						progressModal.refreshEpisodeTotal();
						await progressModal.loadEpisodeTitles();
					} catch (error) {
						console.error(error);
						new Notice(`Episode sync failed: ${error instanceof Error ? error.message : String(error)}`);
					} finally {
						updateButton.disabled = false;
						updateButton.title = 'Update episodes';
						updateButton.removeClass('is-loading');
					}
				});
			}
			return result;
		};

		this.syncEpisodes = async () => {};
		let syncPromise;
		try {
			syncPromise = super.syncAndOpen(file);
		} finally {
			Modal.prototype.open = originalOpen;
		}

		try {
			await syncPromise;
		} finally {
			this.syncEpisodes = originalSyncEpisodes;
			if (updateButton) updateButton.disabled = false;
		}
	}
};
