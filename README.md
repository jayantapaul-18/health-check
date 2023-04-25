[![pre-commit](https://img.shields.io/badge/pre--commit-enabled-brightgreen?logo=pre-commit)](https://github.com/pre-commit/pre-commit)
[![ExpressJS](https://img.shields.io/badge/ExpressJS-blue?logo=ExpressJS)](https://nodejs.org/en)
[![NodeJS](https://img.shields.io/badge/nodejs-V18-brightgreen?logo=nodejs)](https://expressjs.com/en/api.html)

# health-check

Nodejs Health Check API that responds with a JSON object based on the health status of all other backend dependencies.

# Descriptions

In this project, we define an express app that listens on port `3005`. The app has one endpoint `/health` with `GET` method.

The `backendDependencies` array holds the names and URLs of all the backend dependencies that we want to check for health status.

When a `GET request` is made to `/health`, the server iterates over all backend dependencies and makes a GET request to their /health endpoint. If the request is successful, the dependency is marked as `"OK"` in the healthStatus object, otherwise it is marked as `"Error"`.

After all APIs have been checked, the isHealthy variable is set to true if all APIs are "OK", otherwise it is set to false.

Finally, the server responds with a JSON object containing the `isHealthy` flag and an array of results for each backend API.

This API allows for GET query requests and responds with a JSON object based on the health status of all backend dependencies. It can be used to quickly check the status of all backend dependencies and take appropriate action if any of them are not functioning correctly.

# Aurora DB Health Check

The `dbConfig` object holds the configuration information for our Aurora DB.

When a `GET request` is made to `/db/health`, the server attempts to create a connection to the Aurora DB using the mysql2/promise library. If the connection is successful, the server runs a simple `SELECT 1` query to check the health of the database. If the query is successful, the server returns a JSON object with a status of "OK", otherwise it returns a JSON object with a status of `"Error"`.

# Run in local

```bash
git clone https://github.com/jayantapaul-18/health-check.git
cd health-check
npm install
node index.js
or,
npm install -g nodemon
nodemon index.js
```

## Running pre-commit checks

[pre-commit](https://pre-commit.com) installs git hooks configured in [.pre-commit-config.yaml](.pre-commit-config.yaml)

Install `pre-commit` and `commitizen` to use

```bash
brew install commitizen
brew install pre-commit

pre-commit install
pre-commit install --hook-type commit-msg
pre-commit run --all-files

git add .
git status
pre-commit run --all-files
cz c
git commit -m 'feat: health check api with backend api status response'
git push origin main --force
```

# Release - standard-version

Run the below command to create a new release `CHANGELOGS`

```bash
npm install --save-dev standard-version
npm install --save-dev commitizen
npx commitizen init cz-conventional-changelog --save-dev --save-exact
# Install commitlint cli and conventional config
npm install --save-dev @commitlint/config-conventional @commitlint/cli
# Install Husky
npm install husky --save-dev
# Activate hooks
npx husky install
# Add hook
npx husky add .husky/commit-msg 'npx --no-install commitlint --edit "$1"'
# run
npm run commit
npm run release
git push --follow-tags origin main && npm publish
```

# Request & Response

```bash
GET http://localhost:3005/health
```

`Response`

```bash
{"isHealthy":false,"healthStatus":[{"name":"API 1","status":"Error:connect ECONNREFUSED 127.0.0.1:4000"},{"name":"API 2","status":"Error:connect ECONNREFUSED 127.0.0.1:5000"},{"name":"API 3","status":"Error:connect ECONNREFUSED 127.0.0.1:6000"},{"name":"Database","status":"Error:connect ECONNREFUSED 127.0.0.1:3306"},{"name":"backend","status":"OK"}]}

```

# Using Docker

```bash
❯ docker build -t health-check .
- Need to optimize - TO DO
```
