// static/script.js

const API_URL = "/shuffle";
let currentTableConfig = [];
// ★追加: 現在選択されている人数を保持する変数 (初期値4)
let selectedCapacity = 4;
let memberList = [];

window.onload = function() {
    // 初期化処理
    updateStatus();
    renderTableList();
    renderMemberList(); // ★追加
}

function toggleSegment(btn, groupName) {
    // 1. そのグループのボタンを全部探す
    // (親要素 .segmented-control の中にあるボタンを探す)
    const parent = btn.parentElement;
    const buttons = parent.querySelectorAll('.segment-btn');

    // 2. 全部「非アクティブ」にする
    buttons.forEach(b => b.classList.remove('active'));

    // 3. 押されたボタンだけ「アクティブ」にする
    btn.classList.add('active');
}

// --- モーダル関連 ---
const VALID_GRADES = ["D3", "D2", "D1", "M2", "M1", "B4", "B3", "他"];
// ■ 一括入力モーダルを開く
function openBulkModal() {
    // ★変更: 名前だけを列挙する（学年情報は混ぜない）
    const text = memberList.map(member => member.name).join("\n");
    
    document.getElementById("bulk-textarea").value = text;
    document.getElementById("bulk-modal").setAttribute("open", true);
}
// ■ 一括入力を反映する関数 (改良版)
function applyBulkInput() {
    const text = document.getElementById("bulk-textarea").value;
    
    // リストをクリア
    memberList = [];

    const lines = text.split("\n");
    
    lines.forEach(line => {
        line = line.trim();
        if (line === "") return;

        // 1. 区切り文字（カンマ、読点、スペース、タブ）で分割
        // 例: "田中, M1" -> ["田中", "M1"]
        // 例: "佐藤"     -> ["佐藤"]
        const parts = line.split(/[\s,、\t]+/);
        
        const name = parts[0];
        let grade = "B4"; // デフォルト値

        // 2. 学年っぽいものが入力されていた場合
        if (parts.length > 1) {
            // 入力を大文字に変換してチェック (例: "m1" -> "M1")
            const inputGrade = parts[1].toUpperCase();
            
            // 有効な学年リストに含まれているか？
            if (VALID_GRADES.includes(inputGrade)) {
                grade = inputGrade;
            }
            // 含まれていなければデフォルト(B4)のまま
        }

        memberList.push({ name: name, grade: grade });
    });
    
    closeBulkModal();
    renderMemberList();
    updateStatus();
}

function closeBulkModal() {
    document.getElementById("bulk-modal").removeAttribute("open");
}


// --- ★追加: 人数選択ボタンの処理 ---
function selectCapacity(capacity) {
    selectedCapacity = capacity;
    
    // 1. ボタンの見た目を更新（全部グレーにしてから、選んだやつだけ紫にする）
    const buttons = document.querySelectorAll('#capacity-buttons .capacity-btn');
    buttons.forEach(btn => {
        // ボタンの文字（"2人"など）から数字だけ取り出して比較
        const btnCap = parseInt(btn.innerText); 
        if (btnCap === capacity) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });

    // 2. 追加ボタンの文字を更新（「＋ 〇人席を追加」）
    document.getElementById('selected-capacity-display').innerText = capacity;
}


// --- テーブル追加・削除関連 ---

function addTable() {
    // ★変更: プルダウンではなく、変数から値を使う
    currentTableConfig.push(selectedCapacity);
    renderTableList();
}

// ■ 個別にテーブルを削除する関数
function removeTable(index) {
    // 配列操作: index番目の要素を 1つだけ 削除する (splice)
    currentTableConfig.splice(index, 1);
    
    // 削除した状態で画面を書き直す
    // (自動的に A, B, C... の番号も詰められます)
    renderTableList();
}

