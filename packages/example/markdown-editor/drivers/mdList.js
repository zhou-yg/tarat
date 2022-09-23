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
import { Markdown } from '@/models/indexes'

export default function mdList(q = {}) {
  const list = model(Markdown, () => ({}));

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
