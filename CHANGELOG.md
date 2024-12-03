# Changelog

## 1.2.0

### Enhancements

- Added beta support for [retrieving Trends insights](https://posthog.com/docs/product-analytics/trends/overview)
- Added automatic retry on 500 Internal Server Error responses

## 1.1.0

### Enhancements

- Added support for [retrieving insights](https://posthog.com/docs/api/insights#get-api-projects-project_id-insights-insight_id-sharing)
- Added automatic retry on 504 Gateway Timeout errors

### Bug Fixes

- Fixed an issue where nullable DateTime columns were incorrectly initialized to Unix epoch (January 1, 1970)

## 1.0.2

### Bug Fixes

- Added a workaround for Evidence's `package.json` location bug that causes data processing to fail (supersedes partial fix in 1.0.1)

## 1.0.1

### Bug Fixes

- Added a workaround for Evidence's `package.json` location bug that causes data processing to fail (temporary fix until Evidence resolves underlying issue)

## 1.0.0

### Enhancements

- Initial release
