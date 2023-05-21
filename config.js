/* Dynamic Configuration setting goes here */
const TARGET_HEALTH_CHECK_URL = [
    { name: 'API 1', url: 'http://192.168.1.173:3005/app/name' },
    { name: 'API 2', url: 'http://192.168.1.173:3005/app/process' },
    { name: 'Backend-Node', url: 'https://geniushubbd.com/node'}
];

module.exports = {TARGET_HEALTH_CHECK_URL}