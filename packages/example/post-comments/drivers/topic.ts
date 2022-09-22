import {
  computed,
  connectModel,
  inputComputeInServer,
  model,
  state,
  writeModel,
  writePrisma,
} from "tarat/core";

export interface ITopic {
  id?: number;
  title: string;
}

export interface ITopicProps {
  id?: number;
}

export default function topic() {
  const topics = model<ITopic[]>("topic", () => ({
    orderBy: {
      createdAt: "desc",
    },
  }));

  const inputName = state("");

  const writeTopics = writePrisma(topics, () => {
    return {
      title: inputName(),
    };
  });

  const add = inputComputeInServer(function* () {
    if (inputName()) {
      yield writeTopics.create();
      inputName(() => "");
    }
  });

  return {
    topics,
    writeTopics,
    add,
    inputName,
  };
}