function resetTables() {
    currentTableConfig = [];
    renderTableList();
}
// ★大幅変更: テーブルリストの描画
function renderTableList() {
    const displayArea = document.getElementById("table-list-display");
    const totalTablesSpan = document.getElementById("total-tables");
    const totalSeatsSpan = document.getElementById("total-seats");

    // 合計計算
    const totalSeats = currentTableConfig.reduce((a, b) => a + b, 0);
    totalTablesSpan.innerText = currentTableConfig.length;
    totalSeatsSpan.innerText = totalSeats;

    if (currentTableConfig.length === 0) {
        // 空っぽの時の表示も、Readyっぽく薄い紫の箱にする
        displayArea.innerHTML = `
            <div class="bg-purple-light" style="text-align: center; color: var(--muted-color);">
                まだテーブルがありません
            </div>`;
        return;
    }

    let html = "";
    currentTableConfig.forEach((cap, index) => {
        const tableName = String.fromCharCode(65 + index); // A, B, C...
        
        html += `
            <div class="list-item">
                <div class="list-item-left">
                    <span class="icon-badge">田</span>
                    <div>
                        <div style="font-weight: bold;">テーブル ${tableName}</div>
                        <div class="list-item-sub">${cap}人席</div>
                    </div>
                </div>
                
                <button type="button" class="delete-icon-btn" onclick="removeTable(${index})" aria-label="削除">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            </div>
        `;
    });
    
    displayArea.innerHTML = html;
    updateStatus();
}
function addMemberRow(initialValue = "", initialGrade = "B4") { // 学年の初期値も引数に
    const container = document.getElementById("members-list-container");
    const row = document.createElement("div");
    row.className = "member-row"; 

    // ★修正: 学年選択プルダウンを追加
    row.innerHTML = `
        <input type="text" name="member-name" value="${initialValue}" placeholder="名前" oninput="updateMemberCount()" style="flex: 2;">
        
        <select name="member-grade" style="flex: 1; height: 50px; margin-bottom: 0;">
            <option value="D3">D3</option>
            <option value="D2">D2</option>
            <option value="D1">D1</option>
            <option value="M2">M2</option>
            <option value="M1">M1</option>
            <option value="B4" ${initialGrade === 'B4' ? 'selected' : ''}>B4</option>
            <option value="B3">B3</option>
            <option value="他">他</option>
        </select>

        <button type="button" class="contrast outline remove-btn" onclick="removeMemberRow(this)" aria-label="削除">×</button>
    `;
    container.appendChild(row);
}


// 真ん中のカードの入力欄HTML修正 (quick.html側) は後でやりますが、
function addMemberSingle() {
    const inputName = document.getElementById("new-member-name");
    
    // ★ここがエラーの原因でした（HTMLに追加したので直るはずです）
    const inputGrade = document.getElementById("new-member-grade"); 
    
    const name = inputName.value.trim();
    const grade = inputGrade.value;

    if (name === "") return;

    // ★修正: 名前と学年をセットで保存
    memberList.push({ name: name, grade: grade });
    
    inputName.value = ""; 
    // 学年は B4 に戻してもいいし、そのままでもOK
    
    renderMemberList();
    updateStatus();
}

// 2. メンバーを削除する関数
function removeMember(index) {
    memberList.splice(index, 1);
    renderMemberList();
    updateStatus();
}

// 3. メンバーリストを描画する関数 (Ready風デザイン)
function renderMemberList() {
    const display = document.getElementById("members-list-display");
    
    if (memberList.length === 0) {
        display.innerHTML = '<p style="color: #ccc; text-align: center; padding: 20px;">まだメンバーがいません</p>';
        return;
    }

    let html = "";
    const gradeOptions = ["D3", "D2", "D1", "M2", "M1", "B4", "B3", "他"];

    memberList.forEach((member, index) => {
        let optionsHtml = "";
        gradeOptions.forEach(g => {
            const isSelected = (g === member.grade) ? "selected" : "";
            optionsHtml += `<option value="${g}" ${isSelected}>${g}</option>`;
        });

        html += `
            <div class="member-card">
                <div style="display: flex; align-items: center; gap: 10px; flex: 1; overflow: hidden;">
                    <span class="num-badge" style="flex-shrink: 0;">${index + 1}</span>
                    
                    <span style="font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: 5px;">
                        ${member.name}
                    </span>

                    <select 
                        style="
                            margin-bottom: 0; 
                            height: 36px; 
                            padding: 0 35px 0 15px; 
                            font-size: 0.85rem; 
                            width: auto; 
                            background-color: #f2f2fd; 
                            border: 1px solid #dce0ff; 
                            color: #5e5ce6; 
                            font-weight: bold;
                            border-radius: 6px;
                            cursor: pointer;
                            flex-shrink: 0;
                        "
                        onchange="updateMemberGrade(${index}, this.value)"
                    >
                        ${optionsHtml}
                    </select>
                </div>
                
                <button class="delete-icon-btn" onclick="removeMember(${index})" style="flex-shrink: 0; margin-left: 10px;">×</button>
            </div>
        `;
    });
    display.innerHTML = html;
}

// ★追加: プルダウン操作時にデータを更新する関数
function updateMemberGrade(index, newGrade) {
    memberList[index].grade = newGrade;
    // console.log(`index ${index} の学年を ${newGrade} に変更しました`);
}

// 4. ステータスバー（席数と人数）を更新する関数
function updateStatus() {
    // 席数合計
    const totalSeats = currentTableConfig.reduce((a, b) => a + b, 0);
    // 人数合計
    const totalMembers = memberList.length;

    // 左カラムの表示更新
    document.getElementById("total-seats").innerText = totalSeats;
    
    // 中央カラムのステータスバー更新
    document.getElementById("status-total-seats").innerText = totalSeats;
    document.getElementById("status-member-count").innerText = totalMembers;
    
    // 右カラムのメッセージも変えちゃいましょうか？（後で）
}

