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

// --- モーダル関連 (変更なし) ---
// ■ 一括入力モーダルを開く
function openBulkModal() {
    // ★変更: 名前だけを列挙する（学年情報は混ぜない）
    const text = memberList.map(member => member.name).join("\n");
    
    document.getElementById("bulk-textarea").value = text;
    document.getElementById("bulk-modal").setAttribute("open", true);
}
// ■ 一括入力を反映する
function applyBulkInput() {
    const text = document.getElementById("bulk-textarea").value;
    
    // リストをクリア
    memberList = [];

    const lines = text.split("\n");
    
    lines.forEach(line => {
        const name = line.trim();
        if (name === "") return;

        // ★変更: 学年の解析はやめる。名前だけ登録し、学年は "B4" 固定。
        // 区切り文字などを気にする必要なし！
        memberList.push({ name: name, grade: "B4" });
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

// --- 実行関数 ---
// ■ 席決め実行関数
async function executeShuffle() {
    const placeholder = document.getElementById("result-placeholder");
    const resultContent = document.getElementById("result-content");
    const resultList = document.getElementById("result-list");

    // バリデーション
    if (memberList.length === 0) { alert("参加者がいません"); return; }
    if (currentTableConfig.length === 0) { alert("テーブルを追加してください"); return; }

    // 通信中の表示
    resultList.innerHTML = "<p style='text-align:center; padding:20px;'>抽選中...</p>";
    placeholder.style.display = "none";
    resultContent.style.display = "block";

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ members: memberList, table_capacities: currentTableConfig })
        });

        if (!response.ok) throw new Error("サーバーエラー");
        const data = await response.json();

        // --- 結果HTMLの生成 ---
        let html = "";
        
        data.tables.forEach(table => {
            const tableName = String.fromCharCode(65 + (table.table_no - 1)); // A, B, C...
            
            html += `
                <div class="result-card">
                    <div class="result-header">
                        <i>田</i> テーブル ${tableName}
                    </div>
                    <div class="result-members">
                        ${table.members.map((name, i) => `
                            <div class="result-member-row">
                                <span class="result-num">${i + 1}</span>
                                <span>${name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        // あぶれた人
        if (data.waiting_list.length > 0) {
            html += `
                <div class="result-card" style="border-color: var(--del-color);">
                    <div class="result-header" style="background-color: #ffebee; color: var(--del-color);">
                        <i>⚠️</i> あぶれた人 / 待機
                    </div>
                    <div class="result-members">
                        ${data.waiting_list.map((name, i) => `
                            <div class="result-member-row">
                                <span class="result-num" style="background:#ffcdd2; color:#c62828;">${i + 1}</span>
                                <span>${name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        resultList.innerHTML = html;

    } catch (error) {
        console.error(error);
        alert("エラーが発生しました");
        placeholder.style.display = "block";
        resultContent.style.display = "none";
    }
}


// ■ 全リセット関数
function resetAll() {
    if(!confirm("テーブル設定とメンバー入力、すべてリセットしますか？")) return;
    
    // 変数をクリア
    currentTableConfig = [];
    memberList = [];
    
    // 画面を更新
    renderTableList();
    renderMemberList();
    updateStatus();
    
    // 結果エリアを隠して初期画面に戻す
    document.getElementById("result-placeholder").style.display = "block";
    document.getElementById("result-content").style.display = "none";
}