import {
  after,
  combineLatest,
  computed,
  inputCompute,
  inputComputeInServer,
  model,
  progress,
  state,
  writeModel,
} from "tarat/core";
import { Markdown } from '@/models/indexes'

export default function mdEditor(q = {}) {
  const currentId = state(q.id);
  const inputMD = state("");
  const inputTitle = state("");

  const currentPost = model(Markdown, () => {
    const cid = currentId();
    if (cid) {
      return {
        where: {
          id: cid,
        },
      };
    }
  });
  const currentProgress = progress(currentPost);

  const markdownTitle = computed(() => {
    return currentPost()[0]?.title;
  });

  const postedMD = computed(() => {
    return currentPost()[0]?.content;
  });

  const displayMD = combineLatest([inputMD, postedMD]);
  const displayTitle = combineLatest([inputTitle, markdownTitle]);

  const writeCurrentMD = writeModel(currentPost, () => ({
    title: inputTitle() || displayTitle() || "",
    content: inputMD() || displayMD() || "",
  }));

  const save = inputComputeInServer(async () => {
    const cid = currentId();
    if (cid) {
      /** @TODO should analyze corect deps */
      writeCurrentMD.update(cid);
    }
  });

  return {
    currentProgress,
    displayMD,
    postedMD,
    inputMD,
    inputTitle,
    displayTitle,
    save,
  };
}
