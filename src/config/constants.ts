
export const FETCH_STATES_LIST = [
  {code: "02", path: '02_原因確認中（アレクシード確認）' , subscribe: 'to_アレクシード', is_to_alx: true, link_available: ["03"]},
  {code: "04", path: '04_対応中（アレクシード確認）' , subscribe: 'to_アレクシード', is_to_alx: true, link_available: ["05", "03"]},
  {code: "03", path: '03_対応確認中（エネコム確認）' , subscribe: 'to_エネコム', is_to_alx: false, link_available: ["03"]},
  {code: "05", path: '05_対応済（アレクシード確認）' , subscribe: 'to_エネコム', is_to_alx: false, link_available: []},
  {code: "01", path: '01_起票済（エネコム確認）' , subscribe: 'to_エネコム', is_to_alx: false, link_available: []}
];