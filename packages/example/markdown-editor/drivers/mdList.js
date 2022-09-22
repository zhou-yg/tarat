import {
  after,
  combineLatest,
  computed,
  inputCompute,
  inputComputeInServer,
  model,
  state,
  writePrisma,
} from "tarat/core";

export default function mdList(q = {}) {
  const list = model("markdown", () => ({}));

  const title = state("");

  const writeList = writePrisma(list, () => ({
    title: title(),
  }));

  const addMD = inputComputeInServer(function* () {
    yield writeList.create();
    title(() => "");
  });

  return {
    title,
    addMD,
    list,
  };
}
