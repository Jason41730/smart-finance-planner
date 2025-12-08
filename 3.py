from openai import OpenAI
import os
import db
import json
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def call_tool(name, args):
    if name == "add_expense":
        return db.add_expense(**args)
    if name == "query_total":
        return db.query_total(**args)
    if name == "list_recent_expenses":
        return db.list_recent_expenses(**args)
    if name == "clear_expenses":
        return db.clear_expenses(**args)
    if name == "list_all_expenses":
        return db.list_all_expenses(**args)
    return {"ok": False, "error": f"unknown tool {name}"}
tools = [
    {
        "type": "function",
        "name": "add_expense",
        "description": "新增一筆消費",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string"},
                "amount": {"type": "number"},
                "category": {"type": ["string", "null"]},
                "note": {"type": "string", "default": ""},
                "ts": {
                    "type": ["string", "null"],
                    "description": "ISO 時間，可省略",
                },
            },
            "required": ["user_id", "amount"],
        },
    },
    {
        "type": "function",
        "name": "query_total",
        "description": "查詢日期區間總額",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string"},
                "start_date": {"type": "string"},
                "end_date": {"type": "string"},
            },
            "required": ["user_id", "start_date", "end_date"],
        },
    },
    {
        "type": "function",
        "name": "list_recent_expenses",
        "description": "列出最近幾筆消費（新→舊）",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string"},
                "limit": {"type": "integer", "default": 5},
            },
            "required": ["user_id"],
        },
    },
    {
        "type": "function",
        "name": "clear_expenses",
        "description": "清空指定使用者的所有紀錄",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string"},
            },
            "required": ["user_id"],
        },
    },
    {
        "type": "function",
        "name": "list_all_expenses",
        "description": "列出所有紀錄（舊→新）",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string"},
            },
            "required": ["user_id"],
        },
    },
]

def chat(user_text, user_id="u1"):
    # 1) 告訴模型這個使用者的 user_id，並要求它用這個 id 呼叫工具
    system_prompt = (
        "你是一個記帳助理。"
        f"這位使用者的 user_id 是「{user_id}」。"
        "只要呼叫任何與記帳相關的工具（add_expense, query_total, "
        "list_recent_expenses, clear_expenses, list_all_expenses），"
        "如果工具需要 user_id，就一律使用這個 user_id。"
        "不要向使用者再詢問 user_id。"
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_text},
    ]

    # 第一次：讓模型決定要不要呼叫工具
    resp = client.responses.create(
        model="gpt-5",   # 你也可以改成 gpt-4.1-mini，兩次一致即可
        input=messages,
        tools=tools,
        tool_choice="auto",
    )

    # 把第一次的所有 output 先存起來（裡面會有 reasoning + function_call）
    first_output = list(resp.output)

    # 找看看裡面有沒有 function_call
    tool_call = None
    for item in first_output:
        if item.type == "function_call":
            tool_call = item
            break

    # 如果沒有叫工具，就直接回文字
    if tool_call is None:
        return resp.output_text

    # 解析參數：可能是 dict，也可能是 JSON 字串
    raw_args = tool_call.arguments
    args = raw_args if isinstance(raw_args, dict) else json.loads(raw_args)

    # 2) 安全：如果 user_id 沒被填進 arguments，就幫它補上
    if "user_id" not in args:
        args["user_id"] = user_id

    # 呼叫你本地的 db.* 函式
    result = call_tool(tool_call.name, args)

    # 準備 function_call_output item
    call_id = getattr(tool_call, "call_id", getattr(tool_call, "id", None))
    func_output_item = {
        "type": "function_call_output",
        "call_id": call_id,
        "output": json.dumps(result, ensure_ascii=False),
    }

    # 第二次：把「原本的 messages + 第一次的 output（含 reasoning & function_call）
    # + function_call_output」全部丟回去
    follow = client.responses.create(
        model="gpt-5",
        input=messages + first_output + [func_output_item],
    )

    return follow.output_text


if __name__ == "__main__":
    # 確保資料表已經建好
    db.init_db()

    user = "alice"

    print("=== 測試 1：連續記幾筆消費 ===")
    print(chat("幫我記一筆早餐50元，備註豆漿燒餅", user_id=user))
    print(chat("幫我記一筆午餐200元，備註滷肉飯", user_id=user))
    print(chat("幫我記一筆晚餐150元，備註牛肉麵", user_id=user))
    print()

    print("=== 測試 2：列出最近幾筆紀錄 ===")
    print(chat("列出我最近的消費紀錄", user_id=user))
    print()

    print("=== 測試 3：查詢某一天的總金額（假設今天） ===")
    print(chat("幫我查一下我今天總共花了多少錢", user_id=user))
    print()

    print("=== 測試 4：查詢區間總金額（例如 2025-01-01 到 2025-12-31） ===")
    print(chat("幫我查 2025-01-01 到 2025-12-31 這段期間一共花了多少", user_id=user))
    print()

    print("=== 測試 5：列出所有紀錄（舊→新） ===")
    print(chat("把我所有的消費紀錄都列出來", user_id=user))
    print()

    print("=== 測試 6：清空所有紀錄 ===")
    print(chat("清空我所有的記帳紀錄", user_id=user))
    print()

    print("=== 測試 7：清空之後再列一次（應該是空的） ===")
    print(chat("再幫我列出最近的消費紀錄", user_id=user))