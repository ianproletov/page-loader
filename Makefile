install:
	npm install
publish:
	npm publish
start:
	npx babel-node src/bin/page-loader.js
help:
	npx babel-node src/bin/page-loader.js --help
lint:
	npx eslint .
test:
	npm test