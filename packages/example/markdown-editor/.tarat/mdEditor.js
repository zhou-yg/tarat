var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
import {
  after,
  combineLatest,
  computed,
  inputCompute,
  inputComputeInServer,
  model,
  state
} from "tarat-core";
import deps from "./mdEditor.deps.js";
Object.assign(mdEditor, {
  __deps__: deps.mdEditor
});
export default function mdEditor(q = {}) {
  const currentId = state(q.id);
  const inputMD = state("");
  const posts = model("markdown", () => {
    const cid = currentId();
    if (cid) {
      return {
        where: {
          id: cid
        }
      };
    }
  });
  const postedMD = computed(() => {
    var _a;
    return (_a = posts()[0]) == null ? void 0 : _a.content;
  });
  const displayMD = combineLatest([inputMD, postedMD]);
  const save = inputComputeInServer(() => __async(this, null, function* () {
    const cid = currentId();
    if (cid) {
      const i = posts.findIndex((p) => p.id === cid);
      if (i > -1) {
        posts((arr) => {
          arr[i].content = inputMD();
        });
      }
    } else {
      const r = yield posts.create({
        content: inputMD()
      });
      currentId(() => r.id);
    }
  }));
  after(() => {
  }, [posts]);
  return {
    displayMD,
    postedMD,
    inputMD,
    save
  };
}
