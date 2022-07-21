export function genSearchSql(keyword) {
  return `
  select lyrics.lyric, songs.song_name, albums.album_name, albums.year from lyrics 
  inner join songs on lyrics.song_id = songs.song_id 
  inner join albums on albums.album_id = songs.album_id
  where lyrics.lyric like '%${keyword}%' group by lyrics.lyric, lyrics.song_id`;
};

export function parseResults(result) {
  try {
    const { columns, values } = result[0];
    return values.map(row => {
      const item = {};
      columns.forEach((col, idx) => {
        item[col] = row[idx];
      });

      return item;
    });
  } catch (error) {
    return [];
  }
}
