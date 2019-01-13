import { html } from "lit-element";

export function style(string, ...values) {
  let extendedStrings = string.map((el, i, arr) => {
    if (i == 0) {
      el = `<style>${el}`;
    }
    if (i == arr.length - 1) {
      el = `${el}</style>`;
    }
    return el;
  });
  return html(extendedStrings, ...values);
}
