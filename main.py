from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import random
import math

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

# データ定義
class Member(BaseModel):
    name: str
    grade: str

class ShuffleRequest(BaseModel):
    members: list[Member]
    table_capacities: list[int]
    mode: str = "balanced"  # "random" or "balanced"

# 学年の優先順位（並び替え用）
GRADE_ORDER = ["D3", "D2", "D1", "M2", "M1", "B4", "B3", "他"]

@app.get("/")
def read_root():
    return FileResponse("static/index.html")

def optimize_table_order(members):
    if not members:
        return []
    
    # 1. 学年ごとにグループ分けする（山を作る）
    # GRADE_ORDER = ["D3", "D2", ... "B4", "B3", "他"]
    grade_buckets = {g: [] for g in GRADE_ORDER}
    
    for m in members:
        # 未定義の学年は「他」へ
        g = m["grade"] if m["grade"] in grade_buckets else "他"
        grade_buckets[g].append(m)
    
    # 各山の中でシャッフル（同級生内のランダム性）
    for g in grade_buckets:
        random.shuffle(grade_buckets[g])
    
    # 2. 「トランプ配り」で1人ずつ取っていく
    result = []
    
    # まだメンバーが残っているかチェックしながらループ
    while True:
        added_in_this_round = False
        
        # 偉い順（D3 -> D2...）に山を見ていく
        for g in GRADE_ORDER:
            if grade_buckets[g]: # その学年にまだ人がいれば
                result.append(grade_buckets[g].pop(0)) # 1人取って並べる
                added_in_this_round = True
        
        # どの山も空っぽになったら終了
        if not added_in_this_round:
            break
            
    # 3. 最後に全体を「回転（カット）」させる
    # バラバラ感は保ったまま、座る位置（スタート位置）をランダムにする
    if result:
        start_index = random.randint(0, len(result) - 1)
        result = result[start_index:] + result[:start_index]
        
        # 50%で時計回り/反時計回りを変える
        if random.random() > 0.5:
            result.reverse()
            
    return result

@app.post("/shuffle")
def shuffle_seats(data: ShuffleRequest):
    # 1. 学年ごとにグループ分け
    grouped_members = {g: [] for g in GRADE_ORDER}
    
    for member in data.members:
        member_info = {"name": member.name, "grade": member.grade}
        if member.grade in grouped_members:
            grouped_members[member.grade].append(member_info)
        else:
            grouped_members["他"].append(member_info)

    # 2. 結果を入れる箱
    tables = [[] for _ in data.table_capacities]
    waiting_list = []

    if data.mode == "random":
        # 全員を辞書リストに変換してシャッフル
        all_members = [{"name": m.name, "grade": m.grade} for m in data.members]
        random.shuffle(all_members)
        
        # ★修正: 順番に詰めるのではなく、均等に配る (Round Robin)
        for member in all_members:
            # 1. 定員割れしていないテーブルを探す
            available_indices = []
            for i, capacity in enumerate(data.table_capacities):
                if len(tables[i]) < capacity:
                    available_indices.append(i)
            
            # 空きがなければあぶれへ
            if not available_indices:
                waiting_list.append(member["name"])
                continue
            
            # 2. 「現在人数」が一番少ないテーブルを探す（これで9-9になる）
            # (人数, テーブル番号) のリストを作ってソート
            candidates = sorted(available_indices, key=lambda i: len(tables[i]))
            
            # 最小人数のテーブルが複数ある場合、その中からランダムに選ぶ
            # (例: Aが4人、Bが4人なら、どっちに入れるかランダム)
            min_count = len(tables[candidates[0]])
            best_candidates = [i for i in candidates if len(tables[i]) == min_count]
            
            target_index = random.choice(best_candidates)
            tables[target_index].append(member)

    # ==========================================
    # ★分岐: バランス重視モード (前回作ったロジック)
    # ==========================================
    else:
        # ... (前回の for grade in GRADE_ORDER... から始まるロジックをここに移動) ...
        # ※長いので省略しますが、前回のロジックそのままです
        # 3. 学年順に席に割り振る
        for grade in GRADE_ORDER:
            members_in_grade = grouped_members[grade]
            random.shuffle(members_in_grade)
            
            for member_data in members_in_grade:
                
                # (A) まず、定員割れしていないテーブルだけを候補にする
                available_indices = []
                for i, capacity in enumerate(data.table_capacities):
                    if len(tables[i]) < capacity:
                        available_indices.append(i)
                
                # 空きテーブルがなければあぶれリストへ
                if not available_indices:
                    waiting_list.append(member_data["name"]) # ここは名前だけじゃなくデータごとでもOKですが、今回は名前で
                    continue

                # (B) 候補テーブルの中から「ベストなテーブル」を選ぶスコアリング
                # スコア = (そのテーブルにいる同学年の人数, そのテーブルの総人数)
                # このスコアが「最小」のところに入れる
                
                best_candidates = []
                min_score = (9999, 9999) # ありえない大きな値で初期化

                for i in available_indices:
                    # そのテーブルに今、同じ学年の人が何人いるか数える
                    same_grade_count = sum(1 for m in tables[i] if m["grade"] == member_data["grade"])
                    
                    # そのテーブルの総人数
                    total_count = len(tables[i])
                    
                    score = (same_grade_count, total_count)
                    
                    if score < min_score:
                        # より良い条件が見つかったら候補をリセットして更新
                        min_score = score
                        best_candidates = [i]
                    elif score == min_score:
                        # 同じ条件なら候補に追加（あとでランダムで選ぶ）
                        best_candidates.append(i)
                
                # (C) ベストな候補の中からランダムに選んで配置
                target_index = random.choice(best_candidates)
                tables[target_index].append(member_data)
        pass

    # 4. 最後にテーブル内の座り順をシャッフル・最適化
    result_tables = []
    for i, members in enumerate(tables):
        # 完全ランダムなら最適化（ジッパー）もしなくていいかも？
        # でも「席順」もランダムにしたいなら、単純シャッフルだけでOK
        if data.mode == "balanced":
            optimized_members = optimize_table_order(members)
        else:
            optimized_members = members # そのまま
            random.shuffle(optimized_members) # 念のため席順もシャッフル

        result_tables.append({
            "table_no": i + 1,
            "members": optimized_members
        })

    return {
        "tables": result_tables,
        "waiting_list": waiting_list
    }