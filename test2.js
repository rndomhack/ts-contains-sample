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
    // 最初のSIDのものを抽出
    let program = data.programs.find(program => program.program_number !== 0);

    // 出力
    console.log(`SID: ${program.program_number}`); 

    // 接続解除
    readable.unpipe(tsStream);
});