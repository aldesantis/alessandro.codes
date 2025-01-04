<%*
const dv = app.plugins.plugins["dataview"].api;
const notes = dv.pages('"notes" OR "essays" OR "mocs" OR "readwise" OR "recipes"');

const paths = notes
	.values
	.map((note) => note.file.path);
	
const files = paths.map((path) => app.vault.getAbstractFileByPath(path));

await files.forEach(async (file) => {
	const components = file.path.replace('.md', '').split('/').slice(1);
	let transformedComponents;

	try {
		transformedComponents = components.map((component) => {
			return component
				.replace('.md', '')
				.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
				.join('-')
				.toLowerCase();
		});
	} catch (e) {
		console.log(`Error while generating permalink for ${file.path}`);
		return;
	}

	await app.fileManager.processFrontMatter(file, (frontmatter) => { 
		let permalink;
		
		if (file.path.startsWith('readwise/')) {
			permalink = `l/${transformedComponents.join('/')}`;
		} else if (file.path.startsWith('notes/')) {
			permalink = `n/${transformedComponents.join('/')}`;
		} else if (file.path.startsWith('essays/')) {
			permalink = `e/${transformedComponents.join('/')}`;
		} else if (file.path.startsWith('mocs/')) {
			permalink = `m/${transformedComponents.join('/')}`;
		} else if (file.path.startsWith('recipes/')) {
			permalink = `r/${transformedComponents.join('/')}`;
		} else {
			permalink = `v/${transformedComponents.join('/')}`;
		}
		
		frontmatter['permalink'] = permalink;
		frontmatter['slug'] = transformedComponents.at(-1);
	});
});
%>