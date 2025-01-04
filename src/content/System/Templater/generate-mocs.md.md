<%*
const dv = app.plugins.plugins["dataview"].api;
const mocsToGenerate = {
  "Maps of content/Recently updated": `LIST
	FROM "Evergreen notes"
	WHERE publish != "false"
	SORT file.mtime desc
	LIMIT 10`,
  "Maps of content/Most backlinked": `LIST
    FROM "Evergreen notes"
    WHERE publish != "false"
    SORT length(file.inlinks) DESC
    LIMIT 10`,
  "Maps of content/Book library": `TABLE WITHOUT ID
	  ("![[" + image_url +"|coverimg|95]]") as Cover, file.link AS Title, author AS Author, dateformat(date(last_highlighted_date, "yyyy-MM-dd HH:mm:ssZZ"), "yyyy-MM-dd") AS "Last highlighted"
	  FROM "Literature notes/Books"
	  SORT last_highlighted_date DESC`
}

for (const filename in mocsToGenerate) {
  const query = mocsToGenerate[filename];
  const tFile = tp.file.find_tfile(filename);
  const queryOutput = await dv.queryMarkdown(query);
  await app.vault.modify(tFile, queryOutput.value);
}
%>