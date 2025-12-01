// ==========================================
// static/script.js (完全版)
// ==========================================

const API_URL = "/shuffle";

// データ保持用変数
let currentTableConfig = [];
let memberList = [];
let lastResultData = null;

// 学年の定義
const GRADE_OPTIONS = ["D3", "D2", "D1", "M2", "M1", "B4", "B3", "他"];

// ■ ページ読み込み時の処理
window.onload = function() {
    // 1. 保存データを読み込む
    loadFromStorage();
    
    // 3. 画面を更新してデータを反映
    renderTableList();
    renderMemberList();
    updateStatus();
    updateButtonState();
};

// ---------------------------------------------------------
// 💾 データ保存・読み込み (LocalStorage)
// ---------------------------------------------------------
function saveToStorage() {
    localStorage.setItem('sekigime_members', JSON.stringify(memberList));
    localStorage.setItem('sekigime_tables', JSON.stringify(currentTableConfig));
    // ※結果データ(lastResultData)は保存しなくてOK（リロードしたら消えてもいい）
}

function loadFromStorage() {
    const savedMembers = localStorage.getItem('sekigime_members');
    const savedTables = localStorage.getItem('sekigime_tables');

    if (savedMembers) memberList = JSON.parse(savedMembers);
    if (savedTables) currentTableConfig = JSON.parse(savedTables);
}


// ---------------------------------------------------------
// 🪑 テーブル設定関連
// ---------------------------------------------------------
let selectedCapacity = 4; // 選択中の人数

function selectCapacity(capacity) {
    selectedCapacity = capacity;
    
    // ボタンの見た目更新
    const buttons = document.querySelectorAll('#capacity-buttons .capacity-btn');
    buttons.forEach(btn => {
        const btnCap = parseInt(btn.innerText); 
        if (btnCap === capacity) btn.classList.add('selected');
        else btn.classList.remove('selected');
    });
    document.getElementById('selected-capacity-display').innerText = capacity;
}

function addTable() {
    currentTableConfig.push(selectedCapacity);
    renderTableList();
    updateStatus();
    saveToStorage(); // ★保存
}

function removeTable(index) {
    currentTableConfig.splice(index, 1);
    renderTableList();
    updateStatus();
    saveToStorage(); // ★保存
}

function renderTableList() {
    const displayArea = document.getElementById("table-list-display");
    
    if (currentTableConfig.length === 0) {
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </div>
        `;
    });
    displayArea.innerHTML = html;
}


// ---------------------------------------------------------
// 👤 メンバー入力関連
// ---------------------------------------------------------
function addMemberSingle() {
    const inputName = document.getElementById("new-member-name");
    const inputGrade = document.getElementById("new-member-grade");
    
    const name = inputName.value.trim();
    const grade = inputGrade.value;

    if (name === "") return;

    memberList.push({ name: name, grade: grade });
    inputName.value = ""; 
    
    renderMemberList();
    updateStatus();
    saveToStorage(); // ★保存
}

function removeMember(index) {
    memberList.splice(index, 1);
    renderMemberList();
    updateStatus();
    saveToStorage(); // ★保存
}

function updateMemberGrade(index, newGrade) {
    memberList[index].grade = newGrade;
    saveToStorage(); // ★保存
}

function renderMemberList() {
    const display = document.getElementById("members-list-display");
    
    if (memberList.length === 0) {
        display.innerHTML = '<p style="color: #ccc; text-align: center; padding: 20px;">まだメンバーがいません</p>';
        return;
    }

    let html = "";
    memberList.forEach((member, index) => {
        // 学年プルダウンのHTML生成
        let optionsHtml = "";
        GRADE_OPTIONS.forEach(g => {
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
                            margin-bottom: 0; height: 36px; padding: 0 35px 0 15px; 
                            font-size: 0.85rem; width: auto; background-color: #f2f2fd; 
                            border: 1px solid #dce0ff; color: #5e5ce6; font-weight: bold;
                            border-radius: 6px; cursor: pointer; flex-shrink: 0;
                        "
                        onchange="updateMemberGrade(${index}, this.value)"
                    >
                        ${optionsHtml}
                    </select>
                </div>
                <button class="delete-icon-btn" onclick="removeMember(${index})" style="flex-shrink: 0; margin-left: 10px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </div>
        `;
    });
    display.innerHTML = html;
}

