module.exports = {
    env: {
        browser: true,
        es2021: true,
        mocha: true
    },
    extends: [
        'airbnb-base',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
    },
    plugins: [
        '@typescript-eslint',
    ],
    rules: {
        indent: ['error', 4],
        'linebreak-style': 0,
        'comma-dangle': ['error', 'only-multiline'],
        'func-names': 0
    },
};