// ★追加: 直前の結果データを保存しておく変数
let lastResultData = null;

// ■ 1. メインボタンが押された時の判断役
function handleMainAction() {
    // すでに結果があるなら、APIを叩かずにオーバーレイを開くだけ
    if (lastResultData !== null) {
        showResultOverlay();
        return;
    }
    
    // 結果がないなら、計算を実行する
    executeShuffle();
}

// ■ 2. 強制的に再抽選する（再抽選ボタン用）
function forceReshuffle() {
    if(!confirm("現在の結果を破棄して、作り直しますか？")) return;
    executeShuffle();
}
// --- 実行関数 ---
// ■ 席決め実行関数
// --- 実行関数 ---
// ■ 3. 実際にAPIを叩く関数 (旧 shuffleSeats)
async function executeShuffle() {
    // 設定値の取得
    const algoBtn = document.querySelector('button[onclick*="algo"].active');
    const apiMode = algoBtn ? algoBtn.getAttribute('data-value') : "balanced";

    // バリデーション
    if (memberList.length === 0) { alert("参加者がいません"); return; }
    if (currentTableConfig.length === 0) { alert("テーブルを追加してください"); return; }

    const totalSeats = currentTableConfig.reduce((a, b) => a + b, 0);
    if (memberList.length > totalSeats) {
        if (!confirm(`席数が足りませんが実行しますか？`)) return;
    }

    // オーバーレイを開いて「抽選中」表示
    document.getElementById("result-overlay").style.display = "block";
    document.body.style.overflow = "hidden"; // 裏スクロール禁止
    const resultArea = document.getElementById("result-area");
    resultArea.innerHTML = "<p style='text-align:center; margin-top:50px; font-size:1.5rem;'>🎲 抽選中...</p>";

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                members: memberList, 
                table_capacities: currentTableConfig,
                mode: apiMode 
            })
        });

        if (!response.ok) throw new Error("サーバーエラー");
        
        // ★重要: 結果を変数に保存！
        lastResultData = await response.json();

        // 画面を描画
        renderResultContent();
        
        // ★重要: ボタンの状態を更新（「席を決める」→「結果を見る」へ）
        updateButtonState();

    } catch (error) {
        console.error(error);
        alert("エラーが発生しました");
        closeResult();
    }
}

// ■ 保存されたデータを使って描画する関数
function renderResultContent() {
    if (!lastResultData) return;

    const resultArea = document.getElementById("result-area");
    const viewBtn = document.querySelector('button[onclick*="view"].active');
    const viewMode = viewBtn ? viewBtn.getAttribute('data-value') : "visual";

    if (viewMode === "visual") {
        renderVisualResult(lastResultData, resultArea);
    } else {
        renderListResult(lastResultData, resultArea);
    }
}
// ■ オーバーレイを開くだけの関数
function showResultOverlay() {
    document.getElementById("result-overlay").style.display = "block";
    document.body.style.overflow = "hidden";
    
    // 表示モード（座席表/リスト）が変わっているかもしれないので再描画
    renderResultContent();
}

// ■ オーバーレイを閉じる
function closeResult() {
    document.getElementById("result-overlay").style.display = "none";
    document.body.style.overflow = "";
}


// ---------------------------------------------------------
// 🎨 モードA: 座席表ビュー (机と椅子の図)
// ---------------------------------------------------------
function renderVisualResult(data, targetElement) {
    let html = "<div class='visual-table-container'>";
    
    data.tables.forEach(table => {
        const tableName = String.fromCharCode(65 + (table.table_no - 1)); // A, B, C...
        const members = table.members; // [{name: "A", grade: "M1"}, ...]
        
        // 机の幅計算 (基本170px + 追加分)
        const halfCount = Math.ceil(members.length / 2);
        const deskWidth = 170 + (Math.max(0, halfCount - 1) * 130);

        // 上半分の席
        const topMembers = members.slice(0, halfCount);
        let topHtml = `<div style="display:flex; gap:20px; margin-bottom:-25px; z-index:2; justify-content: center; width: 100%;">`;
        topMembers.forEach((m, i) => {
            topHtml += `
                <div class="visual-seat">
                    <span class="seat-number" style="top:5px; left:5px;">${i + 1}</span>
                    <div class="seat-name">${m.name}</div>
                    <div class="seat-grade">${m.grade}</div>
                </div>`;
        });
        topHtml += `</div>`;

        // 下半分の席
        const bottomMembers = members.slice(halfCount);
        let bottomHtml = `<div style="display:flex; gap:20px; margin-top:-25px; z-index:2; justify-content: center; width: 100%;">`;
        bottomMembers.forEach((m, i) => {
            bottomHtml += `
                <div class="visual-seat">
                    <span class="seat-number" style="top:5px; left:5px;">${halfCount + i + 1}</span>
                    <div class="seat-name">${m.name}</div>
                    <div class="seat-grade">${m.grade}</div>
                </div>`;
        });
        bottomHtml += `</div>`;

        // 合体
        html += `
            <div class="visual-table-wrapper">
                ${topHtml}
                <div class="visual-desk" style="width: ${deskWidth}px;">Table ${tableName}</div>
                ${bottomHtml}
            </div>
        `;
    });
    html += "</div>"; // container close

    // あぶれた人の表示
    if (data.waiting_list.length > 0) {
        html += renderWaitingList(data.waiting_list);
    }

    targetElement.innerHTML = html;
}


