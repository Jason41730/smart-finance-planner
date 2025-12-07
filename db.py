# db.py
import sqlite3
from datetime import datetime, date

DB_PATH = "expenses.db"

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        category TEXT,
        amount REAL NOT NULL,
        note TEXT,
        ts TEXT NOT NULL
    )
    """)
    conn.commit()
    conn.close()

def add_expense(
    user_id: str,
    amount: float,
    category: str = None,
    note: str = "",
    ts: str | None = None,
):
    """
    新增一筆消費紀錄。

    參數：
    - user_id: 使用者 ID
    - amount: 金額
    - category: 類別（可為 None）
    - note: 備註
    - ts: 時間字串（可選），格式建議 'YYYY-MM-DDTHH:MM:SS'
          若為 None，則使用現在時間。
    """

    if ts is None:
        ts = datetime.now().isoformat(timespec="seconds")

    conn = get_conn()
    c = conn.cursor()
    c.execute(
        "INSERT INTO expenses (user_id, category, amount, note, ts) VALUES (?, ?, ?, ?, ?)",
        (user_id, category, amount, note, ts),
    )
    conn.commit()
    conn.close()
    return {"ok": True, "ts": ts}

def query_total(user_id: str, start_date: str, end_date: str):
    """
    start_date, end_date: 'YYYY-MM-DD'
    """
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        SELECT SUM(amount) AS total
        FROM expenses
        WHERE user_id = ?
          AND date(ts) BETWEEN date(?) AND date(?)
    """, (user_id, start_date, end_date))
    row = c.fetchone()
    conn.close()
    return {"total": row["total"] or 0.0}
def delete_last_expense(user_id: str):
    """
    刪除該 user 最新的一筆紀錄（依 id 最大或時間最新）。
    回傳：
    - {"ok": True, "deleted_id": 123} 若有刪除
    - {"ok": False, "reason": "no_record"} 若沒有紀錄
    """
    conn = get_conn()
    c = conn.cursor()

    # 找出該使用者最新的一筆（這裡用 id 最大）
    c.execute("""
        SELECT id FROM expenses
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT 1
    """, (user_id,))
    row = c.fetchone()

    if row is None:
        conn.close()
        return {"ok": False, "reason": "no_record"}

    last_id = row["id"]

    # 刪除那一筆
    c.execute("DELETE FROM expenses WHERE id = ?", (last_id,))
    conn.commit()
    conn.close()

    return {"ok": True, "deleted_id": last_id}

def list_recent_expenses(user_id: str, limit: int = 5):
    """
    回傳該 user 最近幾筆紀錄（由新到舊）。
    """
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        SELECT id, category, amount, note, ts
        FROM expenses
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT ?
    """, (user_id, limit))
    rows = c.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def print_recent_expenses(user_id: str, limit: int = 5):
    """
    直接在 terminal 印出最近幾筆，方便檢查/除錯。
    """
    rows = list_recent_expenses(user_id, limit)
    if not rows:
        print(f"[{user_id}] 目前沒有任何紀錄。")
        return

    print(f"== 使用者 {user_id} 最近 {len(rows)} 筆紀錄（新→舊） ==")
    for r in rows:
        print(f"[id={r['id']}] {r['ts']}  {r['category']}  {r['amount']} 元  ({r['note']})")
if __name__ == "__main__":
    print("初始化資料庫...")
    init_db()

    test_user = "test_user_123"
    test_date = "2022-10-08"
    test_ts = test_date + "T12:00:00"

    print("新增三筆測試資料...")
    add_expense(test_user, 50, "早餐", "豆漿燒餅", ts=test_ts)
    add_expense(test_user, 120, "午餐", "便當", ts=test_ts)
    add_expense(test_user, 80, "晚餐", "滷肉飯", ts=test_ts)

    print("\n目前紀錄：")
    print_recent_expenses(test_user, limit=10)

    from db import delete_last_expense  # 如果你有寫這個

    print("\n刪除最後一筆...")
    print(delete_last_expense(test_user))

    print("\n刪除後紀錄：")
    print_recent_expenses(test_user, limit=10)

    print(f"\n查詢 {test_date} 的總金額...")
    result = query_total(test_user, test_date, test_date)
    print("query_total 回傳：", result)