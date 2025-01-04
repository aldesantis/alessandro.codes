<%*
const dv = app.plugins.plugins["dataview"].api;
const mocsToGenerate = {
  "mocs/Recently updated": `LIST
	FROM "notes"
	WHERE publish != "false"
	SORT file.mtime desc
	LIMIT 10`,
  "mocs/Most backlinked": `LIST
    FROM "notes"
    WHERE publish != "false"
    SORT length(file.inlinks) DESC
    LIMIT 10`,
  "mocs/Book library": `TABLE WITHOUT ID
	  ("![[" + image_url +"|coverimg|95]]") as Cover, file.link AS Title, author AS Author, dateformat(date(last_highlighted_date, "yyyy-MM-dd HH:mm:ssZZ"), "yyyy-MM-dd") AS "Last highlighted"
	  FROM "readwise/books"
	  SORT last_highlighted_date DESC`
}

for (const filename in mocsToGenerate) {
  const query = mocsToGenerate[filename];
  const tFile = tp.file.find_tfile(filename);
  const queryOutput = await dv.queryMarkdown(query);
  await app.vault.modify(tFile, queryOutput.value);
}
%>