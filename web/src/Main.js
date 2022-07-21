import React, { useState, useMemo, useEffect } from "react";
import { genSearchSql, parseResults } from "./utils";
import './Main.css';

function toast(msg) {
  const container = document.createElement('div');
  container.className = 'toast';
  const content = document.createTextNode(msg);
  container.appendChild(content);
  document.body.appendChild(container);

  setTimeout(() => {
    container.parentElement.removeChild(container);
  }, 2000);
}

function doCopy(item) {
  const { lyric, song_name, album_name, year } = item;
  const copyText = `${lyric} ——《${album_name}》${song_name}, ${year}`;
  navigator.clipboard.writeText(copyText);

  toast(`歌词已复制：${copyText}`);
}

/**
 * 渲染单个组件
 * @param {{ item: { lyric: string, song_name: string, album_name: string, year: string } }} param0 
 */
function Row({ item }) {
  const { lyric, song_name, album_name, year } = item;

  return (
    <section className="lyricRow" onClick={() => doCopy(item)}>
      <div>{lyric}</div>
      <div>《{album_name}》 <span>{song_name}</span>, {year}</div>
    </section>
  );
}

/**
 * Main App
 * @param {{db: import("sql.js").Database, switchDebug: () => void}} props
 */
export function Main({ db, switchDebug }) {
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [keyword, setKeyword] = useState('');

  /**
   * 搜索歌词
   * @param {string} word
   */
  function exec(word) {
    setKeyword(word);
    if (!word) {
      setResults([]);
      return;
    }

    if (word === 'debugdebug') {
      switchDebug();
      return;
    }

    const sql = genSearchSql(word);

    try {
      const searchResult = db.exec(sql);
      const parsedResult = parseResults(searchResult);
      setResults(parsedResult);

      // console.log(parsedResult);
      setError(null);
    } catch (error) {
      setError(error);
      setResults([]);
    }
  }

  const title = useMemo(() => {
    if (!keyword) {
      return '陈奕迅曾经唱过...';
    }

    if (results.length > 0) {
      return `陈奕迅曾经唱过 ${results.length} 句「${keyword}」`;
    }

    return `陈奕迅从来没唱过${keyword}`;
  }, [keyword, results]);

  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <>
      <header>
        <h1>{title}</h1>
      </header>
      <article>
        <input placeholder="啊，你也忘词了吗..." onChange={e => exec(e.target.value)}></input>
      </article>
      <article>
        {results.map(item => (
          <Row key={JSON.stringify(item)} item={item} />
        ))}
      </article>
      <footer>
        <h6>数据来源 <a href="https://mojim.com/" target="_blank">https://mojim.com/</a></h6>
      </footer>
    </>
  )
}