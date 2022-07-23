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
  const copyText = `${lyric} ——《${song_name}》, ${year}`;
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
    <div
      className="lyricRow"
      onClick={() => doCopy(item)}>
      <strong className="lyric">{lyric}</strong>
      <div className="comment">《{song_name}》, {year}</div>
    </div>
  );
}

const dotlessTitle = '陈奕迅曾经唱过'
const defaultTitle = `${dotlessTitle}...`;

/**
 * Main App
 * @param {{db: import("sql.js").Database, switchDebug: () => void}} props
 */
export function Main({ db, switchDebug }) {
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [keyword, setKeyword] = useState('');

  const [phDots, setDots] = useState(2);

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

  const inputStatus = useMemo(() => {
    if (!keyword) {
      return 0;
    }
    if (results.length > 0) {
      return 1;
    }
    return -1;
  }, [keyword, results]);

  const title = useMemo(() => {
    switch (inputStatus) {
      case 0: return '';
      case 1: return `陈奕迅曾经唱过 ${results.length} 句「${keyword}」`;
      case -1: return `陈奕迅从来没唱过${keyword}...`;
    }
  }, [inputStatus, keyword, results]);

  const placeholder = useMemo(() => {
    return `${dotlessTitle}${'.'.repeat(phDots + 1)}`;
  }, [phDots]);

  const imgSrc = useMemo(() => {
    switch (inputStatus) {
      case 0: return './img/waiting.jpg';
      case 1: return `./img/cool.jpg`;
      case -1: return `./img/nonono.jpg`;
    }
  }, [inputStatus]);

  useEffect(() => {
    document.title = title || defaultTitle;
  }, [title]);

  useEffect(() => {
    const intv = setTimeout(() => {
      setDots((phDots + 1) % 3);
    }, 1000);

    return () => {
      clearTimeout(intv);
    }
  }, [phDots]);

  return (
    <>
      <article className={"inputContainer " + (inputStatus === 1 ? 'topContainer' : '')}>
        <img src={imgSrc} className="easonAvatar"></img>
        <input
          placeholder={placeholder}
          onChange={e => exec(e.target.value)}
          onKeyUp={e => {
            if (e.key === 'Enter') {
              e.target.blur();
            }
          }}
        ></input>
      </article>
      <header>
        {title}
      </header>
      <article>
        {results.map(item => (
          <Row key={JSON.stringify(item)} item={item} />
        ))}
      </article>
      <footer>
        歌词数据来源 <a href="https://mojim.com/" target="_blank">mojim.com</a> | 结果之准确性不归本站管
        <br /><a href="https://github.com/tomoya06">github@tomoya06</a> © 2022
      </footer>
    </>
  )
}