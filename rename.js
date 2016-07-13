// モジュールの読み込み
const fs = require("fs");
const util = require("util");
const path = require("path");
const aribts = require("aribts");

// ストリームの作成
const readable = fs.createReadStream(process.argv[2]);
const tsStream = new aribts.TsStream({
    skipSize: 100000
});

// ストリームの接続
readable.pipe(tsStream);

// 変数の宣言
let sid, serviceName, startTime, duration, eventName, text;

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

    // 変数の設定
    startTime = _startTime;
    duration = _duration;
    eventName = _eventName;
    text = _text;

    // 接続解除
    readable.unpipe(tsStream);

    // 終了
    tsStream.end();
});

tsStream.on("end", () => {
    // リネーム元パス
    let src = process.argv[2];

    // リネーム元パスの解析
    let input = path.parse(src);

    // 新たなファイル名の作成
    let filename = `[${startTime.getFullYear()}年${startTime.getMonth() + 1}月${startTime.getDate()}日] ${eventName} (${serviceName}, ${duration[0]}時間${duration[1]}分)`;

    // リネーム先パス
    let dest = path.join(input.dir, escape(`${filename}${input.ext}`));

    // リネーム
    fs.renameSync(src, dest);
});

function escape(str) {
    return str.replace(/([\/\\\?\*:\|"<>])/g, str2 => {
        return str2.replace(/[\!-\~]/g, function(s) {
            return String.fromCharCode(s.charCodeAt(0) + 0xFEE0);
        }).split(" ").join("\u3000");
    });
}
