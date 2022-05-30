# NG Custom Dasbhoards

### Running UI against local dashboard-service

First run the build  
This is required after pulling in the latest changes or switching branches

```shell
yarn
```

Then start the webpack service pointing to your local dashboard-service

```shell
TARGET_LOCALHOST=false CUSTOM_DASHBOARDS_API_URL="http://127.0.0.1:5000" yarn dev
```

### Running Jest tests

```shell
jest src/modules/45-dashboards --coverage --collectCoverageFrom "src/modules/45-dashboards/**" --coverageReporters text
```
