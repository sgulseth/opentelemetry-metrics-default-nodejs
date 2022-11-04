"use strict";

export function aggregateByObjectName(list: Function[]) {
  const data: Record<string, number> = {};

  for (let i = 0; i < list.length; i++) {
    const listElement = list[i];

    if (!listElement || typeof listElement.constructor === "undefined") {
      continue;
    }
    const name = listElement.constructor.name
    if (Object.hasOwnProperty.call(data, name)) {
      data[name] += 1;
    } else {
      data[name] = 1;
    }
  }
  return data;
}
