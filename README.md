# Evidence PostHog Source Plugin

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

| Option    | Description                                                                |
| --------- | -------------------------------------------------------------------------- |
| appHost   | Base URL of your PostHog instance for private endpoints.                   |
| projectId | ID of the PostHog project you're trying to query data from.                |
| apiKey    | API key with access to the project and Read access to Insight/Query scope. |

## Source Queries

Source queries can be [configured](https://docs.evidence.dev/core-concepts/data-sources/#configure-source-queries) in two formats: `.sql` and `.insight`.

### HogQL queries

Create a `.sql` file using [HogQL](https://posthog.com/docs/hogql) syntax:

`my_source_query_with_hogql.sql`

```sql
SELECT toDate(timestamp) AS timestamp, count() AS event_count
FROM events
GROUP BY timestamp
LIMIT 100
```

### Insights

Create a `.insight` file containing either a numeric `id` or alphanumeric `short_id`. Numeric IDs are preferred for [cleaner API responses](https://posthog.com/tutorials/api-get-insights-persons#filtering-insights). Note: Only [SQL-type insights](https://posthog.com/docs/product-analytics/insights#sql-beta) are supported.

The file can contain either format:

`my_source_query_with_insight_id.insight`

```text
1234567
```

or
`my_source_query_with_insight_short_id.insight`

```text
AbcdE0FG
```

Each insight has both types of ID, which can be found in different ways:

- The `short_id` appears in the URL when viewing the insight in PostHog (e.g. `AbcdE0FG` in `https://us.posthog.com/project/00000/insights/AbcdE0FG`)
- The `id` can only be [retrieved through the API](https://posthog.com/tutorials/api-get-insights-persons#filtering-insights) using the `short_id`:

```sh
export POSTHOG_PERSONAL_API_KEY=<POSTHOG_PERSONAL_API_KEY>
export POSTHOG_PROJECT_ID=<POSTHOG_PROJECT_ID>
curl \
    -H "Authorization: Bearer $POSTHOG_PERSONAL_API_KEY" \
    <ph_app_host>/api/projects/$POSTHOG_PROJECT_ID/insights/?short_id=<YOUR_INSIGHT_SHORT_ID>
```

## PostHog Configuration

You will need to [create a personal API key](https://posthog.com/docs/api#how-to-obtain-a-personal-api-key) to access the [Query](https://posthog.com/docs/api/query#get-api-projects-project_id-query-id) and/or [Insights](https://posthog.com/docs/api/insights#get-api-projects-project_id-insights) endpoints.

You can create one in [Settings > User > Personal API keys](https://us.posthog.com/settings/user-api-keys).

Make sure to include the project specified in your data source config under **Organization & project access**, and choose the `query:read` and/or `insight:read` scopes for the API key.

To learn more, see [PostHog's API documentation](https://posthog.com/docs/api).
