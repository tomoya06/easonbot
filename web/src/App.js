import React, { useState, useEffect } from "react";
import "./styles.css";
import initSqlJs from "sql.js";
import { SQLRepl } from './Debugger';
import { Main } from './Main';

// Required to let webpack 4 know it needs to copy the wasm file to our assets
import sqlWasm from "!!file-loader?name=sql-wasm-[contenthash].wasm!sql.js/dist/sql-wasm.wasm";

/**
 * 存一个能搜关键字的sql
select lyrics.lyric, songs.song_name, albums.album_name from lyrics 
inner join songs on lyrics.song_id = songs.song_id 
inner join albums on albums.album_id = songs.album_id
where lyrics.lyric like '%点解%' group by lyrics.lyric, lyrics.song_id limit 10
 */

export default function App() {
  const [db, setDb] = useState(null);
  const [isDebug, setDebug] = useState(false);
  const [error, setError] = useState(null);

  function switchDebug() {
    setDebug(!isDebug);
  }

  useEffect(async () => {
    // sql.js needs to fetch its wasm file, so we cannot immediately instantiate the database
    // without any configuration, initSqlJs will fetch the wasm files directly from the same path as the js
    // see ../craco.config.js
    try {
      const [db, SQL] = await Promise.all([
        fetch('./database.db').then(res => res.arrayBuffer()),
        initSqlJs({ locateFile: () => sqlWasm }),
      ])
      setDb(new SQL.Database(new Uint8Array(db)));
    } catch (err) {
      setError(err);
    }
  }, []);

  if (error) return <pre>{error.toString()}</pre>;
  if (!db) return <pre>Loading...</pre>;

  return (
    <div className="App">
      {
        isDebug ? <SQLRepl db={db} switchDebug={switchDebug} /> : <Main db={db} switchDebug={switchDebug} />
      }
    </div>
  )
}
