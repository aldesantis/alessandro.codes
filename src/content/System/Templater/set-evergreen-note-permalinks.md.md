<%*
const dv = app.plugins.plugins["dataview"].api;
const notes = dv.pages('"Evergreen notes" OR "Essays" OR "Maps of content" OR "Literature notes" OR "Recipes"');
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
		
		if (file.path.startsWith('Literature notes/')) {
			permalink = `l/${transformedComponents.join('/')}`;
		} else if (file.path.startsWith('Evergreen notes/')) {
			permalink = `n/${transformedComponents.join('/')}`;
		} else if (file.path.startsWith('Essays/')) {
			permalink = `e/${transformedComponents.join('/')}`;
		} else if (file.path.startsWith('Maps of content/')) {
			permalink = `m/${transformedComponents.join('/')}`;
		} else if (file.path.startsWith('Recipes/')) {
			permalink = `r/${transformedComponents.join('/')}`;
		} else {
			permalink = `v/${transformedComponents.join('/')}`;
		}
		
		// console.log(permalink);
		frontmatter['permalink'] = permalink;
	});
});
%>