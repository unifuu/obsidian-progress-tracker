function isGameNote(frontmatter) {
	const rawTypes = frontmatter && frontmatter.type;
	const types = Array.isArray(rawTypes) ? rawTypes : [rawTypes];
	return types.some((rawType) => {
		if (rawType == null) return false;
		const type = String(rawType)
			.replace(/^\[\[/, '')
			.replace(/\]\]$/, '')
			.split('|', 1)[0]
			.trim();
		return type === '\u{1F3AE}' || /^game$/i.test(type);
	});
}

function parseChecklist(content) {
	const lines = content.split(/\r?\n/);
	const headingIndex = lines.findIndex((line) => /^##\s+Chapters\s*$/i.test(line));
	if (headingIndex < 0) return [];

	let endIndex = lines.length;
	for (let index = headingIndex + 1; index < lines.length; index++) {
		if (/^#{1,2}\s/.test(lines[index])) {
			endIndex = index;
			break;
		}
	}

	const items = [];
	for (let index = headingIndex + 1; index < endIndex; index++) {
		const match = lines[index].match(/^\s*[-*]\s+\[([ xX])\]\s+\d+[.)]\s*(.*?)\s*$/);
		if (match && match[2]) {
			items.push({ done: match[1].toLowerCase() === 'x', title: match[2], lineIndex: index });
		}
	}
	return items;
}

function readInitialProgress(items, rawProgress) {
	const checkedCount = items.filter((item) => item.done).length;
	const progress = Number(rawProgress);
	const fromFrontmatter = Number.isFinite(progress) && progress >= 0
		? Math.round(progress)
		: 0;
	const initial = checkedCount > 0 ? checkedCount : fromFrontmatter;
	return Math.max(0, Math.min(items.length, initial));
}

function updateChecklist(content, progress) {
	const items = parseChecklist(content);
	if (!items.length) return content;

	const lineEnding = content.includes('\r\n') ? '\r\n' : '\n';
	const lines = content.split(/\r?\n/);
	const completed = Math.max(0, Math.min(items.length, Math.round(Number(progress) || 0)));
	items.forEach((item, index) => {
		lines[item.lineIndex] = lines[item.lineIndex].replace(/\[([ xX])\]/, index < completed ? '[x]' : '[ ]');
	});
	return lines.join(lineEnding);
}

function applyCompletionMetadata(properties, date) {
	properties.status = '[[🟣 Fin]]';
	properties.finished = date;
}

module.exports = {
	isGameNote,
	parseChecklist,
	readInitialProgress,
	updateChecklist,
	applyCompletionMetadata,
};
