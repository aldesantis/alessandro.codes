# frozen_string_literal: true

activate(:external_pipeline,
  name: :webpack,
  # rubocop:disable Metrics/LineLength
  command: build? ? './node_modules/webpack/bin/webpack.js --bail' : './node_modules/webpack/bin/webpack.js --watch -d',
  # rubocop:enable Metrics/LineLength
  source: 'tmp/webpack-dist',
  latency: 1,
)

ignore 'stylesheets/*'
ignore 'javascripts/*'
