// Use type safe message keys with `next-intl`
type Messages = typeof import('./messages/ja.json');

// eslint-disable-next-line no-unused-vars
declare interface IntlMessages extends Messages {}