// ---------------------------------------------------------
// 📋 モードB: リストビュー (文字だけのシンプルな表)
// ---------------------------------------------------------
function renderListResult(data, targetElement) {
    // Pico.cssのグリッドでカードを並べる
    let html = "<div class='grid'>"; 
    
    data.tables.forEach(table => {
        const tableName = String.fromCharCode(65 + (table.table_no - 1));
        
        // デザイン済みの .result-card を再利用してリストを作る
        html += `
            <div class="result-card">
                <div class="result-header">
                    <i>田</i> テーブル ${tableName} (${table.members.length}人)
                </div>
                
                <div class="result-members">
                    ${table.members.map((m, i) => `
                        <div class="result-member-row">
                            <span class="result-num">${i + 1}</span>
                            
                            <span style="background:#eee; padding:2px 8px; border-radius:4px; font-size:0.8rem; color:#555; margin-right:8px; font-weight:bold;">
                                ${m.grade}
                            </span>
                            
                            <span style="font-weight:bold;">${m.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    html += "</div>"; // grid close

    // あぶれた人の表示
    if (data.waiting_list.length > 0) {
        html += renderWaitingList(data.waiting_list);
    }

    targetElement.innerHTML = html;
}


// ■ 共通部品: あぶれた人リストの生成
function renderWaitingList(waitingList) {
    // waitingList は ["名前", "名前"] という文字列リストの想定
    // (main.pyの実装によっては辞書かもしれないので注意。今回は文字列リストとして処理)
    return `
        <hr>
        <div class="result-card" style="border-color: var(--del-color); margin-top: 30px;">
            <div class="result-header" style="background-color: #ffebee; color: var(--del-color);">
                <i>⚠️</i> あぶれた人 / 待機 (${waitingList.length}人)
            </div>
            <div class="result-members" style="display: flex; gap: 10px; flex-wrap: wrap; padding: 15px;">
                ${waitingList.map(name => `
                    <span style="background:white; padding:8px 12px; border:1px solid #ffcdd2; border-radius:6px; font-weight:bold; color:#c62828;">
                        ${name}
                    </span>
                `).join('')}
            </div>
        </div>
    `;
}


// ■ 全リセット関数
// ■ 全リセット関数 (修正)
function resetAll() {
    if(!confirm("すべてリセットしますか？")) return;
    
    // データクリア
    currentTableConfig = [];
    memberList = [];
    lastResultData = null; // ★結果も消す
    
    // 画面更新
    renderTableList();
    renderMemberList();
    updateStatus();
    updateButtonState(); // ★ボタンも元に戻す
    
    closeResult();
}

function updateButtonState() {
    const mainBtn = document.getElementById("main-action-btn");
    const subBtn = document.getElementById("reshuffle-btn");
    const msg = document.getElementById("action-message"); // メッセージも取得

    if (lastResultData !== null) {
        // --- 結果がある時 ---
        
        // メインボタン: 「結果を見る」に変身
        mainBtn.innerHTML = "📂 結果を見る";
        mainBtn.classList.remove("primary-btn");
        mainBtn.style.backgroundColor = "#2ecc71"; // 緑色
        mainBtn.style.border = "none";
        mainBtn.style.color = "white";
        
        // サブボタン: 表示する
        subBtn.style.display = "block";
        
        // メッセージ更新
        if(msg) msg.innerHTML = "席が決まりました！<br>結果を確認できます";

    } else {
        // --- 結果がない時（リセット後など） ---
        
        // メインボタン: 「席を決定する」に戻す
        mainBtn.innerHTML = "席を決定する";
        mainBtn.style.backgroundColor = ""; 
        mainBtn.classList.add("primary-btn");
        
        // サブボタン: 隠す
        subBtn.style.display = "none";
        
        // メッセージ戻す
        if(msg) msg.innerHTML = "準備ができたら<br>ボタンを押してください";
    }
}