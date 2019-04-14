# alessandro.codes

This repository powers the [alessandro.codes](https://alessandro.codes) website.

## Installation

Run the following commands to install the project's dependencies:

```console
$ bundle install
$ yarn
```

## Development

To start a development Web server, run the following command:

```console
$ yarn serve
```

Your site can now be reached at http://localhost:4567! Any changes to pages or assets will cause the
site to be rebuilt.

### Linters

The app is configured with the following linters:

- [ESLint](https://eslint.org/) 
- [Sass Lint](https://github.com/sasstools/sass-lint)

You can run all linters with the following command:

```console
$ yarn lint
```

## Deployment

The site is deployed automatically via [Netlify](http://netlify.com).

If needed, you can generate a build manually with the following command:

```console
$ yarn build
```

This will build the site in the `build` directory.
