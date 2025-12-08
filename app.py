from flask import Flask, request, abort
from linebot import LineBotApi, WebhookHandler
from linebot.exceptions import InvalidSignatureError
from linebot.models import MessageEvent, TextMessage, TextSendMessage
import os

import db
from expense_agent import chat  # 就是你原本 3.py 裡的 chat()

app = Flask(__name__)

# 從環境變數讀取 LINE 的金鑰
line_bot_api = LineBotApi(os.getenv("CHANNEL_ACCESS_TOKEN"))
handler = WebhookHandler(os.getenv("CHANNEL_SECRET"))

# 確保資料庫有建好
db.init_db()

@app.route("/callback", methods=["POST"])
def callback():
    # 取得 X-Line-Signature header
    signature = request.headers["X-Line-Signature"]

    # 取得請求 body（使用者傳來的 JSON）
    body = request.get_data(as_text=True)

    # 驗證簽章
    try:
        handler.handle(body, signature)
    except InvalidSignatureError:
        abort(400)

    return "OK"

# 只對文字訊息做處理
@handler.add(MessageEvent, message=TextMessage)
def handle_message(event: MessageEvent):
    # LINE 給你的 user id
    user_id = event.source.user_id
    # 使用者傳的文字
    user_text = event.message.text

    try:
        # 丟給你剛剛寫好的 agent
        reply_text = chat(user_text, user_id=user_id)
    except Exception as e:
        # 這裡做個保險，避免程式爆掉沒回覆
        print("chat error:", e)
        reply_text = "記帳系統目前有點問題，晚點再試試看 QQ"

    # 回傳給使用者
    line_bot_api.reply_message(
        event.reply_token,
        TextSendMessage(text=reply_text),
    )

if __name__ == "__main__":
    # 本機測試用，port 看你 ngrok 或 server 設定
    app.run(host="0.0.0.0", port=2486)
