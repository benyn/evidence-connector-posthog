# Evidence posthog Source Plugin

Install this plugin in an Evidence app with
```bash
npm install evidence-connector-posthog
```

Register the plugin in your project in your evidence.plugins.yaml file with
```bash
datasources:
  evidence-connector-posthog: {}
```

Launch the development server with `npm run dev` and navigate to the settings menu (localhost:3000/settings) to add a data source using this plugin.

## Source Options

| Option | Description |
| --- | --- |
| appHost | Base URL of your PostHog instance for private endpoints. |
| projectId | ID of the PostHog project you're trying to query data from. |
| apiKey | API key with access to the project and Read access to Query scope. |

## Source Queries

Source queries are expected to be in the form of a SQL file with the extension `.sql`.
Use [HogQL](https://posthog.com/docs/hogql) syntax.

```sql
SELECT toDate(timestamp) AS timestamp, count() AS event_count
FROM events
GROUP BY timestamp
LIMIT 100
```

## PostHog Configuration

You will need to create a personal API key to access the [Query](https://posthog.com/docs/api/query) endpoints.

You can create one in Settings > User > Personal API keys.

The API key should have access to the project you're querying and the scope should include `query:read`.

To learn more, see [PostHog's API documentation](https://posthog.com/docs/api).