function updateStatus() {
    const totalSeats = currentTableConfig.reduce((a, b) => a + b, 0);
    const totalMembers = memberList.length;

    // 左カラム
    const totalTablesEl = document.getElementById("total-tables");
    if(totalTablesEl) totalTablesEl.innerText = currentTableConfig.length;
    
    const totalSeatsEl = document.getElementById("total-seats");
    if(totalSeatsEl) totalSeatsEl.innerText = totalSeats;
    
    // 中央カラム
    const statusTotalSeatsEl = document.getElementById("status-total-seats");
    if(statusTotalSeatsEl) statusTotalSeatsEl.innerText = totalSeats;
    
    const statusMemberCountEl = document.getElementById("status-member-count");
    if(statusMemberCountEl) statusMemberCountEl.innerText = totalMembers;
}


// ---------------------------------------------------------
// 📝 一括入力関連
// ---------------------------------------------------------
function openBulkModal() {
    // 現在のリストをテキストエリアに入れる（名前のみ）
    const text = memberList.map(member => member.name).join("\n");
    document.getElementById("bulk-textarea").value = text;
    document.getElementById("bulk-modal").setAttribute("open", true);
}

function closeBulkModal() {
    document.getElementById("bulk-modal").removeAttribute("open");
}

function applyBulkInput() {
    const text = document.getElementById("bulk-textarea").value;
    memberList = []; // クリア

    const lines = text.split("\n");
    lines.forEach(line => {
        line = line.trim();
        if (line === "") return;

        // 名前, 学年 のパース処理
        const parts = line.split(/[\s,、\t]+/);
        const name = parts[0];
        let grade = "B4";

        if (parts.length > 1) {
            const inputGrade = parts[1].toUpperCase();
            if (GRADE_OPTIONS.includes(inputGrade)) {
                grade = inputGrade;
            }
        }
        memberList.push({ name: name, grade: grade });
    });
    
    closeBulkModal();
    renderMemberList();
    updateStatus();
    saveToStorage(); // ★保存
}


// ---------------------------------------------------------
// ⚙️ 設定・実行関連
// ---------------------------------------------------------

// トグルボタン切り替え
function toggleSegment(btn, groupName) {
    const parent = btn.parentElement;
    const buttons = parent.querySelectorAll('.segment-btn');
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// 実行ボタンが押された時の判断
function handleMainAction() {
    if (lastResultData !== null) {
        showResultOverlay();
    } else {
        executeShuffle();
    }
}

// 再抽選
function forceReshuffle() {
    if(!confirm("現在の結果を破棄して、作り直しますか？")) return;
    executeShuffle();
}

// 実際のAPI送信処理
async function executeShuffle() {
    const algoBtn = document.querySelector('button[onclick*="algo"].active');
    const apiMode = algoBtn ? algoBtn.getAttribute('data-value') : "balanced";

    // バリデーション
    const validMembers = memberList.filter(m => m.name !== ""); // 空の名前は除外してチェック
    if (validMembers.length === 0) { alert("参加者がいません"); return; }
    if (currentTableConfig.length === 0) { alert("テーブルを追加してください"); return; }

    const totalSeats = currentTableConfig.reduce((a, b) => a + b, 0);
    if (validMembers.length > totalSeats) {
        if (!confirm(`席数が ${validMembers.length - totalSeats} 席足りませんが実行しますか？`)) return;
    }

    // オーバーレイ表示
    document.getElementById("result-overlay").style.display = "block";
    document.body.style.overflow = "hidden";
    const resultArea = document.getElementById("result-area");
    resultArea.innerHTML = "<p style='text-align:center; margin-top:50px; font-size:1.5rem;'>🎲 抽選中...</p>";

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // 空の名前を除外して送る
            body: JSON.stringify({ 
                members: validMembers, 
                table_capacities: currentTableConfig,
                mode: apiMode 
            })
        });

        if (!response.ok) throw new Error("サーバーエラー");
        
        lastResultData = await response.json();
        renderResultContent();
        updateButtonState();

    } catch (error) {
        console.error(error);
        alert("エラーが発生しました");
        closeResult();
    }
}

// 結果描画
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

function showResultOverlay() {
    document.getElementById("result-overlay").style.display = "block";
    document.body.style.overflow = "hidden";
    renderResultContent();
}

function closeResult() {
    document.getElementById("result-overlay").style.display = "none";
    document.body.style.overflow = "";
}

