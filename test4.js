// モジュールの読み込み
const fs = require("fs");
const util = require("util");
const aribts = require("aribts");

// ストリームの作成
const readable = fs.createReadStream(process.argv[2]);
const tsStream = new aribts.TsStream();

// ストリームの接続
readable.pipe(tsStream);

// 変数の宣言
let sid;

// イベントリスナの登録
tsStream.on("data", data => {});

tsStream.on("pat", (pid, data) => {
    // 最初のSIDのものを抽出
    let program = data.programs.find(program => program.program_number !== 0);

    // SIDを設定
    sid = program.program_number;
});

tsStream.on("sdt", (pid, data) => {
    // SIDの取得まで待つ
    if (sid === void 0) return;

    // 自ストリームのSDTのみを選択
    if (data.table_id !== 0x42) return;
    
    // PATに存在したサービスを取得
    let service = data.services.find(service => service.service_id === sid);

    // サービスのdescriptorsでサービス記述子のものを抽出
    let serviceDesc = service.descriptors.find(descriptor => descriptor.descriptor_tag === 0x48);

    // デコード
    let serviceNameChar = new aribts.TsChar(serviceDesc.service_name_char).decode();

    // 出力
    console.log(`serviceName: ${serviceNameChar}`);

    // 接続解除
    readable.unpipe(tsStream);
});