# Release Notes

## v1.0.0 (2026-04-28)

### Highlights
- Monitoring dashboard with hotspots, keywords, and search tabs.
- Multi-source fetch across HackerNews, Reddit, GitHub, Google News RSS, Bing News RSS, and TwitterAPI.io.
- OpenRouter AI relevance analysis with json_schema response parsing.
- Local JSON persistence and notification tracking.

### API
- Keyword CRUD and toggle endpoints.
- Hotspot list, stats, and manual search endpoints.
- Manual check endpoint to trigger multi-source aggregation.

### Testing
- Lint, unit tests, and build verified.

### Configuration
- Supports `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, and `TWITTERAPI_KEY`.