function updateButtonState() {
    const mainBtn = document.getElementById("main-action-btn");
    const subBtn = document.getElementById("reshuffle-btn");
    const msg = document.getElementById("action-message");

    if (lastResultData !== null) {
        mainBtn.innerHTML = "📂 結果を見る";
        mainBtn.classList.remove("primary-btn");
        mainBtn.style.backgroundColor = "#2ecc71";
        mainBtn.style.border = "none";
        mainBtn.style.color = "white";
        subBtn.style.display = "block";
        if(msg) msg.innerHTML = "席が決まりました！<br>結果を確認できます";
    } else {
        mainBtn.innerHTML = "席を決定する";
        mainBtn.style.backgroundColor = ""; 
        mainBtn.classList.add("primary-btn");
        subBtn.style.display = "none";
        if(msg) msg.innerHTML = "準備ができたら<br>ボタンを押してください";
    }
}

function resetAll() {
    if(!confirm("すべてリセットしますか？")) return;
    currentTableConfig = [];
    memberList = [];
    lastResultData = null;
    
    // データなし状態で保存＝クリア
    saveToStorage();
    
    // リロードして初期状態（空枠6つなど）に戻すのが一番手っ取り早い
    window.location.reload();
}


// ---------------------------------------------------------
// 🎨 結果描画ロジック (座席表 / リスト)
// ---------------------------------------------------------

// 机を回転させる関数
function rotateTable(elementId) {
    const el = document.getElementById(elementId);
    let currentDeg = parseInt(el.getAttribute('data-deg') || "0");
    currentDeg += 90;
    el.style.transform = `rotate(${currentDeg}deg)`;
    el.setAttribute('data-deg', currentDeg);
}

function renderVisualResult(data, targetElement) {
    let html = "<div class='visual-table-container'>";
    
    data.tables.forEach(table => {
        const tableName = String.fromCharCode(65 + (table.table_no - 1));
        const members = table.members;
        
        const halfCount = Math.ceil(members.length / 2);
        // 幅計算
        const deskWidth = 170 + (Math.max(0, halfCount - 1) * 130);

        // 上半分の席
        const topMembers = members.slice(0, halfCount);
        let topHtml = `<div style="display:flex; gap:20px; margin-bottom:-35px; z-index:2; justify-content: center; width: 100%;">`;
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
        let bottomHtml = `<div style="display:flex; gap:20px; margin-top:-35px; z-index:2; justify-content: center; width: 100%;">`;
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
        // ★修正: onclick, cursor:pointer, title, (回転)の文字を削除しました
        html += `
            <div class="visual-table-wrapper">
                <div class="visual-table-inner">
                    ${topHtml}
                    <div class="visual-desk" style="width: ${deskWidth}px;">
                        Table ${tableName}
                    </div>
                    ${bottomHtml}
                </div>
            </div>
        `;
    });
    html += "</div>";

    if (data.waiting_list.length > 0) {
        html += renderWaitingList(data.waiting_list);
    }

    targetElement.innerHTML = html;
}

function renderListResult(data, targetElement) {
    let html = "<div class='grid'>"; 
    data.tables.forEach(table => {
        const tableName = String.fromCharCode(65 + (table.table_no - 1));
        html += `
            <div class="result-card">
                <div class="result-header">
                    <i>田</i> テーブル ${tableName} (${table.members.length}人)
                </div>
                <div class="result-members">
                    ${table.members.map((m, i) => `
                        <div class="result-member-row">
                            <span class="result-num">${i + 1}</span>
                            <span style="background:#eee; padding:2px 8px; border-radius:4px; font-size:0.8rem; color:#555; margin-right:8px; font-weight:bold;">${m.grade}</span>
                            <span style="font-weight:bold;">${m.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    html += "</div>";
    if (data.waiting_list.length > 0) {
        html += renderWaitingList(data.waiting_list);
    }
    targetElement.innerHTML = html;
}

function renderWaitingList(waitingList) {
    return `
        <hr>
        <div class="result-card" style="border-color: var(--del-color); margin-top: 30px;">
            <div class="result-header" style="background-color: #ffebee; color: var(--del-color);">
                <i>⚠️</i> あぶれた人 / 待機 (${waitingList.length}人)
            </div>
            <div class="result-members" style="display: flex; gap: 10px; flex-wrap: wrap; padding: 15px;">
                ${waitingList.map(name => `
                    <span style="background:white; padding:8px 12px; border:1px solid #ffcdd2; border-radius:6px; font-weight:bold; color:#c62828;">${name}</span>
                `).join('')}
            </div>
        </div>
    `;
}