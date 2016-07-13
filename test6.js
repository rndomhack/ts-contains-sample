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
let sid, serviceName;

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
    let _serviceName = new aribts.TsChar(serviceDesc.service_name_char).decode();

    // serviceNameを設定
    serviceName = _serviceName;
});

tsStream.on("eit", (pid, data) => {
    // SIDの取得まで待つ
    if (sid === void 0) return;

    // serviceNameの取得まで待つ
    if (serviceName === void 0) return;

    // 固定受信機向けEITを選択
    if (pid !== 0x12) return;

    // 自ストリームの現在と次の番組を選択
    if (data.table_id !== 0x4E) return;

    // PATに存在したサービスを選択
    if (data.service_id !== sid) return;

    // 現在の番組を選択
    if (data.section_number !== 0) return;

    // 開始する日付と時間両方をデコード
    let _startTime = new aribts.TsDate(data.events[0].start_time).decode();

    // 継続する時間のみをデコード
    let _duration = new aribts.TsDate(data.events[0].duration).decodeTime();

    // イベント[0]のdescriptorsで短形式イベント記述子のものを抽出
    let shortEventDesc = data.events[0].descriptors.find(descriptor => descriptor.descriptor_tag === 0x4D);

    // イベント名のデコード
    let _eventName = new aribts.TsChar(shortEventDesc.event_name_char).decode();

    // 説明のデコード
    let _text = new aribts.TsChar(shortEventDesc.text_char).decode();

    // 出力
    console.log(`startTime: ${_startTime}`);
    console.log(`duration : ${_duration.join(":")}`);
    console.log(`eventName: ${_eventName}`);
    console.log(`text     : ${_text}`);

    // 接続解除
    readable.unpipe(tsStream);
});