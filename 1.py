from openai import OpenAI
import os
import sys


def get_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("請先設定環境變數 OPENAI_API_KEY，再重新執行。", file=sys.stderr)
        sys.exit(1)
    return OpenAI(api_key=api_key)


def main() -> None:
    client = get_client()
    system_prompt = (
        "你是一位中文助理，語氣親切、回答簡潔；遇到不清楚的情況先提問確認再回答。"
    )
    conversation = [
        {"role": "system", "content": system_prompt},
    ]

    print("開始聊天！輸入 exit / quit / bye 結束。")

    while True:
        user_text = input("你: ").strip()
        if user_text.lower() in {"exit", "quit", "bye"}:
            print("助手: 掰掰，下次再聊！")
            break

        conversation.append({"role": "user", "content": user_text})

        resp = client.responses.create(
            model="gpt-5.1",
            input=conversation,
        )

        assistant_reply = resp.output[0].content[0].text.strip()
        print(f"助手: {assistant_reply}")

        conversation.append({"role": "assistant", "content": assistant_reply})


if __name__ == "__main__":
    main()
