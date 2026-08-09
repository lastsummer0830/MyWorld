# MyWorld — Hermes progressive entrypoint

- Hermes v0.20.0 does not progressively discover `.hermes.md` when the `ajproj` profile starts from the non-Git AJ_Proj workspace root.
- On first access to this repository, read `MyWorld/.hermes.md` and follow it as the repository authority before inspecting or changing product files.
- Do not treat `CLAUDE.md`, `.claude/**`, legacy hooks, agents, or skills as authority or execute them automatically. Hermes may inspect them read-only during an explicit Claude control-plane audit; Claude Code may use only controls that were remediated and verified against current Anthropic documentation and live CLI behavior.
- For MyWorld visual work, load `myworld-visual-qa` and `3d-scene-art-direction` before editing or approval.
