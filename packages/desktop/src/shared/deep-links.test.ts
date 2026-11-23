import { describe, expect, test } from "bun:test"
import { consoleReturnWindow, newSessionDeepLink, sessionDeepLink } from "./deep-links"

describe("session deep links", () => {
  test("reads the session id", () => {
    expect(sessionDeepLink("opencode://session/ses_abc123")).toBe("ses_abc123")
  })

  test("rejects unrelated and malformed links", () => {
    expect(sessionDeepLink("opencode://session")).toBeUndefined()
    expect(sessionDeepLink("opencode://session/")).toBeUndefined()
    expect(sessionDeepLink("opencode://session/msg_abc")).toBeUndefined()
    expect(sessionDeepLink("opencode://session/ses_abc/extra")).toBeUndefined()
    expect(sessionDeepLink("opencode://open-project?directory=/tmp")).toBeUndefined()
    expect(sessionDeepLink("https://session/ses_abc")).toBeUndefined()
    expect(sessionDeepLink("not a url")).toBeUndefined()
  })
})

describe("new session deep links", () => {
  test("reads the directory and prompt", () => {
    expect(newSessionDeepLink("opencode://new-session?directory=/tmp/demo")).toEqual({
      directory: "/tmp/demo",
      prompt: undefined,
    })
    expect(newSessionDeepLink("opencode://new-session?directory=%2Ftmp%2Fmy%20app&prompt=hello%20world")).toEqual({
      directory: "/tmp/my app",
      prompt: "hello world",
    })
    expect(newSessionDeepLink("opencode://new-session?directory=/tmp/demo&prompt=")).toEqual({
      directory: "/tmp/demo",
      prompt: undefined,
    })
  })

  test("rejects unrelated and malformed links", () => {
    expect(newSessionDeepLink("opencode://new-session")).toBeUndefined()
    expect(newSessionDeepLink("opencode://new-session?directory=")).toBeUndefined()
    expect(newSessionDeepLink("opencode://new-session?prompt=hello")).toBeUndefined()
    expect(newSessionDeepLink("opencode://session/ses_abc123")).toBeUndefined()
    expect(newSessionDeepLink("https://new-session?directory=/tmp/demo")).toBeUndefined()
    expect(newSessionDeepLink("not a url")).toBeUndefined()
  })
})

describe("Console return deep links", () => {
  test("reads the originating Desktop window", () => {
    expect(consoleReturnWindow("opencode://console/authorized?window=window-a")).toBe("window-a")
    expect(consoleReturnWindow("opencode://console/authorized?window=window%20b")).toBe("window b")
  })

  test("rejects unrelated and malformed links", () => {
    expect(consoleReturnWindow("opencode://console/other?window=window-a")).toBeUndefined()
    expect(consoleReturnWindow("opencode://other/authorized?window=window-a")).toBeUndefined()
    expect(consoleReturnWindow("https://console/authorized?window=window-a")).toBeUndefined()
    expect(consoleReturnWindow("not a url")).toBeUndefined()
    expect(consoleReturnWindow("opencode://console/authorized")).toBeUndefined()
  })
})
