import { ServerConnection, useGlobal, usePluginServers, useTabs } from "@opencode/app/desktop"
import { createEffect, onCleanup, untrack } from "solid-js"
import { newSessionDeepLink, sessionDeepLink } from "../shared/deep-links"
import type { ElectronAPI } from "./api-types"

/** Opens deep links in this window: one waiting when it starts, then each that arrives while it runs. */
export function DesktopDeepLinks(props: { api: ElectronAPI; local: ServerConnection.Key }) {
  const tabs = useTabs()
  const global = useGlobal()
  const pluginServers = usePluginServers()

  // The local server first, then the others in list order; the first that has the session opens it.
  const findServer = async (sessionID: string) => {
    const others = untrack(global.servers.list)
      .map(ServerConnection.key)
      .filter((key) => key !== props.local)

    for (const key of [props.local, ...others]) {
      const api = untrack(() => global.serverCtx(key))?.sdk.api

      if (!api) continue

      const found = await api.session.get({ sessionID }).then(
        () => true,
        () => false,
      )

      if (found) return key
    }
  }

  const openSession = async (sessionID: string) => {
    const server = await findServer(sessionID)

    if (!server) return console.warn("[deep-links] no server has session", sessionID)
    tabs.select(tabs.addSessionTab({ server, sessionId: sessionID }))
  }

  // Registers the directory's project on the local server first, so the draft starts in a listed project. A
  // directory the server can't resolve shows its error toast and opens nothing.
  const openNewSession = async (link: { directory: string; prompt?: string }) => {
    const project = await untrack(() => global.serverCtx(props.local))?.projects.add(link.directory)

    if (!project) return console.warn("[deep-links] could not open directory", link.directory)
    await tabs.newDraft({ server: props.local, directory: link.directory }, link.prompt)
  }

  const take = async () => {
    const url = await props.api.takeDeepLink()

    if (!url) return
    const sessionID = sessionDeepLink(url)

    if (sessionID) return openSession(sessionID)
    const newSession = newSessionDeepLink(url)

    if (newSession) return openNewSession(newSession)
  }

  // Tabs added before the window's tabs hydrate would be replaced by them, and plugin servers must be listed
  // before the lookup can reach them.
  createEffect(() => {
    if (!tabs.ready() || !pluginServers.ready()) return
    const run = () => void take().catch((error) => console.error("[deep-links] failed to open", error))
    onCleanup(props.api.onDeepLink(run))
    run()
  })

  return null
}
