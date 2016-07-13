// モジュールの読み込み
const fs = require("fs");
const util = require("util");
const aribts = require("aribts");

// ストリームの作成
const readable = fs.createReadStream(process.argv[2]);
const tsStream = new aribts.TsStream();

// ストリームの接続
readable.pipe(tsStream);

// イベントリスナの登録
tsStream.on("data", data => {});

tsStream.on("pat", (pid, data) => {
    // 出力
    console.log(util.inspect(data, {depth: null})); 

    // 接続解除
    readable.unpipe(tsStream);
});